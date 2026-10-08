/* Resi Ella R. Sicat portfolio: router, pages, shared UI */
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const app = $('#app');
  const GH = 'https://github.com/esir-ops';

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  window.PStore = store;

  // Project registry
  const PROJECTS = [
    {
      slug: 'aim-beautiful', title: "AI'm Beautiful", kind: 'Thesis / Capstone, Lead Developer', date: '2026 to present',
      cats: ['ai', 'web', 'hardware'], thumb: 'assets/img/aim/look.jpg', trio: ['assets/img/aim/welcome.jpg', 'assets/img/aim/look.jpg', 'assets/img/aim/focal.jpg'], badge: 'Live demo',
      summary: 'A smart mirror that reads your skin tone, recommends local makeup shades, and guides you step by step with AR outlines.',
      repo: GH + '/AIm_Beautiful', live: 'https://esir-ops.github.io/AIm_Beautiful/', wide: true
    },
    {
      slug: 'trivia-quiz', title: 'Trivia Quiz REST API', kind: 'Python, Flask', date: 'Mar 2025',
      cats: ['web'], thumb: null, art: 'quiz', badge: 'Playable',
      summary: 'A Flask API with 38 endpoints for quizzes, hints, scoring, and leaderboards. Play it here with the real question bank.',
      repo: GH + '/trivia-quiz'
    },
    {
      slug: 'vending-machine', title: 'Digital Vending Machine', kind: 'Verilog', date: 'Mar 2026',
      cats: ['hardware'], thumb: null, art: 'vend', badge: 'Simulator',
      summary: 'A finite state machine that accepts ₱1, ₱5, ₱10, and ₱20 coins, dispenses at ₱20, and returns change.',
      repo: GH + '/digital_vending_machine'
    },
    {
      slug: 'roborobo', title: 'RoboRobo Robots', kind: 'Embedded Systems Laboratory (CPEARCORG)', date: 'Jul 2026',
      cats: ['hardware'], thumb: 'assets/img/roborobo/sensingbot-final.jpg', badge: 'Simulator',
      summary: 'RaceBot, SensingBot, and Boxing Bot. Build a block program and watch the robot run it.'
    },
    {
      slug: 'blood-donation', title: 'Blood Donation Hub', kind: 'Django, SQLite', date: 'Sep 2024',
      cats: ['web'], thumb: null, art: 'blood', badge: 'Try the flow',
      summary: 'Donor accounts and profiles with blood type, location, and a 56-day rule before a donor can be available again.',
      repo: GH + '/Blood-Donation-Project'
    },
    {
      slug: 'sentry-ssf', title: 'SENTRY-SSF', kind: 'Cisco Packet Tracer, Emerging Technologies Midterm', date: 'Aug 2026',
      cats: ['network'], thumb: 'assets/img/sentry/topology.jpg', badge: 'Simulator',
      summary: 'A smart storage facility network with 19 devices, five VLANs, and nine IoT automation rules you can trigger yourself.'
    },
    {
      slug: 'hauvas', title: 'Hauvas++ LMS', kind: 'Django', date: 'Group project',
      cats: ['web'], thumb: null, art: 'lms',
      summary: 'A learning management system with courses, grading, a to-do app, events, and announcements.',
      repo: GH + '/hauvas', external: true
    },
    {
      slug: 'django-portfolio', title: 'Django Portfolio Website', kind: 'Django, Bootstrap', date: 'Earlier project',
      cats: ['web'], thumb: null, art: 'dj',
      summary: 'My first portfolio site, with project listings, detail pages, and a contact inquiry form.',
      repo: GH + '/djangoProject-activity', external: true
    }
  ];
  const CAT_LABELS = { all: 'All projects', ai: 'AI and vision', web: 'Web and backend', hardware: 'Hardware and embedded', network: 'Networking' };

  const ART = {
    quiz: { tone: 'lilac', text: '38', sub: 'endpoints' },
    vend: { tone: 'plum', text: '₱20', sub: 'item price' },
    blood: { tone: 'rose', text: 'O+', sub: 'blood type' },
    lms: { tone: 'sand', text: 'LMS', sub: 'Hauvas++' },
    dj: { tone: 'lilac', text: 'Django', sub: 'first portfolio' }
  };
  function thumbHTML(p) {
    if (p.trio) return `<div class="thumb-trio">${p.trio.map(s => `<img src="${s}" alt="" loading="lazy">`).join('')}</div>`;
    if (p.thumb) return `<img src="${p.thumb}" alt="" loading="lazy"${p.thumbPos ? ` style="object-position:${p.thumbPos}"` : ''}>`;
    const a = ART[p.art] || ART.quiz;
    return `<div class="thumb-art t-${a.tone}"><b>${a.text}</b><small>${a.sub}</small></div>`;
  }
  function cardHTML(p) {
    const href = p.external ? p.repo : `#/projects/${p.slug}`;
    const target = p.external ? ' target="_blank" rel="noopener"' : '';
    const cta = p.external ? 'View code on GitHub' : (p.badge ? 'Open and try it' : 'Read more');
    return `<a class="pcard${p.wide ? ' wide' : ''}" href="${href}"${target} data-cats="${p.cats.join(' ')}">
      <div class="thumb">${thumbHTML(p)}${p.badge ? `<span class="badge">${p.badge}</span>` : ''}</div>
      <div class="body"><span class="kind">${p.kind}</span><h3>${p.title}</h3><p>${p.summary}</p><span class="try">${cta}</span></div>
    </a>`;
  }

  // Pages
  function pageHome() {
    const featured = PROJECTS.filter(p => !p.external).slice(0, 5);
    app.innerHTML = `
    <div class="wrap page">
      <section class="hero">
        <div>
          <p class="hello">Hi, I'm</p>
          <h1><span>Resi Ella</span><span>R. Sicat.</span></h1>
          <p class="lede">I'm a fourth-year <strong>Computer Engineering</strong> student at Holy Angel University. I build things that sit between software and hardware: web apps, APIs, robots, IoT networks, and right now, <strong>a smart mirror that teaches you how to do your makeup.</strong></p>
          <div class="actions">
            <a class="btn" href="#/projects">Explore my projects</a>
            <a class="btn ghost" href="#/projects/aim-beautiful">Try my thesis demo</a>
          </div>
          <div class="meta"><span><b>Based in</b> Angeles City, Pampanga</span><span><b>Looking for</b> OJT, Nov 2026</span></div>
        </div>
        <div class="mirror-zone">
          <div class="mirror"><div class="glass"><img src="assets/img/resi.jpg" alt="Portrait of Resi Ella R. Sicat"><canvas id="mesh" aria-hidden="true"></canvas></div></div>
          <p class="mirror-note" id="meshNote">Move your cursor over the mirror. The dots mimic the face mesh my thesis uses to track a face in real time.</p>
          <button class="chip-btn" type="button" id="meshToggle" aria-pressed="true" style="margin-top:10px">Hide face mesh</button>
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Things you can try</h2><p>Every project below has a working demo built from the actual code and data in my repositories.</p></div>
        <div class="proj-grid">${featured.map(cardHTML).join('')}</div>
        <div style="margin-top:24px"><a class="btn ghost" href="#/projects">See all projects</a></div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Toolkit</h2><p>Languages and tools I've used in real projects, not just class exercises.</p></div>
        ${toolkitHTML()}
      </section>
    </div>`;
    initMesh();
  }

  function toolkitHTML() {
    const g = [
      ['Programming', ['Python', 'JavaScript', 'HTML', 'CSS', 'Verilog', 'Django', 'Flask', 'REST APIs', 'SQLite']],
      ['AI and vision', ['MediaPipe FaceMesh', 'TensorFlow.js', 'Custom-trained image classifiers']],
      ['Networking and IoT', ['Cisco Packet Tracer', 'VLANs', 'Routing and switching', 'Raspberry Pi', 'Arduino', 'RoboRobo']],
      ['Design and tools', ['Git and GitHub', 'GitHub Pages', 'draw.io', 'Modelio (UML)', 'MS Office']]
    ];
    return `<div class="toolkit">${g.map(([h, items]) => `<div><h4>${h}</h4><ul>${items.map(i => `<li>${i}</li>`).join('')}</ul></div>`).join('')}</div>`;
  }

  function pageProjects() {
    const cat = store.get('pf-filter', 'all');
    app.innerHTML = `
    <div class="wrap page">
      <div class="page-head"><h2>Projects</h2><p class="lede" style="margin-top:14px">Thesis work, lab projects, and things I built to learn. Open one to read how it works and try it yourself.</p></div>
      <div class="filters" role="group" aria-label="Filter projects">
        ${Object.entries(CAT_LABELS).map(([k, v]) => `<button class="chip-btn" type="button" data-cat="${k}" aria-pressed="${k === cat}">${v}</button>`).join('')}
      </div>
      <div class="proj-grid" id="projGrid">${PROJECTS.map(p => cardHTML({ ...p, wide: false })).join('')}</div>
    </div>`;
    const apply = c => {
      document.querySelectorAll('.chip-btn').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === c)));
      document.querySelectorAll('#projGrid .pcard').forEach(el => { el.style.display = (c === 'all' || el.dataset.cats.split(' ').includes(c)) ? '' : 'none'; });
      store.set('pf-filter', c);
    };
    document.querySelectorAll('.chip-btn').forEach(b => b.addEventListener('click', () => apply(b.dataset.cat)));
    apply(cat);
  }

  function detailHead(p, extra = '') {
    return `
      <div class="crumbs"><a href="#/projects">Projects</a> / ${p.title}</div>
      <div class="detail-head">
        <div>
          <span class="badge" style="margin-bottom:14px">${p.kind}</span>
          <h1 style="font-size:clamp(42px,6.5vw,84px)">${p.title}</h1>
          <p class="lede" style="margin-top:18px">${p.summary}</p>
          <div class="actions" style="margin-top:22px">
            <a class="btn blush" href="#demo">Try it below</a>
            ${p.live ? `<a class="btn" href="${p.live}" target="_blank" rel="noopener">Open the full app</a>` : ''}
            ${p.repo ? `<a class="btn ghost" href="${p.repo}" target="_blank" rel="noopener">View code on GitHub</a>` : ''}
          </div>
        </div>
        <div>${extra}</div>
      </div>`;
  }
  function demoShell(title, src, body) {
    return `<div class="demo" id="demo"><div class="demo-bar"><div class="dots"><i></i><i></i><i></i></div><span class="title">${title}</span><span class="src">${src}</span></div><div class="demo-body">${body}</div></div>`;
  }
  function gallery(items) {
    return `<div class="gallery">${items.map(([src, cap]) => `<figure data-full="${src}" data-cap="${cap}" tabindex="0"><img src="${src}" alt="${cap}" loading="lazy"><figcaption>${cap}</figcaption></figure>`).join('')}</div>`;
  }

  function pageProject(slug) {
    const p = PROJECTS.find(x => x.slug === slug);
    if (!p || p.external) return page404();
    const html = {
      'aim-beautiful': () => `
        ${detailHead(p, `<div class="facts">
          <div><b>My role</b>Lead developer, repo owner, model training</div>
          <div><b>Team</b>Group 11, BS Computer Engineering</div>
          <div><b>Tracking</b>MediaPipe FaceMesh, 468 points</div>
          <div><b>Models</b>Glasses and covered-face detectors I trained with TensorFlow.js</div>
          <div><b>Brands</b>Squad, Detail, and Chu Chü Beauty</div>
          <div><b>Privacy</b>No photos or data leave the device</div></div>`)}
        <section class="section">
          <div class="section-head"><h2>Screens from the app</h2><p>Captured from the current build. The mirror runs on a portrait screen behind tinted glass.</p></div>
          <div class="shots">
            ${[['assets/img/aim/welcome.jpg', 'Welcome screen'], ['assets/img/aim/look.jpg', 'Choose a makeup look'], ['assets/img/aim/focal.jpg', 'Choose a focal point']].map(([s, c]) => `<figure data-full="${s}" data-cap="${c}" tabindex="0"><img src="${s}" alt="${c}" loading="lazy"><figcaption>${c}</figcaption></figure>`).join('')}
          </div>
        </section>
        <section class="section">
          <div class="section-head"><h2>How a session works</h2><p>This is the flow in the real app, from the first tap to the saved look.</p></div>
          <ol class="flow">
            <li><b>Welcome</b>Tap Let's Begin, or open saved looks.</li>
            <li><b>Makeup look</b>Professional, Date / Casual Glam, Party / Glam, or School.</li>
            <li><b>Focal point</b>Lips, eyebrows, cheeks, or contour.</li>
            <li><b>Camera</b>A 3, 2, 1 capture that blocks glasses, a covered face, or movement.</li>
            <li><b>Shades</b>One product per category from three local brands, with live try-on.</li>
            <li><b>Style</b>Compare sheer, balanced, and full coverage on your own photo.</li>
            <li><b>Foundation</b>A Detail Fresh Filter shade for your skin tone.</li>
            <li><b>Guide</b>Four steps with AR outlines and placement and quality checks.</li>
            <li><b>Summary</b>See results for each step and save the look.</li>
          </ol>
        </section>
        <section class="section">
          <div class="section-head"><h2>Try the shade studio</h2><p>This demo uses the same tone classifier, product data, and scoring as the thesis app.</p></div>
          ${demoShell('Shade studio', 'app.js + data/*.json from AIm_Beautiful', '<div id="aimDemo"></div>')}
        </section>`,
      'vending-machine': () => `
        ${detailHead(p, `<div class="figs"><div><b>4</b>coin types</div><div><b>₱20</b>item price</div><div><b>3</b>outputs</div></div>`)}
        <section class="section">
          <div class="section-head"><h2>Run the machine</h2><p>Each coin press is one clock edge, exactly like <code>insert_coin()</code> in the testbench. The waveform updates as you go.</p></div>
          ${demoShell('Vending machine simulator', 'vending_machine.v', '<div id="vendDemo"></div>')}
        </section>`,
      'trivia-quiz': () => `
        ${detailHead(p, `<div class="figs"><div><b>38</b>endpoints</div><div><b>57</b>questions</div><div><b>5</b>categories</div></div>`)}
        <section class="section">
          <div class="section-head"><h2>Play a quiz session</h2><p>Questions come from the project's database. Hints, answer checking, and the bonus rule follow <code>routes.py</code>. The console shows the API calls the real backend would receive.</p></div>
          ${demoShell('Trivia Quiz client', 'routes.py + instance/trivia.db', '<div id="triviaDemo"></div>')}
        </section>`,
      'blood-donation': () => `
        ${detailHead(p, `<div class="facts"><div><b>Framework</b>Django with a custom user model</div><div><b>Login</b>Email as the username</div><div><b>Profile</b>Blood type, weight, height, and location</div><div><b>Rule</b>56 days between donations</div></div>`)}
        <section class="section">
          <div class="section-head"><h2>Go through the donor flow</h2><p>Register, complete your profile, then try to mark yourself available. Validation follows <code>forms.py</code> and <code>views.py</code>. Nothing leaves your browser.</p></div>
          ${demoShell('Blood Donation Hub', 'account/views.py + forms.py', '<div id="bloodDemo"></div>')}
        </section>`,
      'roborobo': () => `
        ${detailHead(p, `<div class="facts"><div><b>My role</b>Hardware and code support, report documentation</div><div><b>Team</b>Seven members</div><div><b>Kit</b>RoboRobo CPU board, DC motor drive board, IR sensors, LEDs</div><div><b>Software</b>RoboRobo block programming</div></div>`)}
        <section class="section">
          <div class="section-head"><h2>From the lab</h2><p>Photos from our laboratory output reports, from wiring to the final runs.</p></div>
          ${gallery([
            ['assets/img/roborobo/racebot-testing.jpg', 'RaceBot with its LED board during testing'],
            ['assets/img/roborobo/racebot-final.jpg', 'RaceBot final build'],
            ['assets/img/roborobo/racebot-programming.jpg', 'Uploading a block sequence to the CPU board'],
            ['assets/img/roborobo/racebot-floor-test.jpg', 'Floor test of turning and spinning'],
            ['assets/img/roborobo/sensingbot-wiring.jpg', 'SensingBot wiring, following the manual'],
            ['assets/img/roborobo/sensingbot-programming.jpg', 'Building the IF-Else sequence in the RoboRobo software'],
            ['assets/img/roborobo/sensingbot-final.jpg', 'SensingBot final build'],
            ['assets/img/roborobo/sensingbot-floor-test.jpg', 'Testing obstacle detection with a book']
          ])}
        </section>
        <section class="section">
          <div class="section-head"><h2>Program the robots</h2><p>Build a block sequence like we did in the RoboRobo software, then run it. Behavior follows what we observed in our lab reports.</p></div>
          ${demoShell('RoboRobo simulator', 'Based on our lab reports', '<div id="roboDemo"></div>')}
        </section>
        <section class="section">
          <div class="section-head"><h2>What we ran into</h2><p>The problems were the most useful part.</p></div>
          <div class="toolkit">
            <div><h4>Board not detected</h4><p class="muted">The PC only read the CPU board when the battery was connected before the USB cable.</p></div>
            <div><h4>Mismatched ports</h4><p class="muted">We traced each 3-pin cable and reconnected OUT 1 to 4 to the motor drive board in order.</p></div>
            <div><h4>Turns off target</h4><p class="muted">We tuned motor speed and delay values through repeated runs until turns landed cleanly.</p></div>
            <div><h4>Dark objects missed</h4><p class="muted">The IR sensor relies on reflected light, so it caught white objects and missed dark ones.</p></div>
          </div>
        </section>`,
      'sentry-ssf': () => `
        ${detailHead(p, `<div class="figs"><div><b>19</b>devices</div><div><b>5</b>VLANs</div><div><b>9</b>server rules</div><div><b>24</b>test cases</div></div>`)}
        <section class="section">
          <div class="section-head"><h2>The build</h2><p>A smart storage facility modeled on our CpE lab storage room, built in Cisco Packet Tracer with my groupmates Samia and Viray.</p></div>
          <div class="toolkit">
            <div><h4>Two-tier design</h4><p class="muted">Tier 1 fire and environment clusters run on hard-wired pins with zero network, so safety never depends on the server. Tier 2 adds central monitoring, remote control, and the wireless segment.</p></div>
            <div><h4>Segmented network</h4><p class="muted">Router-on-a-stick on an ISR 2911 and a Catalyst 2960 with VLANs for IoT devices, management, services, and native management. Every unused port is parked in VLAN 999 and shut down.</p></div>
            <div><h4>Hardened access</h4><p class="muted">Port security in Restrict mode, a login banner, WPA2-PSK wireless, and unused server services turned off.</p></div>
          </div>
        </section>
        <section class="section">
          <div class="section-head"><h2>Screenshots</h2><p>Straight from the Packet Tracer file and our test documentation.</p></div>
          ${gallery([
            ['assets/img/sentry/topology.jpg', 'Full topology: infrastructure, central services, Tier 1 clusters, and the wireless segment'],
            ['assets/img/sentry/vlans.jpg', 'show vlan brief: five VLANs, with unused ports parked and disabled'],
            ['assets/img/sentry/tier1-fire.jpg', 'Tier 1 fire cluster: smoke sensor, MCU, and siren on hard-wired I/O'],
            ['assets/img/sentry/rules.jpg', 'The nine automation rules on the IoT server'],
            ['assets/img/sentry/door-before.jpg', 'Door control from the IoT dashboard, before'],
            ['assets/img/sentry/door-after.jpg', 'Door control from the IoT dashboard, after'],
            ['assets/img/sentry/port-security.jpg', 'Port security catching a rogue device on Fa0/5'],
            ['assets/img/sentry/services-off.jpg', 'Hardening the IoT server by turning off unused services']
          ])}
        </section>
        <section class="section">
          <div class="section-head"><h2>Try the automation rules</h2><p>Move the sensors and watch which server rules fire and what the actuators do.</p></div>
          ${demoShell('SENTRY-SSF rule simulator', 'IoT server conditions, SSF-SRV-IOT-01', '<div id="sentryDemo"></div>')}
        </section>`
    }[slug];
    if (!html) return page404();
    app.innerHTML = `<div class="wrap page">${html()}</div>`;
    const mounts = { 'aim-beautiful': ['aimDemo', window.AimDemo], 'vending-machine': ['vendDemo', window.VendDemo], 'trivia-quiz': ['triviaDemo', window.TriviaDemo], 'blood-donation': ['bloodDemo', window.BloodDemo], 'roborobo': ['roboDemo', window.RoboDemo], 'sentry-ssf': ['sentryDemo', window.SentryDemo] };
    const m = mounts[slug];
    if (m && m[1]) { try { m[1].mount(document.getElementById(m[0])); } catch (e) { console.error(e); document.getElementById(m[0]).innerHTML = '<p class="err">This demo could not start. Reload the page to try again.</p>'; } }
  }

  function pageAbout() {
    app.innerHTML = `
    <div class="wrap page">
      <div class="about">
        <div>
          <h2>About me</h2>
          <p class="big" style="margin:28px 0 22px">I like figuring out why something doesn't work, then making it work. Most of what I know, I learned by building it.</p>
          <p class="muted">I'm a fourth-year BS Computer Engineering student at Holy Angel University and the lead developer of our thesis, AI'm Beautiful. Outside of projects, I served as SEA Senator in our University Student Government and I'm a member of ICpEP.SE.</p>
          <p class="muted">I speak English and Filipino, and I'm quick to adjust to new teams and new tools.</p>
          <div class="actions" style="margin-top:24px"><a class="btn" href="#/contact">Contact me</a><a class="btn ghost" href="${GH}" target="_blank" rel="noopener">GitHub profile</a></div>
        </div>
        <ol class="timeline" aria-label="Milestones">
          <li><span class="when">A.Y. 2026-2027</span><b>HAU Academic Scholarship Recipient</b></li>
          <li><span class="when">2026 to present</span><b>Lead Developer, AI'm Beautiful thesis</b></li>
          <li><span class="when">2nd Sem, A.Y. 2025-2026</span><b>President's Lister</b></li>
          <li><span class="when">1st Sem, A.Y. 2025-2026</span><b>Dean's Lister</b></li>
          <li><span class="when">Jun 2025</span><b>CCNA: Switching, Routing, and Wireless Essentials</b></li>
          <li><span class="when">2024 to 2025</span><b>SEA Senator, HAU University Student Government</b></li>
          <li><span class="when">Nov 2024</span><b>CCNAv7: Introduction to Networks</b></li>
          <li><span class="when">Jul 2024</span><b>IT Essentials: PC Hardware and Software</b></li>
          <li><span class="when">2023</span><b>Top Achiever in Algebra and Trigonometry, SEA Bridging Program</b></li>
          <li><span class="when">2021 to 2023</span><b>Senior High School, STEM, With Honors</b></li>
        </ol>
      </div>
      <section class="section"><div class="section-head"><h2>Toolkit</h2></div>${toolkitHTML()}</section>
    </div>`;
  }

  function pageContact() {
    app.innerHTML = `
    <div class="wrap page">
      <div class="contact-card">
        <div>
          <h2>Let's work together.</h2>
          <p class="muted" style="margin-top:18px">I'm looking for an OJT placement where I can learn from a real team and help where I'm needed. I can start as early as November 2026.</p>
          <div class="actions" style="margin-top:22px">
            <a class="btn" href="mailto:re.sicat.3104@gmail.com">re.sicat.3104@gmail.com</a>
            <a class="btn ghost" href="${GH}" target="_blank" rel="noopener">github.com/esir-ops</a>
          </div>
        </div>
        <form class="form-card" id="mailForm" novalidate>
          <div class="field"><label for="mName">Your name</label><input id="mName" type="text" autocomplete="name"></div>
          <div class="field"><label for="mOrg">Company</label><input id="mOrg" type="text" autocomplete="organization"></div>
          <div class="field"><label for="mMsg">Message</label><textarea id="mMsg" rows="5"></textarea></div>
          <button class="btn" type="submit">Open in my email app</button>
          <p class="err" id="mErr" role="alert"></p>
          <p class="muted" style="font-size:13.5px;margin:6px 0 0">This opens a new email to me with your message filled in.</p>
        </form>
      </div>
    </div>`;
    $('#mailForm').addEventListener('submit', e => {
      e.preventDefault();
      const n = $('#mName').value.trim(), o = $('#mOrg').value.trim(), m = $('#mMsg').value.trim();
      if (!n || !m) { $('#mErr').textContent = 'Add your name and a message first.'; return; }
      $('#mErr').textContent = '';
      const subject = `Hello from ${n}${o ? ' (' + o + ')' : ''}`;
      window.location.href = `mailto:re.sicat.3104@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(m)}`;
    });
  }

  function page404() {
    app.innerHTML = `<div class="wrap page"><h2>Page not found</h2><p class="lede" style="margin:16px 0 24px">That page doesn't exist. Head back to the projects list to find what you need.</p><a class="btn" href="#/projects">Go to projects</a></div>`;
  }

  // Router
  function route() {
    const h = location.hash.replace(/^#/, '') || '/';
    if (h === 'demo') return; // in-page anchor
    const parts = h.split('/').filter(Boolean);
    window.dispatchEvent(new Event('pf:leave'));
    let nav = 'home';
    if (!parts.length) pageHome();
    else if (parts[0] === 'projects' && parts[1]) { nav = 'projects'; pageProject(parts[1]); }
    else if (parts[0] === 'projects') { nav = 'projects'; pageProjects(); }
    else if (parts[0] === 'about') { nav = 'about'; pageAbout(); }
    else if (parts[0] === 'contact') { nav = 'contact'; pageContact(); }
    else { nav = ''; page404(); }
    document.querySelectorAll('[data-nav]').forEach(a => { if (a.dataset.nav === nav) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    $('#navLinks').classList.remove('open'); $('#menuBtn').setAttribute('aria-expanded', 'false');
    const titles = { home: 'Resi Ella R. Sicat | Portfolio', projects: 'Projects | Resi Ella R. Sicat', about: 'About | Resi Ella R. Sicat', contact: 'Contact | Resi Ella R. Sicat' };
    const pj = PROJECTS.find(p => p.slug === parts[1]);
    document.title = pj ? `${pj.title} | Resi Ella R. Sicat` : (titles[nav] || 'Resi Ella R. Sicat');
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }
  // "Try it below" links point to #demo; keep them from changing the route
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href="#demo"]');
    if (a) { e.preventDefault(); document.getElementById('demo')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
  });
  window.addEventListener('hashchange', route);

  // Lightbox
  const lb = $('#lightbox');
  function openLB(src, cap) { $('#lbImg').src = src; $('#lbImg').alt = cap; $('#lbCap').textContent = cap; lb.classList.add('open'); $('#lbClose').focus(); }
  function closeLB() { lb.classList.remove('open'); }
  document.addEventListener('click', e => { const f = e.target.closest('figure[data-full]'); if (f) openLB(f.dataset.full, f.dataset.cap); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLB();
    const f = e.target.closest && e.target.closest('figure[data-full]');
    if (f && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openLB(f.dataset.full, f.dataset.cap); }
  });
  $('#lbClose').addEventListener('click', closeLB);
  lb.addEventListener('click', e => { if (e.target === lb) closeLB(); });

  // Theme + menu
  const savedTheme = store.get('pf-theme', null);
  if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
  $('#themeBtn').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next); store.set('pf-theme', next);
  });
  $('#menuBtn').addEventListener('click', () => {
    const open = $('#navLinks').classList.toggle('open');
    $('#menuBtn').setAttribute('aria-expanded', String(open));
  });

  // Hero face mesh
  function initMesh() {
    const canvas = document.getElementById('mesh'); if (!canvas) return;
    const glass = canvas.parentElement, ctx = canvas.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, pts = [], edges = [], pointer = { x: -999, y: -999, active: false }, start = performance.now(), alive = true;
    let visible = store.get('pf-mesh', true);
    const btn = document.getElementById('meshToggle');
    const syncBtn = () => { btn.textContent = visible ? 'Hide face mesh' : 'Show face mesh'; btn.setAttribute('aria-pressed', String(visible)); canvas.style.display = visible ? '' : 'none'; document.getElementById('meshNote').hidden = !visible; };
    btn.addEventListener('click', () => { visible = !visible; store.set('pf-mesh', visible); if (visible) start = performance.now(); syncBtn(); requestAnimationFrame(frame); });
    syncBtn();
    const color = () => getComputedStyle(document.documentElement).getPropertyValue('--blush').trim() || '#C9466F';
    function build() {
      const r = glass.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cx = W * .5, cy = H * .36, rx = W * .22, ry = H * .205; pts = [];
      for (let i = 0; i <= 7; i++) { const t = i / 7, n = i === 0 ? 1 : Math.round(6 + i * 5); for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + i * .37; const x = cx + Math.cos(a) * rx * t, y = cy + Math.sin(a) * ry * t; pts.push({ x, y, bx: x, by: y, d: Math.hypot((x - cx) / rx, (y - cy) / ry) }); } }
      edges = []; const maxD = Math.min(W, H) * .075;
      for (let i = 0; i < pts.length; i++) { const near = []; for (let j = 0; j < pts.length; j++) { if (i === j) continue; const d = Math.hypot(pts[i].bx - pts[j].bx, pts[i].by - pts[j].by); if (d < maxD) near.push([d, j]); } near.sort((a, b) => a[0] - b[0]).slice(0, 3).forEach(([, j]) => { if (i < j) edges.push([i, j]); }); }
    }
    function frame(now) {
      if (!alive || !document.body.contains(canvas) || !visible) return;
      ctx.clearRect(0, 0, W, H); const c = color(), t = reduce ? 99 : (now - start) / 1000, time = reduce ? 0 : now / 1000, R = Math.min(W, H) * .22;
      pts.forEach((p, i) => { let x = p.bx + Math.sin(time * 1.3 + i) * .6, y = p.by + Math.cos(time * 1.1 + i * .7) * .6; if (pointer.active) { const dx = x - pointer.x, dy = y - pointer.y, d = Math.hypot(dx, dy); if (d < R) { const f = (1 - d / R) * 10; x += dx / (d || 1) * f; y += dy / (d || 1) * f; } } p.x = x; p.y = y; });
      ctx.lineWidth = .8; ctx.strokeStyle = c;
      edges.forEach(([a, b]) => { const s = Math.min(1, Math.max(0, t * 1.4 - pts[a].d)); if (s <= 0) return; ctx.globalAlpha = .35 * s; ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y); ctx.stroke(); });
      pts.forEach(p => { const s = Math.min(1, Math.max(0, t * 1.4 - p.d)); if (s <= 0) return; let g = 0; if (pointer.active) g = Math.max(0, 1 - Math.hypot(p.x - pointer.x, p.y - pointer.y) / R); ctx.globalAlpha = (.55 + .45 * g) * s; ctx.fillStyle = g > .2 ? '#fff' : c; ctx.beginPath(); ctx.arc(p.x, p.y, 1.6 + g * 1.8, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalAlpha = 1; if (!reduce || pointer.active) requestAnimationFrame(frame);
    }
    glass.addEventListener('pointermove', e => { const r = glass.getBoundingClientRect(); pointer = { x: e.clientX - r.left, y: e.clientY - r.top, active: true }; if (reduce) requestAnimationFrame(frame); });
    glass.addEventListener('pointerleave', () => { pointer.active = false; if (reduce) requestAnimationFrame(frame); });
    const onResize = () => { build(); requestAnimationFrame(frame); };
    window.addEventListener('resize', onResize);
    window.addEventListener('pf:leave', () => { alive = false; window.removeEventListener('resize', onResize); }, { once: true });
    const img = glass.querySelector('img'); if (img.complete) onResize(); else img.addEventListener('load', onResize);
  }

  route();
})();
