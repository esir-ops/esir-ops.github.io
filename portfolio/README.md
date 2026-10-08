# Resi Ella Sicat | Portfolio

My personal portfolio website with working demos of my projects:

- **AI'm Beautiful** (thesis): shade studio that uses MediaPipe FaceMesh, my skin tone classifier, and the real product data from the thesis app
- **Trivia Quiz REST API**: a playable quiz with the real question bank, hints, scoring, bonus rule, and a live API console
- **Digital Vending Machine**: a simulator of my Verilog module with a live waveform and the testbench scenarios
- **Blood Donation Hub**: the register, login, profile, and 56-day availability flow
- **RoboRobo robots**: lab photos plus RaceBot, SensingBot, and Boxing Bot simulators
- **SENTRY-SSF**: Packet Tracer screenshots plus a simulator of the nine IoT server automation rules

Plain HTML, CSS, and JavaScript. No build step and no frameworks.

## Folder structure

```
portfolio/
├── index.html            Page shell (nav, footer, scripts)
├── css/style.css         All styling, light and dark themes
├── js/
│   ├── app.js            Router, pages, project list, hero face mesh
│   ├── data.js           Data copied from my repos (thesis JSON, trivia questions, Verilog)
│   ├── demo-aim.js       AI'm Beautiful shade studio
│   ├── demo-trivia.js    Trivia quiz client
│   ├── demo-vending.js   Vending machine simulator
│   ├── demo-blood.js     Blood Donation Hub flow
│   ├── demo-robo.js      RoboRobo simulators
│   └── demo-sentry.js    SENTRY-SSF rule simulator
└── assets/img/           Portrait, thesis screenshots, lab photos
```

## Run it in VS Code

1. Unzip the folder and open it in VS Code (**File > Open Folder**).
2. Install the **Live Server** extension by Ritwick Dey.
3. Right-click `index.html` and choose **Open with Live Server**. It opens at `http://127.0.0.1:5500`.

No Live Server? Run this in the VS Code terminal, then open `http://localhost:8000`:

```
python -m http.server 8000
```

Open it through `http://` rather than double-clicking the file. Browsers only allow the camera on `localhost` or `https`, and the thesis demo needs internet access to load MediaPipe FaceMesh.

## Test checklist

- [ ] Home: move the cursor over the mirror, the dots react
- [ ] Projects: filter buttons show and hide cards
- [ ] AI'm Beautiful: "Use my portrait" detects a skin tone and draws the face mesh and try-on; "Use my camera" asks for permission
- [ ] Trivia: log in, answer, use a hint, finish, see the leaderboard
- [ ] Vending: insert coins, press reset, run each testbench scenario
- [ ] Blood Donation: register (try a short password), complete the profile, set a recent donation date, then try to turn on availability
- [ ] RoboRobo: run each preset, place objects for the SensingBot, punch with the Boxing Bot
- [ ] SENTRY-SSF: open the screenshots, try each quick scenario in the rule simulator
- [ ] Home: the Hide face mesh button removes the dots and remembers your choice
- [ ] Dark mode button and the mobile menu (shrink the window)

## Put it on GitHub Pages

1. On GitHub, create a new **public** repository. If you name it `esir-ops.github.io`, the site lives at `https://esir-ops.github.io/`. Any other name, like `portfolio`, gives `https://esir-ops.github.io/portfolio/`.
2. In the VS Code terminal, inside the portfolio folder:

```
git init
git add .
git commit -m "Add portfolio website"
git branch -M main
git remote add origin https://github.com/esir-ops/esir-ops.github.io.git
git push -u origin main
```

3. On GitHub, open the repository's **Settings > Pages**. Under **Build and deployment**, pick **Deploy from a branch**, then **main** and **/ (root)**, and save.
4. Wait a minute or two, then open the link GitHub shows.

To update the site later, edit the files, then run `git add .`, `git commit -m "your message"`, and `git push`.

## Editing tips

- Project cards and text live in the `PROJECTS` list and page functions in `js/app.js`.
- Add new lab photos to `assets/img/roborobo/` and list them in the `gallery([...])` call for the RoboRobo page.
- If the thesis data changes, copy the new JSON into `window.AIM_DATA` in `js/data.js`.
