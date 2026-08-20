#!/usr/bin/env python3
"""GSP dead-screen audit for OpenBoxes.

Classifies every GSP under grails-app/views as LIVE, TEMPLATE, DEAD, or
UNCERTAIN based on static evidence:
  - implicit view resolution (controller action name -> views/<controller>/<action>.gsp)
  - explicit render(view:...) in controllers
  - Grails webflow state views (views/<controller>/<flowName>/<state>.gsp)
  - URL mappings (UrlMappings.groovy)
  - megamenu / navigation config (grails-app/conf/runtime.groovy hrefs)
  - template inclusion (<g:render template=...>, g:include, render(template:...)
    from controllers, taglibs, services, jobs)
  - layout usage (<meta name="layout" .../>, g:applyLayout)
  - React SPA links to GSP URLs (src/js)

Usage: python3 scripts/migration/audit_gsp.py  (run from repo root)
Outputs: docs/migration/gsp-audit.csv and an evidence JSON next to it.
"""

import csv
import json
import os
import re
import sys
from collections import defaultdict

ROOT = os.getcwd()
VIEWS = os.path.join(ROOT, "grails-app", "views")


def rel(path):
    return os.path.relpath(path, ROOT).replace(os.sep, "/")


def view_rel(path):
    """Path relative to grails-app/views, no extension leading slash."""
    return os.path.relpath(path, VIEWS).replace(os.sep, "/")


def logical_name(class_name):
    """Grails logical controller name: FooBarController -> fooBar."""
    name = re.sub(r"Controller$", "", class_name)
    if len(name) > 1 and name[0].isupper() and name[1].isupper():
        return name  # e.g. JSONController stays JSON-ish per Grails rules
    return name[0].lower() + name[1:]


# ---------------------------------------------------------------- gather GSPs
all_gsps = []
for dirpath, _dirs, files in os.walk(VIEWS):
    for f in files:
        if f.endswith(".gsp"):
            all_gsps.append(view_rel(os.path.join(dirpath, f)))
all_gsps.sort()
gsp_set = set(all_gsps)

# ------------------------------------------------------------- parse sources
CONTROLLER_DIR = os.path.join(ROOT, "grails-app", "controllers")
GROOVY_DIRS = [
    CONTROLLER_DIR,
    os.path.join(ROOT, "grails-app", "taglib"),
    os.path.join(ROOT, "grails-app", "services"),
    os.path.join(ROOT, "grails-app", "jobs"),
    os.path.join(ROOT, "grails-app", "utils"),
    os.path.join(ROOT, "src", "main", "groovy"),
]

controllers = {}  # logical name -> dict(actions, file, renders, dynamic)
ACTION_RE = re.compile(r"^\s*def\s+([a-zA-Z_]\w*)\s*(?:\(|=\s*\{)", re.M)
SCAFFOLD_RE = re.compile(r"static\s+scaffold\s*=")
SCAFFOLD_ACTIONS = {"index", "list", "show", "create", "edit", "save", "update", "delete"}
CLASS_RE = re.compile(r"class\s+(\w+Controller)\b")
RENDER_VIEW_RE = re.compile(r"render\s*\(?\s*view:\s*([\"'])([^\"']+)\1")
RENDER_VIEW_DYN_RE = re.compile(r"render\s*\(?\s*view:\s*(?:[\"']?[^\"',\)]*\$\{|(?![\"']))")
TEMPLATE_RE = re.compile(r"template:\s*([\"'])([^\"']+)\1")
FLOW_RE = re.compile(r"def\s+(\w+)Flow\s*[\(=]")
QUOTED_RE = re.compile(r"[\"']([\w]+)[\"']")

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
        actions = set(ACTION_RE.findall(src))
        flows = set(FLOW_RE.findall(src))
        actions -= {fl + "Flow" for fl in flows}
        scaffolded = bool(SCAFFOLD_RE.search(src))
        if scaffolded:
            actions |= SCAFFOLD_ACTIONS
        controllers[lname] = {
            "file": rel(p),
            "actions": actions,
            "flows": flows,
            "quoted": set(QUOTED_RE.findall(src)),
            "render_views": [v for _q, v in RENDER_VIEW_RE.findall(src)],
            "render_templates": [t for _q, t in TEMPLATE_RE.findall(src)],
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

# templates referenced from any groovy source (controllers/taglibs/services/jobs)
groovy_template_refs = []  # (template_value, source_file, base_dir_hint)
VIEW_PATH_STRING_RE = re.compile(r"[\"'](/\w+(?:/\w+)+)[\"']")
groovy_view_path_refs = []  # (path_value, source_file) e.g. "/email/expiryAlerts"
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

# ------------------------------------------------------------ parse the GSPs
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
    """Resolve a g:render/render template value to a view-relative gsp path.

    `includer` is a view-relative path used as the base for relative templates
    (for controllers/taglibs pass '<logicalName>/x' as a fake base).
    """
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
        # Grails resolves relative templates against the *controller* view dir;
        # for nested includers also try the top-level dir.
        top = includer.split("/")[0] if includer and "/" in includer else None
        if top and norm != top:
            candidates.append(top + "/" + "_" + parts[-1] + ".gsp")
        candidates.append("_" + parts[-1] + ".gsp")
    for c in candidates:
        c = os.path.normpath(c).replace(os.sep, "/")
        if c in gsp_set:
            return c
    return None


# ------------------------------------------------------- root evidence (LIVE)
evidence = defaultdict(list)  # gsp -> list of evidence strings


def add_evidence(gsp, ev):
    if gsp in gsp_set and ev not in evidence[gsp]:
        evidence[gsp].append(ev)


live_roots = set()

# 1. implicit view resolution: views/<controller>/<action>.gsp
for lname, info in controllers.items():
    for action in info["actions"]:
        v = f"{lname}/{action}.gsp"
        if v in gsp_set:
            live_roots.add(v)
            add_evidence(v, f"controller action {info['file']}::{action} (implicit)")

# 2. explicit render(view:...)
for lname, info in controllers.items():
    for rv in info["render_views"]:
        if rv.startswith("/"):
            v = rv[1:] + ".gsp"
        else:
            v = f"{lname}/{rv}.gsp"
        if v in gsp_set:
            live_roots.add(v)
            add_evidence(v, f"render(view:'{rv}') in {info['file']}")

# 3. webflow state views: views/<controller>/<flow>/<state>.gsp
for lname, info in controllers.items():
    for flow in info["flows"]:
        flow_dir = f"{lname}/{flow}/"
        for g in all_gsps:
            if g.startswith(flow_dir):
                state = os.path.basename(g)[:-4]
                if state in info["quoted"]:
                    live_roots.add(g)
                    add_evidence(g, f"webflow state '{state}' in {info['file']}::{flow}Flow")

# 4. UrlMappings: explicit controller/action pairs
urlmappings = os.path.join(CONTROLLER_DIR, "org", "pih", "warehouse", "UrlMappings.groovy")
um_src = open(urlmappings, encoding="utf-8", errors="replace").read()
for m in re.finditer(r"controller:\s*[\"'](\w+)[\"'],\s*action:\s*[\"'](\w+)[\"']", um_src):
    v = f"{m.group(1)}/{m.group(2)}.gsp"
    if v in gsp_set:
        live_roots.add(v)
        add_evidence(v, "UrlMappings.groovy explicit mapping")

# 5. megamenu / navigation hrefs in runtime.groovy
runtime = os.path.join(ROOT, "grails-app", "conf", "runtime.groovy")
rt_src = open(runtime, encoding="utf-8", errors="replace").read()
for m in re.finditer(r"href:\s*[\"']/(\w+)(?:/(\w+))?", rt_src):
    ctrl, action = m.group(1), m.group(2) or "index"
    v = f"{ctrl}/{action}.gsp"
    if v in gsp_set:
        live_roots.add(v)
        add_evidence(v, f"megamenu href /{ctrl}/{action} (runtime.groovy)")

# 6. React SPA links to GSP URLs
react_links = set()
JS_DIR = os.path.join(ROOT, "src", "js")
for dirpath, dirs, files in os.walk(JS_DIR):
    dirs[:] = [d for d in dirs if d not in ("node_modules", "__snapshots__")]
    for f in files:
        if not f.endswith((".js", ".jsx", ".ts", ".tsx")):
            continue
        p = os.path.join(dirpath, f)
        src = open(p, encoding="utf-8", errors="replace").read()
        for m in re.finditer(r"/openboxes/(\w+)/(\w+)", src):
            react_links.add((m.group(1), m.group(2), rel(p)))
        for m in re.finditer(r"\$\{\s*\w*[Cc]ontext\w*\s*\}/(\w+)/(\w+)", src):
            react_links.add((m.group(1), m.group(2), rel(p)))
for ctrl, action, srcfile in react_links:
    v = f"{ctrl}/{action}.gsp"
    if v in gsp_set:
        live_roots.add(v)
        add_evidence(v, f"React SPA link in {srcfile}")

# ------------------------------------------ propagate reachability (BFS)
reached = set(live_roots)
queue = list(live_roots)
template_of = defaultdict(list)  # gsp -> includers

# groovy-side template references count as roots too (email/print bodies
# rendered by services, taglib-rendered widgets)
for tval, srcfile, hint in groovy_template_refs:
    t = resolve_template(tval, (hint + "/x") if hint else None)
    if t:
        if t not in reached:
            reached.add(t)
            queue.append(t)
        add_evidence(t, f"render(template:'{tval}') in {srcfile}")
        template_of[t].append(srcfile)

# view-path-looking string literals in groovy code (e.g. "/email/expiryAlerts"
# passed to notification/mail helpers that render it as a template or view)
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
            add_evidence(t, f"included by {cur} (g:render template='{tval}')")
            template_of[t].append(cur)
            if t not in reached:
                reached.add(t)
                queue.append(t)
    for lay in info["layouts"]:
        v = f"layouts/{lay}.gsp"
        if v in gsp_set:
            add_evidence(v, f"layout used by {cur}")
            template_of[v].append(cur)
            if v not in reached:
                reached.add(v)
                queue.append(v)
    for ctrl, action in info["includes"]:
        # g:include renders another action's view inline
        if not ctrl:
            ctrl = cur.split("/")[0]
        v = f"{ctrl}/{action}.gsp"
        if v in gsp_set:
            add_evidence(v, f"g:include from {cur}")
            if v not in reached:
                reached.add(v)
                live_roots.add(v)
                queue.append(v)

# ------------------------------------------------------ dynamic / uncertain
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
                    other, f"dynamic g:render template=\"${{...}}\" in {g}")

# webflow dirs: unreached states are uncertain (flow logic is dynamic)
for lname, info in controllers.items():
    for flow in info["flows"]:
        flow_dir = f"{lname}/{flow}/"
        for g in all_gsps:
            if g.startswith(flow_dir) and g not in reached:
                uncertain.setdefault(g, f"webflow view dir of {info['file']}::{flow}Flow")

# plugin-provided controllers whose views live in this app (view overrides)
PLUGIN_VIEW_OVERRIDES = {
    "quartz/list.gsp": "quartz-monitor plugin QuartzController.list (build.gradle)",
}
for g, ev in PLUGIN_VIEW_OVERRIDES.items():
    if g in gsp_set and g not in reached:
        reached.add(g)
        add_evidence(g, ev)

# ---------------------------------------------------------------- classify
rows = []
for g in all_gsps:
    base = os.path.basename(g)
    is_partial = base.startswith("_")
    if g in reached:
        cls = "TEMPLATE" if (is_partial or g.startswith("layouts/")) else "LIVE"
        ev = "; ".join(evidence[g][:3])
    elif g in uncertain:
        cls = "UNCERTAIN"
        ev = uncertain[g]
    else:
        cls = "DEAD"
        ev = "no static references found"
    rows.append({"path": "grails-app/views/" + g, "classification": cls, "evidence": ev})

# -------------------------------------------------- module batches for LIVE
# view-dir -> module. Batches are chunked to 3-6 screens inside each module.
MODULE_MAP = {
    "dashboard": "dashboard-auth", "auth": "dashboard-auth", "common": "dashboard-auth",
    "inventory": "inventory",
    "inventoryItem": "stock-card", "inventoryLevel": "stock-card",
    "inventorySnapshot": "inventory", "inventoryBrowser": "inventory",
    "product": "product-catalog", "productCatalog": "product-catalog",
    "productAssociation": "product-catalog", "productGroup": "product-catalog",
    "productComponent": "product-catalog", "productSupplier": "product-catalog",
    "productType": "product-catalog", "category": "product-catalog",
    "attribute": "product-catalog", "tag": "product-catalog",
    "unitOfMeasureConversion": "product-catalog",
    "location": "locations-orgs", "locationGroup": "locations-orgs",
    "locationType": "locations-orgs", "organization": "locations-orgs",
    "party": "locations-orgs", "partyRole": "locations-orgs",
    "partyType": "locations-orgs", "supplier": "locations-orgs",
    "person": "users-security", "user": "users-security", "role": "users-security",
    "requisition": "requisitions", "requisitionItem": "requisitions",
    "requisitionTemplate": "stocklists", "stocklist": "stocklists",
    "shipment": "shipments", "shipmentItem": "shipments",
    "shipmentWorkflow": "shipments", "createShipmentWorkflow": "shipment-workflow",
    "receiveOrderWorkflow": "receiving", "partialReceiving": "receiving",
    "deliveryNote": "print-documents", "goodsReceiptNote": "print-documents",
    "document": "print-documents", "doc4j": "print-documents",
    "order": "orders", "orderAdjustmentType": "orders", "purchaseOrder": "orders",
    "picklist": "picking", "putAway": "picking", "replenishment": "picking",
    "returns": "stock-transfers", "stockTransfer": "stock-transfers",
    "stockMovement": "stock-movements",
    "report": "reporting", "consumption": "reporting",
    "transactionEntry": "reporting", "json": "reporting",
    "admin": "admin-config", "batch": "admin-config", "migration": "admin-config",
    "localization": "admin-config", "jobs": "admin-config", "quartz": "admin-config",
    "dataExport": "admin-config",
    "budgetCode": "finance-config", "glAccount": "finance-config",
    "glAccountType": "finance-config", "paymentTerm": "finance-config",
    "preferenceType": "finance-config", "eventType": "finance-config",
    "invoice": "invoicing",
    "errors": "errors-misc", "mobile": "mobile",
}

def screen_kind(path):
    base = os.path.basename(path).lower()
    if "print" in base or "barcode" in base or "label" in base:
        return "print"
    if base.startswith(("list", "index", "browse")) or "list" in base:
        return "table"
    if base.startswith(("create", "edit", "add", "import", "batch", "upload")):
        return "form"
    if base.startswith(("show", "view", "display")):
        return "detail"
    if "report" in base or "export" in base:
        return "report"
    return "other"

live_rows = [r for r in rows if r["classification"] == "LIVE"]
by_module = defaultdict(list)
for r in live_rows:
    parts = r["path"].split("/")
    d = parts[2] if len(parts) > 3 else "errors"  # top-level gsps -> misc
    module = MODULE_MAP.get(d, "errors-misc" if len(parts) <= 3 else d)
    by_module[module].append(r)

batch_assignment = {}
batches = {}
for module in sorted(by_module):
    screens = sorted(by_module[module], key=lambda r: r["path"])
    n = len(screens)
    if n <= 6:
        nchunks = 1
    else:
        nchunks = (n + 5) // 6
    size = -(-n // nchunks)
    for i in range(nchunks):
        chunk = screens[i * size:(i + 1) * size]
        if not chunk:
            continue
        name = module if nchunks == 1 else f"{module}-{i + 1}"
        batches[name] = chunk
        for r in chunk:
            batch_assignment[r["path"]] = name

# ------------------------------------------------------------------- output
outdir = os.path.join(ROOT, "docs", "migration")
os.makedirs(outdir, exist_ok=True)
with open(os.path.join(outdir, "gsp-audit.csv"), "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=["path", "classification", "evidence", "proposed_batch"])
    w.writeheader()
    for r in rows:
        r["proposed_batch"] = batch_assignment.get(r["path"], "")
        w.writerow(r)

counts = defaultdict(int)
for r in rows:
    counts[r["classification"]] += 1
summary = {
    "total": len(rows),
    "counts": dict(counts),
    "live_by_dir": {},
    "batches": {},
}
live_by_dir = defaultdict(list)
for r in rows:
    if r["classification"] == "LIVE":
        d = r["path"].split("/")[2]
        live_by_dir[d].append(r["path"].split("/", 2)[2])
summary["live_by_dir"] = {k: sorted(v) for k, v in sorted(live_by_dir.items())}
for name, chunk in sorted(batches.items()):
    ctrl_dirs = sorted({r["path"].split("/")[2] for r in chunk if len(r["path"].split("/")) > 4 or True})
    kinds = defaultdict(int)
    for r in chunk:
        kinds[screen_kind(r["path"])] += 1
    summary["batches"][name] = {
        "screens": [r["path"].split("views/")[1] for r in chunk],
        "view_dirs": ctrl_dirs,
        "kinds": dict(kinds),
    }
with open(os.path.join(outdir, "gsp-audit-summary.json"), "w") as fh:
    json.dump(summary, fh, indent=2)

print(json.dumps(dict(counts), indent=2))
print("total:", len(rows))
