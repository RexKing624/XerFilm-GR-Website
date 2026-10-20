# Same-site download assets

The website deploys GR IV / HDF V1.1, GR III / HDF V1 and GR IIIx / HDF V1 test-release resources. Each model has its own manifest and output filename (fwdc248b.bin, fwdc239b.bin, fwdc243b.bin). Never flash an individual part.

The browser checks every part and the complete file. IIIx parts are AES-GCM encrypted; its download password derives the decryption key. The browser verifies the decrypted BIN against its original SHA-256 before saving. The standard GR IV build and GR III have no password. The GR IV enhanced installation build retains its separate browser-local password gate.

The GPL-2.0 license is retained here. Source archives are not deployed from this directory. Run npm run check:release and npm run test:downloads before publishing. Other local versions remain ignored by Git.
