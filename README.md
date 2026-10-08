# Resi Ella Sicat | Portfolio

This is my portfolio site: https://esir-ops.github.io/

I didn't want it to be just a list of links, so most of the projects have a small demo you can play with right on the page.

## What's in it

- **AI'm Beautiful** (our thesis). A shade studio that finds your skin tone from a photo or your camera and suggests shades. It uses the same tone detection and product data as the real app.
- **Trivia Quiz REST API**. You can play a quiz with the questions from my Flask project. Hints, scoring and the bonus point work the same way as in `routes.py`.
- **Digital Vending Machine**. A simulator of my Verilog module. Insert coins and watch the waveform.
- **Blood Donation Hub**. The register, login and profile flow from my Django project, including the 56 day rule.
- **RoboRobo robots**. Photos from our lab reports and simulators for the RaceBot, SensingBot and Boxing Bot.
- **SENTRY-SSF**. Packet Tracer screenshots and a simulator for the nine automation rules on the IoT server.

## How it's made

Just HTML, CSS and JavaScript. No framework and nothing to install or build.

- `index.html` is the nav and footer. The pages get filled in by `js/app.js`.
- `js/app.js` has the project list and all the pages.
- `js/demo-*.js` is one file per demo.
- `js/data.js` has the data I copied over from my other repos (thesis JSON, trivia questions, the Verilog code).
- `css/style.css` is all the styling, light and dark.
- `assets/img/` has my photo, thesis screenshots and lab photos.

## Running it

Open the folder in VS Code and use Live Server on `index.html`.

Don't just double click the file. The thesis demo needs the camera, and browsers only allow that on `localhost` or `https`. It also needs internet to load MediaPipe FaceMesh.

## Notes to self

- New project cards go in the `PROJECTS` list in `js/app.js`.
- New lab photos go in `assets/img/roborobo/`, then add them to the gallery on the RoboRobo page.
- If the thesis data changes, copy the new JSON into `js/data.js`.
