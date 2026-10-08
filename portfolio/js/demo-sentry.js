/* SENTRY-SSF automation rules
   The nine rules below are copied from the IoT server's Conditions page
   (SSF-SRV-IOT-01, http://192.168.30.10/conditions.html) in the Packet Tracer build.
   Rules run top to bottom, so a later rule can override an earlier one. */
(function () {
  const RULES = [
    { id: 'AR-03-COOL-ON', when: s => s.temp >= 34, cond: 'temperature ≥ 34.0 °C', act: { ac: true } },
    { id: 'AR-03-COOL-OFF', when: s => s.temp <= 30 && s.hum <= 55, cond: 'temperature ≤ 30.0 °C and humidity ≤ 55%', act: { ac: false } },
    { id: 'AR-04-DEHUM-ON', when: s => s.hum >= 65, cond: 'humidity ≥ 65%', act: { ac: true } },
    { id: 'AR-04-DEHUM-OFF', when: s => s.hum <= 55 && s.temp <= 30, cond: 'humidity ≤ 55% and temperature ≤ 30.0 °C', act: { ac: false } },
    { id: 'AR-05-INTRUSION', when: s => s.motion && !s.fire, cond: 'motion detected and no fire alarm', act: { light: true, door: 'Lock' } },
    { id: 'AR-05-CLEAR', when: s => !s.motion, cond: 'no motion', act: { remote: 0 } },
    { id: 'AR-06-OCC-LIGHT', when: s => s.motion, cond: 'motion detected', act: { light: true } },
    { id: 'AR-06-VACANCY', when: s => !s.motion && s.hum <= 55 && s.temp <= 30 && !s.fire, cond: 'no motion, humidity ≤ 55%, temperature ≤ 30.0 °C, no fire alarm', act: { light: false, ac: false } },
    { id: 'AR-07-FIRE-EGRESS', when: s => s.fire, cond: 'fire alarm is on', act: { door: 'Unlock', ac: false, light: true } }
  ];

  function mount(root) {
    const S = { temp: 27, hum: 50, motion: false, fire: false };
    const A = { ac: false, light: false, door: 'Unlock', remote: 0 };
    root.innerHTML = `
      <div class="trivia">
        <div>
          <div class="picker-label" style="margin-top:0">Sensors</div>
          <div class="field"><label for="ssT">Temperature (SSF-SBC-ENV-01): <span id="ssTv"></span></label><input id="ssT" type="range" min="20" max="40" step="0.5" style="width:100%"></div>
          <div class="field"><label for="ssH">Humidity (SSF-SEN-HUM-01): <span id="ssHv"></span></label><input id="ssH" type="range" min="30" max="85" step="1" style="width:100%"></div>
          <div class="actions">
            <label class="switch"><input type="checkbox" id="ssM"> Motion (SSF-SEN-MOTION-01)</label>
            <label class="switch"><input type="checkbox" id="ssF"> Fire alarm (SSF-MCU-FIRE-01)</label>
          </div>
          <div class="picker-label">Quick scenarios</div>
          <div class="seg" id="ssScen">
            <button type="button" data-s="hot">Hot room</button>
            <button type="button" data-s="humid">Humid room</button>
            <button type="button" data-s="intruder">Someone enters</button>
            <button type="button" data-s="fire">Fire</button>
            <button type="button" data-s="idle">Empty and normal</button>
          </div>
          <div class="picker-label">Actuators</div>
          <div class="recs" id="ssAct"></div>
        </div>
        <div>
          <div class="picker-label" style="margin-top:0">Server rules (top to bottom)</div>
          <ol class="lb" id="ssRules"></ol>
        </div>
      </div>
      <p class="note">These are the exact conditions and actions from our IoT server. The Tier 1 fire and environment clusters also work on their own over hard-wired pins, so the siren and fan don't depend on the network.</p>`;
    const $ = s => root.querySelector(s);
    $('#ssT').value = S.temp; $('#ssH').value = S.hum;

    function run() {
      const fired = [];
      RULES.forEach(r => { if (r.when(S)) { Object.assign(A, r.act); fired.push(r.id); } });
      $('#ssTv').textContent = S.temp.toFixed(1) + ' °C'; $('#ssHv').textContent = S.hum + '%';
      $('#ssRules').innerHTML = RULES.map(r => { const on = fired.includes(r.id); return `<li style="display:block;${on ? '' : 'opacity:.55'}"><b style="color:${on ? 'var(--blush)' : 'inherit'}">${on ? '● ' : '○ '}${r.id}</b><div class="muted" style="font-size:13.5px">IF ${r.cond}</div><div style="font-size:13.5px">THEN ${Object.entries(r.act).map(([k, v]) => k === 'ac' ? 'AC ' + (v ? 'on' : 'off') : k === 'light' ? 'light ' + (v ? 'on' : 'off') : k === 'door' ? 'door ' + String(v).toLowerCase() : 'fire MCU remote_cmd = ' + v).join(', ')}</div></li>`; }).join('');
      const tile = (name, dev, on, val) => `<div class="rec"><div class="sw" style="background:${on ? '#4BDB7C' : 'var(--line)'};display:grid;place-items:center;font-size:20px">${val}</div><div><b>${name}</b><span>${dev}</span></div></div>`;
      $('#ssAct').innerHTML = tile('Air conditioner: ' + (A.ac ? 'On' : 'Off'), 'SSF-ACT-AC-01', A.ac, '❄️') + tile('Light: ' + (A.light ? 'On' : 'Off'), 'SSF-ACT-LIGHT-01', A.light, '💡') + tile('Door: ' + (A.door === 'Lock' ? 'Locked' : 'Unlocked'), 'SSF-ACT-DOOR-01', A.door === 'Lock', A.door === 'Lock' ? '🔒' : '🔓');
    }
    $('#ssT').addEventListener('input', e => { S.temp = +e.target.value; run(); });
    $('#ssH').addEventListener('input', e => { S.hum = +e.target.value; run(); });
    $('#ssM').addEventListener('change', e => { S.motion = e.target.checked; run(); });
    $('#ssF').addEventListener('change', e => { S.fire = e.target.checked; run(); });
    const SC = { hot: { temp: 35, hum: 50, motion: false, fire: false }, humid: { temp: 28, hum: 70, motion: false, fire: false }, intruder: { temp: 27, hum: 50, motion: true, fire: false }, fire: { temp: 31, hum: 50, motion: true, fire: true }, idle: { temp: 27, hum: 50, motion: false, fire: false } };
    root.querySelectorAll('#ssScen button').forEach(b => b.addEventListener('click', () => {
      Object.assign(S, SC[b.dataset.s]); $('#ssT').value = S.temp; $('#ssH').value = S.hum; $('#ssM').checked = S.motion; $('#ssF').checked = S.fire;
      root.querySelectorAll('#ssScen button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); run();
    }));
    run();
  }
  window.SentryDemo = { mount };
})();
