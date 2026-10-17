# Separate download hosting

Git source and GitHub Pages publish website files only. They do not contain firmware binaries, firmware parts, or firmware source archives. The public UI links to the original separately hosted download site, which currently requires access permission.

For an authorized deployment on that separate download host, maintainers can place the existing release assets here and run `npm run check:release`. The browser will validate and reconstruct the original firmware. Never flash an individual part. These files remain ignored by Git.
