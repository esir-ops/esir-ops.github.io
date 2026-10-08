/* RoboRobo simulator
   RaceBot: Start, DC Motor and Delay blocks (lab report, July 6, 2026).
   SensingBot: While + IF-Else on the IR sensor at IN port 1 (lab report, July 20, 2026).
   Boxing Bot: a servo motor drives the punching arm. */
(function () {
  const W = 800, H = 600;
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/</g, '&lt;');

  function mount(root) {
    root.innerHTML = `
      <div class="tabs" role="tablist">
        <button role="tab" type="button" data-t="race" aria-selected="true">RaceBot</button>
        <button role="tab" type="button" data-t="sense" aria-selected="false">SensingBot</button>
        <button role="tab" type="button" data-t="box" aria-selected="false">Boxing Bot</button>
      </div>
      <div id="roboPane"></div>`;
    let stop = () => {};
    const pane = root.querySelector('#roboPane');
    function show(t) {
      stop();
      root.querySelectorAll('[role=tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.t === t)));
      stop = ({ race: raceBot, sense: sensingBot, box: boxingBot })[t](pane) || (() => {});
    }
    root.querySelectorAll('[role=tab]').forEach(b => b.addEventListener('click', () => show(b.dataset.t)));
    window.addEventListener('pf:leave', () => stop(), { once: true });
    show('race');
  }

  // Shared drawing
  function setupCanvas(cv) {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr;
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return ctx;
  }
  function floor(ctx) {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark' || (!document.documentElement.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
    ctx.fillStyle = dark ? '#2A2338' : '#E9E6EF'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = dark ? 'rgba(255,255,255,.06)' : 'rgba(33,27,51,.07)'; ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }
  function drawBot(ctx, b, leds, trail) {
    if (trail && trail.length > 1) { ctx.strokeStyle = 'rgba(201,70,111,.45)'; ctx.lineWidth = 3; ctx.beginPath(); trail.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); }
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a);
    ctx.fillStyle = '#1E1A26'; ctx.fillRect(-34, -40, 16, 22); ctx.fillRect(-34, 18, 16, 22); // wheels
    ctx.fillStyle = '#F1F1F4'; ctx.fillRect(-32, -38, 12, 18); ctx.fillRect(-32, 20, 12, 18);
    ctx.fillStyle = '#2B2533'; ctx.beginPath(); ctx.roundRect(-40, -30, 76, 60, 8); ctx.fill(); // chassis
    ctx.fillStyle = '#3B3346'; ctx.fillRect(-26, -20, 40, 40); // CPU board
    ctx.fillStyle = '#D9A62E'; ctx.fillRect(-22, -16, 10, 8);
    ctx.strokeStyle = '#E39B1A'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, -10); ctx.bezierCurveTo(10, -30, 20, 10, 30, -6); ctx.stroke();
    ctx.strokeStyle = '#C0392B'; ctx.beginPath(); ctx.moveTo(-10, 10); ctx.bezierCurveTo(8, 28, 22, -4, 30, 8); ctx.stroke();
    (leds || []).forEach((l, i) => { ctx.fillStyle = l.on ? l.c : '#4A4458'; if (l.on) { ctx.shadowColor = l.c; ctx.shadowBlur = 12; } ctx.beginPath(); ctx.arc(30, -18 + i * 12, 5, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; });
    ctx.fillStyle = '#C9466F'; ctx.beginPath(); ctx.moveTo(42, 0); ctx.lineTo(34, -6); ctx.lineTo(34, 6); ctx.closePath(); ctx.fill(); // heading
    ctx.restore();
  }
  function blockRow(cls, inner, removable) { return `<li class="block ${cls}">${inner}${removable ? '<button class="x" type="button" aria-label="Remove block">×</button>' : ''}</li>`; }
  const dirSel = v => `<select data-f="dir">${['forward', 'backward', 'stop'].map(d => `<option ${d === v ? 'selected' : ''}>${d}</option>`).join('')}</select>`;

  // RaceBot
  function raceBot(pane) {
    const PRESETS = {
      'Turn left': [{ t: 'motor', a: 'backward', as: 5, b: 'forward', bs: 5 }, { t: 'delay', s: 0.9 }, { t: 'motor', a: 'forward', as: 7, b: 'forward', bs: 7 }, { t: 'delay', s: 1.2 }],
      'Turn right': [{ t: 'motor', a: 'forward', as: 5, b: 'backward', bs: 5 }, { t: 'delay', s: 0.9 }, { t: 'motor', a: 'forward', as: 7, b: 'forward', bs: 7 }, { t: 'delay', s: 1.2 }],
      'Spin in place': [{ t: 'motor', a: 'forward', as: 8, b: 'backward', bs: 8 }, { t: 'delay', s: 2.4 }],
      'Square path': [].concat(...Array(4).fill([{ t: 'motor', a: 'forward', as: 7, b: 'forward', bs: 7 }, { t: 'delay', s: 1.1 }, { t: 'motor', a: 'forward', as: 5, b: 'backward', bs: 5 }, { t: 'delay', s: 0.9 }]))
    };
    let prog = JSON.parse(JSON.stringify(PRESETS['Turn left']));
    pane.innerHTML = `
      <div class="robo">
        <div><canvas class="arena" id="rbArena" aria-label="RaceBot arena"></canvas>
          <p class="muted" style="font-size:14px;margin-top:8px">Motor A is the left wheel and motor B is the right wheel, wired to the DC motor drive board like in our build. The LEDs on OUT 5 to 8 show which way it's moving.</p></div>
        <div>
          <div class="picker-label" style="margin-top:0">Presets from our lab</div>
          <div class="seg" id="rbPresets">${Object.keys(PRESETS).map(k => `<button type="button">${k}</button>`).join('')}</div>
          <div class="picker-label">Block sequence</div>
          <ul class="blocks" id="rbBlocks"></ul>
          <div class="actions" style="margin-top:10px">
            <button class="btn small ghost" type="button" id="rbAddM">+ DC Motor</button>
            <button class="btn small ghost" type="button" id="rbAddD">+ Delay</button>
          </div>
          <div class="actions" style="margin-top:14px">
            <button class="btn blush" type="button" id="rbRun">Run program</button>
            <button class="btn ghost" type="button" id="rbReset">Reset robot</button>
          </div>
          <p class="note">In the lab, our first runs undershot and overshot the turns. We fixed it by tuning speed and delay values, which you can do here too.</p>
        </div>
      </div>`;
    const $ = s => pane.querySelector(s), cv = $('#rbArena'), ctx = setupCanvas(cv);
    let bot, trail, raf = 0, running = false, active = -1;
    const resetBot = () => { bot = { x: W / 2, y: H / 2 + 60, a: -Math.PI / 2 }; trail = [{ x: bot.x, y: bot.y }]; };
    resetBot();

    function renderBlocks() {
      $('#rbBlocks').innerHTML = blockRow('start', '▶ Start') + prog.map((b, i) => b.t === 'motor'
        ? blockRow('motor' + (i === active ? ' active' : ''), `DC Motor &nbsp;A ${dirSel(b.a)} <input data-f="as" type="number" min="0" max="10" value="${b.as}" aria-label="Motor A speed"> &nbsp;B ${dirSel(b.b)} <input data-f="bs" type="number" min="0" max="10" value="${b.bs}" aria-label="Motor B speed">`, true)
        : blockRow('delay' + (i === active ? ' active' : ''), `Delay <input data-f="s" type="number" min="0.1" max="10" step="0.1" value="${b.s}" aria-label="Delay seconds"> s`, true)).join('');
      $('#rbBlocks').querySelectorAll('.block:not(.start)').forEach((el, i) => {
        el.querySelectorAll('[data-f]').forEach((inp, k) => inp.addEventListener('change', () => {
          const f = inp.dataset.f, b = prog[i];
          if (f === 'dir') b[k === 0 ? 'a' : 'b'] = inp.value; else b[f] = Math.max(+inp.min || 0, Math.min(+inp.max || 10, +inp.value || 0));
        }));
        el.querySelector('.x').addEventListener('click', () => { if (!running) { prog.splice(i, 1); renderBlocks(); } });
      });
    }
    function draw(m) {
      floor(ctx);
      const leds = [{ c: '#FF4B4B', on: m && (m.a === 'backward' || m.b === 'backward') }, { c: '#FF9F2E', on: m && m.a !== m.b && m.a !== 'stop' && m.b !== 'stop' }, { c: '#FFE14B', on: m && (m.a === 'stop' || m.b === 'stop') }, { c: '#4BDB7C', on: m && m.a === 'forward' && m.b === 'forward' }];
      drawBot(ctx, bot, leds, trail);
    }
    async function run() {
      if (running) return; running = true; $('#rbRun').disabled = true;
      let motor = { a: 'stop', as: 0, b: 'stop', bs: 0 };
      for (let i = 0; i < prog.length && running; i++) {
        active = i; renderBlocks();
        const b = prog[i];
        if (b.t === 'motor') { motor = { ...b }; await anim(0.25, motor); }
        else await anim(b.s, motor);
      }
      active = -1; running = false; renderBlocks(); draw(null); $('#rbRun').disabled = false;
    }
    function anim(sec, m) {
      return new Promise(res => {
        const sp = d => d === 'forward' ? 1 : d === 'backward' ? -1 : 0;
        const vl = sp(m.a) * m.as * 14, vr = sp(m.b) * m.bs * 14, base = 60;
        let last = performance.now(), left = sec;
        const tick = now => {
          if (!running) return res();
          const dt = Math.min(0.05, (now - last) / 1000); last = now; left -= dt;
          const v = (vl + vr) / 2, w = (vr - vl) / base;
          bot.a += w * dt; bot.x += Math.cos(bot.a) * v * dt; bot.y += Math.sin(bot.a) * v * dt;
          bot.x = Math.max(40, Math.min(W - 40, bot.x)); bot.y = Math.max(40, Math.min(H - 40, bot.y));
          trail.push({ x: bot.x, y: bot.y }); if (trail.length > 1500) trail.shift();
          draw(m);
          if (left <= 0) return res();
          raf = requestAnimationFrame(tick);
        };
        if (reduce()) { const steps = Math.ceil(sec / 0.02); for (let k = 0; k < steps; k++) { const v = (vl + vr) / 2, w = (vr - vl) / base; bot.a += w * 0.02; bot.x = Math.max(40, Math.min(W - 40, bot.x + Math.cos(bot.a) * v * 0.02)); bot.y = Math.max(40, Math.min(H - 40, bot.y + Math.sin(bot.a) * v * 0.02)); trail.push({ x: bot.x, y: bot.y }); } draw(m); setTimeout(res, 120); }
        else raf = requestAnimationFrame(tick);
      });
    }
    pane.querySelectorAll('#rbPresets button').forEach(b => b.addEventListener('click', () => { if (running) return; prog = JSON.parse(JSON.stringify(PRESETS[b.textContent])); resetBot(); renderBlocks(); draw(null); }));
    $('#rbAddM').addEventListener('click', () => { if (!running) { prog.push({ t: 'motor', a: 'forward', as: 6, b: 'forward', bs: 6 }); renderBlocks(); } });
    $('#rbAddD').addEventListener('click', () => { if (!running) { prog.push({ t: 'delay', s: 1 }); renderBlocks(); } });
    $('#rbRun').addEventListener('click', run);
    $('#rbReset').addEventListener('click', () => { running = false; cancelAnimationFrame(raf); resetBot(); active = -1; renderBlocks(); draw(null); $('#rbRun').disabled = false; });
    renderBlocks(); draw(null);
    return () => { running = false; cancelAnimationFrame(raf); };
  }

  // SensingBot
  function sensingBot(pane) {
    const OBJ = {
      book: { label: 'White book', fill: '#FAFAF7', stroke: '#C9CDD6', reflect: 0.95, w: 70, h: 52 },
      wall: { label: 'Light wall', fill: '#D9D4CC', stroke: '#B8B1A6', reflect: 0.7, w: 24, h: 170 },
      dark: { label: 'Dark object', fill: '#2A2530', stroke: '#110E16', reflect: 0.12, w: 60, h: 60 }
    };
    const ACTIONS = { reverse: 'back up and turn', stop: 'stop', spin: 'spin in place' };
    let objs = [{ k: 'book', x: 400, y: 150 }, { k: 'dark', x: 230, y: 330 }, { k: 'wall', x: 660, y: 330 }];
    let placing = null, thenAct = 'reverse';
    pane.innerHTML = `
      <div class="robo">
        <div><canvas class="arena" id="sbArena" aria-label="SensingBot arena. Click to place objects."></canvas>
          <p class="muted" style="font-size:14px;margin-top:8px">Pick an object, then click the floor to place it. Drag to move objects.</p></div>
        <div>
          <div class="picker-label" style="margin-top:0">Block sequence</div>
          <ul class="blocks">
            ${blockRow('start', '▶ Start')}
            ${blockRow('loop', '⟳ While (forever)')}
            ${blockRow('cond', `IF IN 1 (IR sensor) detects an object &nbsp;→&nbsp; <select id="sbThen">${Object.entries(ACTIONS).map(([k, v]) => `<option value="${k}" ${k === thenAct ? 'selected' : ''}>${v}</option>`).join('')}</select>`)}
            ${blockRow('motor', 'ELSE &nbsp;DC Motor A forward, B forward')}
          </ul>
          <div class="picker-label">Place an obstacle</div>
          <div class="seg" id="sbPlace">${Object.entries(OBJ).map(([k, o]) => `<button type="button" data-k="${k}" aria-pressed="false">${o.label}</button>`).join('')}<button type="button" data-k="clear">Clear all</button></div>
          <div class="actions" style="margin-top:14px">
            <button class="btn blush" type="button" id="sbRun">Run</button>
            <button class="btn ghost" type="button" id="sbReset">Reset robot</button>
          </div>
          <p class="status" id="sbStatus" role="status"></p>
          <p class="note">During testing, our sensor responded to white objects like a book and struggled with darker ones, because IR sensing depends on reflected light. The simulator uses the same idea: each object has a reflectivity, and only strong reflections trigger IN 1.</p>
        </div>
      </div>`;
    const $ = s => pane.querySelector(s), cv = $('#sbArena'), ctx = setupCanvas(cv);
    let bot, raf = 0, running = false, detected = false, phase = null, drag = null;
    const resetBot = () => { bot = { x: 120, y: 500, a: -Math.PI / 4 }; phase = null; };
    resetBot();

    function sensorReading() {
      // Cast a short ray from the front sensor; reading = reflectivity × closeness
      const sx = bot.x + Math.cos(bot.a) * 44, sy = bot.y + Math.sin(bot.a) * 44, range = 120;
      for (let d = 0; d <= range; d += 4) {
        const px = sx + Math.cos(bot.a) * d, py = sy + Math.sin(bot.a) * d;
        if (px < 0 || py < 0 || px > W || py > H) return { hit: 'edge', val: 0.8 * (1 - d / range) + 0.2, d };
        for (const o of objs) { const t = OBJ[o.k]; if (Math.abs(px - o.x) < t.w / 2 && Math.abs(py - o.y) < t.h / 2) return { hit: o.k, val: t.reflect * (1 - d / range * 0.5), d }; }
      }
      return { hit: null, val: 0, d: range };
    }
    function collide(nx, ny) {
      if (nx < 36 || ny < 36 || nx > W - 36 || ny > H - 36) return true;
      return objs.some(o => { const t = OBJ[o.k]; return Math.abs(nx - o.x) < t.w / 2 + 30 && Math.abs(ny - o.y) < t.h / 2 + 30; });
    }
    function draw(r) {
      floor(ctx);
      objs.forEach(o => { const t = OBJ[o.k]; ctx.fillStyle = t.fill; ctx.strokeStyle = t.stroke; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(o.x - t.w / 2, o.y - t.h / 2, t.w, t.h, 6); ctx.fill(); ctx.stroke(); });
      r = r || sensorReading();
      const sx = bot.x + Math.cos(bot.a) * 44, sy = bot.y + Math.sin(bot.a) * 44;
      ctx.strokeStyle = detected ? 'rgba(201,70,111,.9)' : 'rgba(122,104,184,.55)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(bot.a) * r.d, sy + Math.sin(bot.a) * r.d); ctx.stroke(); ctx.setLineDash([]);
      drawBot(ctx, bot, [{ c: '#FF4B4B', on: detected }, { c: '#FF4B4B', on: detected }]);
    }
    function step(now, last) {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      const r = sensorReading();
      detected = r.val >= 0.5; // threshold
      const speed = 90;
      if (phase && phase.left > 0) {
        phase.left -= dt;
        if (phase.kind === 'back') { const nx = bot.x - Math.cos(bot.a) * speed * .6 * dt, ny = bot.y - Math.sin(bot.a) * speed * .6 * dt; if (!collide(nx, ny)) { bot.x = nx; bot.y = ny; } if (phase.left <= 0) phase = { kind: 'turn', left: 0.8 }; }
        else if (phase.kind === 'turn') bot.a += 2.2 * dt;
        else if (phase.kind === 'spin') bot.a += 3.4 * dt;
        else if (phase.kind === 'stop') {}
        if (phase && phase.left <= 0 && phase.kind !== 'back') phase = null;
      } else if (detected) {
        phase = thenAct === 'reverse' ? { kind: 'back', left: 0.5 } : thenAct === 'spin' ? { kind: 'spin', left: 1.2 } : { kind: 'stop', left: 0.3 };
      } else {
        const nx = bot.x + Math.cos(bot.a) * speed * dt, ny = bot.y + Math.sin(bot.a) * speed * dt;
        if (collide(nx, ny)) { bot.a += 1.4 * dt; } else { bot.x = nx; bot.y = ny; }
      }
      $('#sbStatus').textContent = detected ? `IN 1 detects: ${r.hit === 'edge' ? 'arena edge' : OBJ[r.hit].label} (reflection ${Math.round(r.val * 100)}%) → ${ACTIONS[thenAct]}` : (r.hit && r.hit !== 'edge' ? `Weak reflection from ${OBJ[r.hit].label} (${Math.round(r.val * 100)}%) → not detected, keep going` : 'Nothing detected → ELSE: drive forward');
      draw(r);
      raf = requestAnimationFrame(t => step(t, now));
    }
    function canvasPoint(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }
    cv.addEventListener('pointerdown', e => {
      const p = canvasPoint(e);
      if (placing) { objs.push({ k: placing, x: p.x, y: p.y }); placing = null; pane.querySelectorAll('#sbPlace button').forEach(b => b.setAttribute('aria-pressed', 'false')); draw(); return; }
      drag = objs.slice().reverse().find(o => { const t = OBJ[o.k]; return Math.abs(p.x - o.x) < t.w / 2 && Math.abs(p.y - o.y) < t.h / 2; }) || null;
      if (drag) cv.setPointerCapture(e.pointerId);
    });
    cv.addEventListener('pointermove', e => { if (!drag) return; const p = canvasPoint(e); drag.x = p.x; drag.y = p.y; if (!running) draw(); });
    cv.addEventListener('pointerup', () => { drag = null; });
    pane.querySelectorAll('#sbPlace button').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.k === 'clear') { objs = []; placing = null; draw(); return; }
      placing = placing === b.dataset.k ? null : b.dataset.k;
      pane.querySelectorAll('#sbPlace button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.k === placing)));
    }));
    $('#sbThen').addEventListener('change', e => { thenAct = e.target.value; });
    $('#sbRun').addEventListener('click', () => {
      running = !running; $('#sbRun').textContent = running ? 'Pause' : 'Run';
      if (running) { const t = performance.now(); raf = requestAnimationFrame(n => step(n, t)); } else cancelAnimationFrame(raf);
    });
    $('#sbReset').addEventListener('click', () => { running = false; cancelAnimationFrame(raf); $('#sbRun').textContent = 'Run'; resetBot(); detected = false; $('#sbStatus').textContent = ''; draw(); });
    draw();
    return () => { running = false; cancelAnimationFrame(raf); };
  }

  // Boxing Bot
  function boxingBot(pane) {
    pane.innerHTML = `
      <div class="robo">
        <div><canvas class="arena" id="bxArena" aria-label="Boxing Bot side view"></canvas></div>
        <div>
          <div class="picker-label" style="margin-top:0">Servo motor (arm)</div>
          <div class="servo"><input type="range" id="bxAngle" min="0" max="120" value="0" aria-label="Servo angle" style="flex:1"><b id="bxVal">0°</b></div>
          <div class="actions" style="margin-top:14px">
            <button class="btn blush" type="button" id="bxPunch">Punch</button>
            <button class="btn ghost" type="button" id="bxCombo">Three-punch combo</button>
          </div>
          <div class="picker-label">Block sequence for one punch</div>
          <ul class="blocks">
            ${blockRow('start', '▶ Start')}
            ${blockRow('motor', 'Servo → 110°')}
            ${blockRow('delay', 'Delay 0.2 s')}
            ${blockRow('motor', 'Servo → 0°')}
          </ul>
          <p class="status" id="bxHits" role="status">Hits: 0</p>
          <p class="note">The Boxing Bot is one of the Robo Kit models we built. A servo motor connected to the robot's arm swings it forward to punch. I don't have a photo of our build yet, so this one is drawn.</p>
        </div>
      </div>`;
    const $ = s => pane.querySelector(s), cv = $('#bxArena'), ctx = setupCanvas(cv);
    let angle = 0, target = 0, raf = 0, hits = 0, bag = 0, alive = true;
    function draw() {
      floor(ctx);
      ctx.fillStyle = 'rgba(33,27,51,.12)'; ctx.fillRect(0, 470, W, 130);
      // punching bag
      ctx.save(); ctx.translate(545, 120); ctx.rotate(bag * 0.25);
      ctx.strokeStyle = '#6B6578'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -120); ctx.lineTo(0, 0); ctx.stroke();
      ctx.fillStyle = '#C9466F'; ctx.beginPath(); ctx.roundRect(-40, 0, 80, 230, 30); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(-28, 20, 10, 190);
      ctx.restore();
      // robot body
      ctx.fillStyle = '#2B2533'; ctx.beginPath(); ctx.roundRect(180, 300, 170, 150, 12); ctx.fill();
      ctx.fillStyle = '#3B3346'; ctx.fillRect(205, 325, 90, 70);
      ctx.fillStyle = '#D9A62E'; ctx.fillRect(215, 335, 22, 14);
      ctx.fillStyle = '#1E1A26'; [[215, 450], [320, 450]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 30, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#F1F1F4'; ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#1E1A26'; });
      // servo + arm
      const sx = 330, sy = 320, rad = (-80 + angle) * Math.PI / 180;
      ctx.fillStyle = '#3E8ED0'; ctx.fillRect(sx - 22, sy - 18, 44, 36);
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(rad);
      ctx.fillStyle = '#9DA2B0'; ctx.fillRect(0, -9, 170, 18);
      ctx.fillStyle = '#E39B1A'; ctx.beginPath(); ctx.roundRect(160, -24, 46, 48, 14); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#F4F2F7'; ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.fill();
    }
    function loop() {
      if (!alive) return;
      const prev = angle;
      angle += (target - angle) * (reduce() ? 1 : 0.28);
      const tipX = 330 + Math.cos((-80 + angle) * Math.PI / 180) * 200;
      if (tipX > 495 && prev < angle && bag < 0.05) { hits++; bag = 1; $('#bxHits').textContent = `Hits: ${hits}`; }
      bag *= 0.9;
      $('#bxVal').textContent = Math.round(angle) + '°'; $('#bxAngle').value = Math.round(angle);
      draw(); raf = requestAnimationFrame(loop);
    }
    const wait = ms => new Promise(r => setTimeout(r, ms));
    async function punch() { target = 110; await wait(200); target = 0; await wait(260); }
    $('#bxPunch').addEventListener('click', punch);
    $('#bxCombo').addEventListener('click', async () => { for (let i = 0; i < 3; i++) await punch(); });
    $('#bxAngle').addEventListener('input', e => { target = +e.target.value; });
    loop();
    return () => { alive = false; cancelAnimationFrame(raf); };
  }

  window.RoboDemo = { mount };
})();
