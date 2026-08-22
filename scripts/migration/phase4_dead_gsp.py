#!/usr/bin/env python3
"""Phase 4.4 dead-GSP analysis for OpenBoxes.

Refines the Phase 0 audit (scripts/migration/audit_gsp.py): after the 58
GSP-to-React migration batches, a controller action whose entire body is a
render of the React SPA host ("/common/react") no longer renders its
implicit views/<controller>/<action>.gsp view, so that view is removable.

A GSP is RETAINED (live) if any of the following holds:
  - implicit view resolution from a controller action that does NOT
    unconditionally render the React host;
  - explicit render(view:...)/render(template:...) anywhere in groovy code;
  - webflow state view;
  - explicit UrlMappings view mapping;
  - transitively included (g:render/g:include/layout) from a retained view
    or from groovy code (mail/print bodies);
  - referenced only dynamically (UNCERTAIN) -> retained, bias to safety.

Everything else is REMOVABLE. Output: docs/migration/phase4-dead-gsps.json
"""

import json
import os
import re
import sys
from collections import defaultdict

ROOT = os.getcwd()
VIEWS = os.path.join(ROOT, "grails-app", "views")
CONTROLLER_DIR = os.path.join(ROOT, "grails-app", "controllers")
GROOVY_DIRS = [
    CONTROLLER_DIR,
    os.path.join(ROOT, "grails-app", "taglib"),
    os.path.join(ROOT, "grails-app", "services"),
    os.path.join(ROOT, "grails-app", "jobs"),
    os.path.join(ROOT, "grails-app", "utils"),
    os.path.join(ROOT, "grails-app", "init"),
    os.path.join(ROOT, "src", "main", "groovy"),
]


def rel(path):
    return os.path.relpath(path, ROOT).replace(os.sep, "/")


def view_rel(path):
    return os.path.relpath(path, VIEWS).replace(os.sep, "/")


def logical_name(class_name):
    name = re.sub(r"Controller$", "", class_name)
    if len(name) > 1 and name[0].isupper() and name[1].isupper():
        return name
    return name[0].lower() + name[1:]


all_gsps = []
for dirpath, _dirs, files in os.walk(VIEWS):
    for f in files:
        if f.endswith(".gsp"):
            all_gsps.append(view_rel(os.path.join(dirpath, f)))
all_gsps.sort()
gsp_set = set(all_gsps)

CLASS_RE = re.compile(r"class\s+(\w+Controller)\b")
ACTION_DEF_RE = re.compile(r"^(\s*)def\s+([a-zA-Z_]\w*)\s*(\(|=\s*\{)", re.M)
SCAFFOLD_RE = re.compile(r"static\s+scaffold\s*=")
SCAFFOLD_ACTIONS = {"index", "list", "show", "create", "edit", "save", "update", "delete"}
FLOW_RE = re.compile(r"def\s+(\w+)Flow\s*[\(=]")
QUOTED_RE = re.compile(r"[\"']([\w]+)[\"']")
RENDER_VIEW_RE = re.compile(r"render\s*\(?\s*view:\s*([\"'])([^\"']+)\1")
TEMPLATE_RE = re.compile(r"template:\s*([\"'])([^\"']+)\1")
REACT_RENDER_RE = re.compile(r"render\s*\(\s*view:\s*\"/common/react\"[^)]*\)")


def extract_action_bodies(src):
    """Return {action: body} using brace matching from the def line."""
    bodies = {}
    for m in ACTION_DEF_RE.finditer(src):
        name = m.group(2)
        # find the opening brace of the method body
        i = m.end() - 1
        if m.group(3).startswith("("):
            # skip to matching close paren, then find '{'
            depth = 0
            j = src.find("(", m.start())
            while j < len(src):
                if src[j] == "(":
                    depth += 1
                elif src[j] == ")":
                    depth -= 1
                    if depth == 0:
                        break
                j += 1
            k = src.find("{", j)
        else:
            k = src.find("{", m.start())
        if k == -1:
            continue
        depth = 0
        j = k
        while j < len(src):
            if src[j] == "{":
                depth += 1
            elif src[j] == "}":
                depth -= 1
                if depth == 0:
                    break
            j += 1
        bodies[name] = src[k + 1:j]
    return bodies


def is_pure_react_action(body):
    """True if the action's only render is the React host, rendered as the
    final statement (no fall-through to implicit view, no other renders)."""
    renders = re.findall(r"\brender\b", body)
    react = REACT_RENDER_RE.findall(body)
    if len(react) != 1 or len(renders) != 1:
        return False
    # react render must be the last statement (nothing but whitespace after)
    tail = REACT_RENDER_RE.split(body)[-1]
    return tail.strip() == ""


controllers = {}
for dirpath, _dirs, files in os.walk(CONTROLLER_DIR):
    for f in files:
        if not f.endswith("Controller.groovy"):
            continue
        p = os.path.join(dirpath, f)
        src = open(p, encoding="utf-8", errors="replace").read()
        m = CLASS_RE.search(src)
        if not m:
            continue
        lname = logical_name(m.group(1))
        bodies = extract_action_bodies(src)
        flows = set(FLOW_RE.findall(src))
        actions = {a for a in bodies if a not in {fl + "Flow" for fl in flows}}
        scaffolded = bool(SCAFFOLD_RE.search(src))
        if scaffolded:
            actions |= SCAFFOLD_ACTIONS
        controllers[lname] = {
            "file": rel(p),
            "actions": actions,
            "bodies": bodies,
            "flows": flows,
            "quoted": set(QUOTED_RE.findall(src)),
            "render_views": [v for _q, v in RENDER_VIEW_RE.findall(src)],
            "scaffolded": scaffolded,
            "dynamic_render": bool(
                re.search(r"render\s*\(?\s*view:\s*[^\"'\s]", src)
                or re.search(r"render\s*\(?\s*view:\s*\"[^\"]*\$\{", src)
            ),
            "dynamic_template_render": bool(
                re.search(r"render\s*\(?\s*template:\s*[^\"'\s]", src)
                or re.search(r"render\s*\(?\s*template:\s*\"[^\"]*\$\{", src)
            ),
        }

groovy_template_refs = []
VIEW_PATH_STRING_RE = re.compile(r"[\"'](/\w+(?:/\w+)*)[\"']")
groovy_view_path_refs = []
for gdir in GROOVY_DIRS:
    if not os.path.isdir(gdir):
        continue
    for dirpath, _dirs, files in os.walk(gdir):
        for f in files:
            if not f.endswith(".groovy"):
                continue
            p = os.path.join(dirpath, f)
            src = open(p, encoding="utf-8", errors="replace").read()
            m = CLASS_RE.search(src)
            hint = logical_name(m.group(1)) if m and f.endswith("Controller.groovy") else (
                "taglib" if os.sep + "taglib" + os.sep in p else None)
            for _q, tval in TEMPLATE_RE.findall(src):
                groovy_template_refs.append((tval, rel(p), hint))
            for pval in VIEW_PATH_STRING_RE.findall(src):
                groovy_view_path_refs.append((pval, rel(p)))

G_RENDER_RE = re.compile(r"<g:render\b[^>]*?template=([\"'])([^\"'$]+)\1", re.S)
G_RENDER_DYN_RE = re.compile(r"<g:render\b[^>]*?template=[\"'][^\"']*\$\{", re.S)
LAYOUT_RE = re.compile(r"name=[\"']layout[\"']\s+content=[\"'](\w+)[\"']")
APPLY_LAYOUT_RE = re.compile(r"<g:applyLayout\b[^>]*?name=\"(\w+)\"")
G_INCLUDE_RE = re.compile(
    r"<g:include\b[^>]*?(?:controller=\"(\w+)\"[^>]*?)?action=\"(\w+)\"", re.S)

gsp_info = {}
for g in all_gsps:
    src = open(os.path.join(VIEWS, g), encoding="utf-8", errors="replace").read()
    gsp_info[g] = {
        "templates": [t for _q, t in G_RENDER_RE.findall(src)],
        "dynamic_template": bool(G_RENDER_DYN_RE.search(src)),
        "layouts": LAYOUT_RE.findall(src) + APPLY_LAYOUT_RE.findall(src),
        "includes": G_INCLUDE_RE.findall(src),
    }


def resolve_template(tval, includer):
    tval = tval.strip()
    candidates = []
    if tval.startswith("/"):
        parts = tval[1:].split("/")
        candidates.append("/".join(parts[:-1] + ["_" + parts[-1]]) + ".gsp")
    else:
        base_dir = os.path.dirname(includer) if includer else ""
        parts = tval.split("/")
        norm = os.path.normpath(os.path.join(base_dir, *parts[:-1])).replace(os.sep, "/")
        norm = "" if norm == "." else norm
        cand = (norm + "/" if norm else "") + "_" + parts[-1] + ".gsp"
        candidates.append(cand)
        top = includer.split("/")[0] if includer and "/" in includer else None
        if top and norm != top:
            candidates.append(top + "/" + "_" + parts[-1] + ".gsp")
        candidates.append("_" + parts[-1] + ".gsp")
    for c in candidates:
        c = os.path.normpath(c).replace(os.sep, "/")
        if c in gsp_set:
            return c
    return None


evidence = defaultdict(list)


def add_evidence(gsp, ev):
    if gsp in gsp_set and ev not in evidence[gsp]:
        evidence[gsp].append(ev)


live_roots = set()
react_only_views = set()  # implicit views suppressed by react-host renders

# 1. implicit view resolution, refined by react-host detection
for lname, info in controllers.items():
    for action in info["actions"]:
        v = f"{lname}/{action}.gsp"
        if v not in gsp_set:
            continue
        body = info["bodies"].get(action)
        if body is not None and is_pure_react_action(body):
            react_only_views.add(v)
            add_evidence(v, f"action {info['file']}::{action} renders /common/react only")
            continue
        live_roots.add(v)
        add_evidence(v, f"controller action {info['file']}::{action} (implicit)")

# 2. explicit render(view:...)
for lname, info in controllers.items():
    for rv in info["render_views"]:
        if rv == "/common/react":
            continue
        if rv.startswith("/"):
            v = rv[1:] + ".gsp"
        else:
            v = f"{lname}/{rv}.gsp"
        if v in gsp_set:
            live_roots.add(v)
            react_only_views.discard(v)
            add_evidence(v, f"render(view:'{rv}') in {info['file']}")

# 3. webflow state views
for lname, info in controllers.items():
    for flow in info["flows"]:
        flow_dir = f"{lname}/{flow}/"
        for g in all_gsps:
            if g.startswith(flow_dir):
                state = os.path.basename(g)[:-4]
                if state in info["quoted"]:
                    live_roots.add(g)
                    add_evidence(g, f"webflow state '{state}' in {info['file']}::{flow}Flow")

# 4. UrlMappings explicit view mappings (view: "/foo") and controller/action pairs
urlmappings = os.path.join(CONTROLLER_DIR, "org", "pih", "warehouse", "UrlMappings.groovy")
um_src = open(urlmappings, encoding="utf-8", errors="replace").read()
for m in re.finditer(r"view:\s*[\"']/?([\w/]+)[\"']", um_src):
    v = m.group(1) + ".gsp"
    if v in gsp_set:
        live_roots.add(v)
        react_only_views.discard(v)
        add_evidence(v, "UrlMappings.groovy view mapping")
for m in re.finditer(r"controller:\s*[\"'](\w+)[\"'],\s*action:\s*[\"'](\w+)[\"']", um_src):
    v = f"{m.group(1)}/{m.group(2)}.gsp"
    if v in gsp_set and v not in react_only_views:
        live_roots.add(v)
        add_evidence(v, "UrlMappings.groovy explicit mapping")

# error views mapped in UrlMappings ("500"(view:'/error')) handled above.

reached = set(live_roots)
queue = list(live_roots)

for tval, srcfile, hint in groovy_template_refs:
    t = resolve_template(tval, (hint + "/x") if hint else None)
    if t:
        if t not in reached:
            reached.add(t)
            queue.append(t)
        add_evidence(t, f"render(template:'{tval}') in {srcfile}")

for pval, srcfile in groovy_view_path_refs:
    t = resolve_template(pval, None)
    v = pval[1:] + ".gsp"
    for cand in ([t] if t else []) + ([v] if v in gsp_set else []):
        if cand not in reached:
            reached.add(cand)
            queue.append(cand)
        add_evidence(cand, f"view path string '{pval}' in {srcfile}")

while queue:
    cur = queue.pop()
    info = gsp_info.get(cur)
    if not info:
        continue
    for tval in info["templates"]:
        t = resolve_template(tval, cur)
        if t:
            add_evidence(t, f"included by {cur}")
            if t not in reached:
                reached.add(t)
                queue.append(t)
    for lay in info["layouts"]:
        v = f"layouts/{lay}.gsp"
        if v in gsp_set:
            add_evidence(v, f"layout used by {cur}")
            if v not in reached:
                reached.add(v)
                queue.append(v)
    for ctrl, action in info["includes"]:
        if not ctrl:
            ctrl = cur.split("/")[0]
        v = f"{ctrl}/{action}.gsp"
        if v in gsp_set:
            add_evidence(v, f"g:include from {cur}")
            if v not in reached:
                reached.add(v)
                queue.append(v)

# dynamic / uncertain -> retain
uncertain = {}
for lname, info in controllers.items():
    if info["dynamic_render"]:
        prefix = lname + "/"
        for g in all_gsps:
            if g.startswith(prefix) and g not in reached:
                uncertain[g] = f"dynamic render(view: <expr>) in {info['file']}"
    if info["dynamic_template_render"]:
        prefix = lname + "/"
        for g in all_gsps:
            if g.startswith(prefix) and g not in reached \
                    and os.path.basename(g).startswith("_"):
                uncertain.setdefault(
                    g, f"dynamic render(template: <expr>) in {info['file']}")
for g, info in gsp_info.items():
    if g in reached and info["dynamic_template"]:
        d = os.path.dirname(g)
        for other in all_gsps:
            if other.startswith(d + "/") and os.path.basename(other).startswith("_") \
                    and other not in reached:
                uncertain.setdefault(
                    other, f"dynamic g:render template in {g}")

for lname, info in controllers.items():
    for flow in info["flows"]:
        flow_dir = f"{lname}/{flow}/"
        for g in all_gsps:
            if g.startswith(flow_dir) and g not in reached:
                uncertain.setdefault(g, f"webflow view dir of {info['file']}::{flow}Flow")

PLUGIN_VIEW_OVERRIDES = {
    "quartz/list.gsp": "quartz-monitor plugin QuartzController.list",
}
for g, ev in PLUGIN_VIEW_OVERRIDES.items():
    if g in gsp_set and g not in reached:
        reached.add(g)
        add_evidence(g, ev)

removable = []
retained = []
for g in all_gsps:
    if g in reached:
        retained.append({"path": g, "why": "; ".join(evidence[g][:3])})
    elif g in uncertain:
        retained.append({"path": g, "why": "UNCERTAIN: " + uncertain[g]})
    else:
        why = ("react-host action" if g in react_only_views
               else "no static references")
        removable.append({"path": g, "why": why})

out = {
    "total": len(all_gsps),
    "removable_count": len(removable),
    "retained_count": len(retained),
    "removable": removable,
    "retained": retained,
}
outpath = os.path.join(ROOT, "docs", "migration", "phase4-dead-gsps.json")
with open(outpath, "w") as fh:
    json.dump(out, fh, indent=2)
print(f"total={len(all_gsps)} removable={len(removable)} retained={len(retained)}")
print(f"wrote {rel(outpath)}")
