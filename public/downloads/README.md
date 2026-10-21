# Same-site download assets

The website deploys GR IV / HDF V1.1, GR III / HDF V1.1 and GR IIIx / HDF V1.1 resources. Each model has its own manifest and output filename (fwdc248b.bin, fwdc239b.bin, fwdc243b.bin). Never flash an individual part.

The browser checks every part and the complete file. All three model releases are password-free. The browser verifies each original BIN against its SHA-256 before saving. The GR IV enhanced installation build is also password-free, after its separate installation-failure acknowledgement.

The GPL-2.0 license is retained here. Source archives are not deployed from this directory. Run npm run check:release and npm run test:downloads before publishing. Other local versions remain ignored by Git.

GR III and IIIx use R13 native Cinema integration. GR III R13 was camera-tested by the user; IIIx R13 is locally verified but awaits separate hardware testing. GR IV v23 and its enhanced build remain unchanged.

Pinned original backups are also served here: GR III/HDF 2.10, GR IIIx/HDF 1.60 and GR IV/HDF 1.11. stock-*.part* are storage chunks and cannot be flashed individually. Use the website's original-firmware modal to obtain the checked BIN. These remain manufacturer files, without XerFilm modifications.

GR III and IIIx R13-H enhanced installation test builds are encrypted separately. Their own installation-failure acknowledgement and test password are required. Neither has been hardware-tested. GR III uses 2.11.21.27; IIIx uses 1.61.11.17. Intended for event-serviced cameras still displaying 2.10 / 1.60, not official 2.20 / 1.70. The ordinary builds and camera-tested GR IV enhanced build remain password-free.
