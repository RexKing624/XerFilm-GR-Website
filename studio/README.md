# XerFilm Studio V3.0 — public browser editor

Public source for /community/studio/. This directory contains only the browser editor and build inputs. It does not include the private author server, keys, release ledger, local drafts or uploaded files.

From the website root: npm ci --prefix studio, then npm run build. The website owns the shared header, language/theme controls and routing. The browser editor is embedded at /community/studio/editor.html.

Website V3.0 is independent of the currently distributed V2.0 camera firmware. Import needs a compatible GR IV community firmware; the firmware binaries are unchanged in this website release.

Local private author tooling remains in the separate local Studio workspace.
