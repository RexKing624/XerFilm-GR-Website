# Same-site download assets

The website deploys GR IV / HDF V1.1, GR III / HDF V1.1 and GR IIIx / HDF V1.1 resources. Each model has its own manifest and output filename (fwdc248b.bin, fwdc239b.bin, fwdc243b.bin). Never flash an individual part.

The browser checks every part and the complete file. All three model releases are password-free. The browser verifies each original BIN against its SHA-256 before saving. The GR IV enhanced installation build is also password-free, after its separate installation-failure acknowledgement.

The GPL-2.0 license is retained here. Source archives are not deployed from this directory. Run npm run check:release and npm run test:downloads before publishing. Other local versions remain ignored by Git.

GR III and IIIx use R13 native Cinema integration. GR III R13 was camera-tested by the user; IIIx R13 is locally verified but awaits separate hardware testing. GR IV v23 and its enhanced build remain unchanged.
