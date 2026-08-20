#!/usr/bin/env python3
"""Generate docs/migration/live-screen-inventory.md from the audit outputs.

Run after audit_gsp.py, from the repo root.
"""

import csv
import json
import os
from collections import defaultdict

ROOT = os.getcwd()
OUTDIR = os.path.join(ROOT, "docs", "migration")
summary = json.load(open(os.path.join(OUTDIR, "gsp-audit-summary.json")))
rows = list(csv.DictReader(open(os.path.join(OUTDIR, "gsp-audit.csv"))))
counts = summary["counts"]

KIND_LABEL = {
    "form": "forms", "table": "tables", "detail": "detail views",
    "print": "print views", "report": "reports", "other": "other",
}

def controllers_for(view_dirs):
    out = []
    for d in view_dirs:
        if d.endswith(".gsp"):
            continue
        out.append(d[0].upper() + d[1:] + "Controller")
    return sorted(set(out))

lines = []
lines.append("# OpenBoxes Live-Screen Inventory (GSP Dead-Screen Audit)")
lines.append("")
lines.append("Phase 0, task 0.2 of the GSP-to-React modernization program.")
lines.append("Audit of all GSP views under `grails-app/views` on branch `develop`.")
lines.append("")
lines.append("## Summary")
lines.append("")
lines.append("| Classification | Count | Meaning |")
lines.append("|---|---|---|")
lines.append(f"| LIVE | {counts['LIVE']} | Full screens reachable via controller actions, URL mappings, megamenu, or React SPA links |")
lines.append(f"| TEMPLATE | {counts['TEMPLATE']} | Partials/layouts included by a live view, controller, taglib, or service (email/print bodies) |")
lines.append(f"| UNCERTAIN | {counts['UNCERTAIN']} | Referenced only dynamically (e.g. `render(template: params.templateName)`); see evidence column |")
lines.append(f"| DEAD | {counts['DEAD']} | No static or dynamic references found |")
lines.append(f"| **Total** | **{summary['total']}** | |")
lines.append("")
lines.append("## Methodology")
lines.append("")
lines.append("Static analysis performed by `scripts/migration/audit_gsp.py` (rerunnable). A GSP is")
lines.append("considered reachable if any of the following evidence exists:")
lines.append("")
lines.append("1. **Implicit view resolution** — a controller action with the same name as")
lines.append("   `views/<controller>/<action>.gsp` (the default URL mapping `/$controller/$action?/$id?`")
lines.append("   makes every controller action URL-reachable). Scaffolded controllers")
lines.append("   (`static scaffold = Domain`) contribute the implicit CRUD actions.")
lines.append("2. **Explicit renders** — `render(view: ...)` / `render(template: ...)` in controllers.")
lines.append("3. **Webflow states** — `views/<controller>/<flowName>/<state>.gsp` for controllers")
lines.append("   defining `def <flowName>Flow` (createShipmentWorkflow, receiveOrderWorkflow).")
lines.append("4. **URL mappings** — explicit controller/action pairs in `UrlMappings.groovy`.")
lines.append("5. **Megamenu/navigation** — `href` entries in `grails-app/conf/runtime.groovy`.")
lines.append("6. **Template inclusion** — `<g:render template=...>`, `<g:include ...>`, layout `<meta>`")
lines.append("   tags, and `render(template:)`/view-path strings in controllers, taglibs, services,")
lines.append("   and jobs (covers email and PDF/print bodies). Inclusion is propagated transitively")
lines.append("   from live roots only, so partials referenced solely by dead views stay dead.")
lines.append("7. **React SPA links** — hard links from `src/js` to GSP URLs (`/openboxes/<ctrl>/<action>`).")
lines.append("")
lines.append("Views referenced only through dynamic expressions (e.g. product/stock-card tabs loaded via")
lines.append("`render(template: params.templateName)`) are classified **UNCERTAIN**, with the dynamic")
lines.append("reference recorded in the evidence column of `gsp-audit.csv`. `quartz/list.gsp` is a view")
lines.append("override for the quartz-monitor plugin controller and is kept LIVE.")
lines.append("")
lines.append("Notes:")
lines.append("")
lines.append("- Many high-traffic workflows (stock movements, putaway, receiving, invoicing, purchase")
lines.append("  orders) already render the React SPA host (`common/react.gsp`); their remaining GSPs are")
lines.append("  mostly legacy detail/print/support screens.")
lines.append("- LIVE includes non-UI-migratable screens (error pages, mobile mini-app, admin utilities);")
lines.append("  batches flag these so the coordinator can deprioritize or drop them.")
lines.append("")
lines.append("## Proposed React-Migration Module Batches")
lines.append("")
lines.append(f"{counts['LIVE']} live screens grouped into {len(summary['batches'])} batches of 2-6 related")
lines.append("screens. One migration child session can be spawned per batch; batches within the same")
lines.append("module prefix share domain context and are best done in order.")
lines.append("")
lines.append("| Batch | Screens | Controllers involved | Complexity notes |")
lines.append("|---|---|---|---|")
for name, b in summary["batches"].items():
    screens = "<br>".join(b["screens"])
    ctrls = ", ".join(controllers_for(b["view_dirs"]))
    kinds = ", ".join(f"{v} {KIND_LABEL[k]}" for k, v in sorted(b["kinds"].items(), key=lambda kv: -kv[1]))
    lines.append(f"| {name} | {screens} | {ctrls} | {kinds} |")
lines.append("")
lines.append("## Files")
lines.append("")
lines.append("- `docs/migration/gsp-audit.csv` — one row per GSP: path, classification, evidence,")
lines.append("  proposed batch (LIVE only).")
lines.append("- `docs/migration/gsp-audit-summary.json` — machine-readable counts and batch definitions.")
lines.append("- `scripts/migration/audit_gsp.py` — audit script (run from repo root, then")
lines.append("  `scripts/migration/generate_inventory_md.py` to regenerate this document).")
lines.append("")

open(os.path.join(OUTDIR, "live-screen-inventory.md"), "w").write("\n".join(lines))
print("wrote live-screen-inventory.md")
