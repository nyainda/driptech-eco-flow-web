---
name: Package install firewall
description: Imported dependency installs can be blocked by Replit's security policy before the app can run.
---

The imported project currently cannot install its Node dependency tree because the package firewall rejects the jspdf tarballs resolved by the existing html2pdf.js dependency.

**Why:** The server workflow and Vite build both fail before application code runs when node_modules is absent.

**How to apply:** Treat a missing Vite binary as an environment/dependency problem first. Do not change the app's PDF behavior casually; resolve the blocked dependency deliberately before claiming runtime verification.