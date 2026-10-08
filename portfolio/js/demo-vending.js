/* Digital Vending Machine simulator
   Mirrors the always-block in github.com/esir-ops/digital_vending_machine/vending_machine.v.
   Each coin press is one rising clock edge with that coin on the input. */
(function () {
  const COINS = [{ code: 0b00, bits: '00', value: 1 }, { code: 0b01, bits: '01', value: 5 }, { code: 0b10, bits: '10', value: 10 }, { code: 0b11, bits: '11', value: 20 }];
  const SCENARIOS = [
    ['10 + 10', [2, 2]], ['5 + 5 + 10', [1, 1, 2]], ['20', [3]], ['1 × 20', Array(20).fill(0)], ['10 + 20', [2, 3]], ['Refund: 5 + 10, then reset', [1, 2, 'R']]
  ];

  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function highlightVerilog(src) {
    return esc(src).split('\n').map(line => {
      const ci = line.indexOf('//');
      let code = ci >= 0 ? line.slice(0, ci) : line, com = ci >= 0 ? line.slice(ci) : '';
      code = code.replace(/\b(module|input|output|reg|wire|always|begin|end|if|else|case|endcase|default|posedge|or|endmodule|task|endtask|initial|repeat)\b/g, '<span class="k">$1</span>')
        .replace(/\b(\d+'b[01]+|\d+)\b/g, '<span class="n">$1</span>');
      return code + (com ? `<span class="c">${com}</span>` : '');
    }).join('\n');
  }

  function mount(root) {
    // Registers from the module
    const R = { total: 0, dispense: 0, change: 0, refund: 0 };
    const hist = []; // one entry per clock edge or reset
    let busy = false, items = 0;

    root.innerHTML = `
      <div class="vend">
        <div class="machine">
          <div class="lcd" aria-live="polite">
            <div style="font-size:12px;opacity:.75">total (reg [5:0])</div>
            <div class="big" id="vTotal">₱0</div>
            <div id="vMsg" style="font-size:13px;min-height:20px">Insert coins. Item costs ₱20.</div>
          </div>
          <div class="coins">
            ${COINS.map((c, i) => `<button type="button" class="coin${i < 2 ? ' silver' : ''}" data-i="${i}" aria-label="Insert ${c.value} peso coin, input ${c.bits}">₱${c.value}<small>${c.bits}</small></button>`).join('')}
          </div>
          <div class="leds">
            <span class="led" id="ledD"><i></i>dispense</span>
            <span class="led" id="ledC"><i></i>change = <b id="vChange">0</b></span>
            <span class="led" id="ledR"><i></i>refund = <b id="vRefund">0</b></span>
          </div>
          <div class="actions" style="margin-top:16px">
            <button class="btn small blush" type="button" id="vReset">Press reset (refund)</button>
          </div>
          <div class="tray" id="vTray">Dispense tray</div>
        </div>
        <div>
          <div class="picker-label" style="margin-top:0">Waveform</div>
          <canvas class="wave" id="vWave" width="900" height="300" aria-label="Signal waveform"></canvas>
          <div class="picker-label">Run a testbench scenario</div>
          <div class="seg" id="vScen">${SCENARIOS.map((s, i) => `<button type="button" data-i="${i}">${s[0]}</button>`).join('')}</div>
          <div class="log" id="vLog" aria-live="polite"></div>
        </div>
      </div>
      <details class="code-toggle" style="margin-top:20px"><summary>Show the Verilog module</summary><pre class="code">${highlightVerilog(window.VERILOG_SRC)}</pre></details>
      <details class="code-toggle"><summary>Show the testbench</summary><pre class="code">${highlightVerilog(window.VERILOG_TB)}</pre></details>`;

    const $ = s => root.querySelector(s);
    const log = t => { const el = $('#vLog'); el.insertAdjacentHTML('beforeend', `<div>${t}</div>`); el.scrollTop = el.scrollHeight; };

    // One rising clock edge, same logic as the always @(posedge clk ...) block
    function clockEdge(coinIdx) {
      const c = COINS[coinIdx];
      R.dispense = 0; R.change = 0; R.refund = 0;
      const next_total = R.total + c.value;
      if (next_total >= 20) { R.dispense = 1; R.change = next_total - 20; R.total = 0; }
      else { R.total = next_total; }
      hist.push({ coin: c.bits, reset: 0, ...R });
      log(`edge: coin=${c.bits} (₱${c.value}) → next_total=${next_total}${R.dispense ? `, dispense=1, change=${R.change}, total=0` : `, total=${R.total}`}`);
      update(R.dispense);
    }
    function reset() {
      R.refund = R.total; R.total = 0; R.dispense = 0; R.change = 0;
      hist.push({ coin: '--', reset: 1, ...R });
      log(`reset: refund=${R.refund}, total=0`);
      update(false);
    }
    function update(dropped) {
      $('#vTotal').textContent = '₱' + R.total;
      $('#vChange').textContent = R.change; $('#vRefund').textContent = R.refund;
      $('#ledD').classList.toggle('on', !!R.dispense); $('#ledC').classList.toggle('on', R.change > 0); $('#ledR').classList.toggle('on', R.refund > 0);
      let msg = 'Insert coins. Item costs ₱20.';
      if (R.dispense) msg = R.change ? `Item released. Take your ₱${R.change} change.` : 'Item released. Exact amount, no change.';
      else if (R.refund) msg = `Refunded ₱${R.refund}.`;
      else if (R.total) msg = `₱${20 - R.total} more to go.`;
      $('#vMsg').textContent = msg;
      if (dropped) { items++; $('#vTray').innerHTML = `<span class="item" aria-hidden="true">🥤</span><span class="sr-only">Item ${items} dispensed</span>`; }
      else if (R.refund) $('#vTray').textContent = `₱${R.refund} returned`;
      drawWave();
    }

    function drawWave() {
      const cv = $('#vWave'), ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
      ctx.clearRect(0, 0, W, H);
      const rows = [['coin', 'bus'], ['total', 'bus'], ['dispense', 'bit'], ['change', 'bus'], ['refund', 'bus'], ['reset', 'bit']];
      const left = 92, rowH = (H - 20) / rows.length, data = hist.slice(-16), step = (W - left - 10) / 16;
      ctx.font = '600 15px ui-monospace, Consolas, monospace';
      rows.forEach(([name, kind], r) => {
        const y0 = 10 + r * rowH, hi = y0 + 8, lo = y0 + rowH - 10, mid = (hi + lo) / 2;
        ctx.fillStyle = '#B3AAC6'; ctx.fillText(name, 10, mid + 5);
        ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.moveTo(left, lo + 5); ctx.lineTo(W - 10, lo + 5); ctx.stroke();
        data.forEach((d, i) => {
          const x = left + i * step, v = d[name];
          if (kind === 'bit') {
            ctx.strokeStyle = name === 'reset' ? '#FF9EBB' : '#7CF5B0'; ctx.lineWidth = 2;
            const y = v ? hi : lo, prev = i ? (data[i - 1][name] ? hi : lo) : lo;
            ctx.beginPath(); ctx.moveTo(x, prev); ctx.lineTo(x, y); ctx.lineTo(x + step, y); ctx.stroke();
          } else {
            ctx.strokeStyle = '#B7A6FF'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(x, mid); ctx.lineTo(x + 6, hi); ctx.lineTo(x + step - 6, hi); ctx.lineTo(x + step, mid); ctx.lineTo(x + step - 6, lo); ctx.lineTo(x + 6, lo); ctx.closePath(); ctx.stroke();
            ctx.fillStyle = '#F1EDF7'; ctx.font = '13px ui-monospace, Consolas, monospace';
            ctx.fillText(String(v), x + 10, mid + 5); ctx.font = '600 15px ui-monospace, Consolas, monospace';
          }
        });
      });
      if (!data.length) { ctx.fillStyle = '#8F86A8'; ctx.fillText('Insert a coin to start the clock', left + 20, H / 2); }
    }

    root.querySelectorAll('.coin').forEach(b => b.addEventListener('click', () => { if (!busy) clockEdge(+b.dataset.i); }));
    $('#vReset').addEventListener('click', () => { if (!busy) reset(); });
    root.querySelectorAll('#vScen button').forEach(b => b.addEventListener('click', async () => {
      if (busy) return; busy = true;
      root.querySelectorAll('#vScen button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      const [name, seq] = SCENARIOS[+b.dataset.i];
      log(`<b>Scenario: ${name}</b>`);
      if (R.total > 0) reset(); // the testbench pulses reset between scenarios
      const wait = matchMedia('(prefers-reduced-motion: reduce)').matches ? 60 : 380;
      for (const s of seq) { s === 'R' ? reset() : clockEdge(s); await new Promise(r => setTimeout(r, seq.length > 10 ? wait / 3 : wait)); }
      busy = false;
    }));
    drawWave();
  }
  window.VendDemo = { mount };
})();
