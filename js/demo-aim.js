/* AI'm Beautiful shade studio
   Tone detection, product scoring and look intensity are ported from
   github.com/esir-ops/AIm_Beautiful (app.js). Product data comes from data/*.json. */
(function () {
  const D = window.AIM_DATA;
  const STEPS = ['lips', 'blush', 'eyebrows', 'contour'];
  const STEP_LABELS = { lips: 'Lips', blush: 'Blush', eyebrows: 'Eyebrows', contour: 'Contour' };
  const FOCAL_TO_STEP = { lips: 'lips', eyebrows: 'eyebrows', cheeks: 'blush', contour: 'contour' };
  const TONES = ['light_warm', 'light_cool', 'medium_warm', 'medium_cool', 'dark_warm', 'dark_cool'];

  // Same STATE fields the thesis app uses
  const STATE = { toneKey: 'medium_warm', look: 'date_casual_glam', focal: 'lips', style: null, shades: null, foundationData: null, lookData: D.looks, focalData: D.focal };

  // Ported from app.js: brand library merge
  function loadShades() {
    STATE.shades = JSON.parse(JSON.stringify(D.shades));
    STATE.foundationData = JSON.parse(JSON.stringify(D.foundations));
    mergeBrandLibrary(D.chuchu);
  }
  function mergeBrandLibrary(lib) {
    if (!lib || typeof lib !== 'object') return 0;
    let n = 0;
    const attach = (target, entry) => {
      if (!target || !entry || !entry.shade || !entry.hex) return;
      (target.alt = target.alt || []).push({ shade: entry.shade, product: entry.product || '', brand: entry.brand || '', slot: (entry.slot === 0 || entry.slot) ? entry.slot : null, hex: entry.hex });
      n++;
    };
    Object.keys(lib).forEach(toneKey => {
      if (toneKey.charAt(0) === '_') return;
      const src = lib[toneKey]; if (!src || typeof src !== 'object') return;
      STEPS.forEach(step => attach(STATE.shades?.[toneKey]?.[step], src[step]));
      attach(STATE.foundationData?.[toneKey], src.foundation);
    });
    return n;
  }

  // Ported from app.js: one best product per category
  const LOOK_BOLDNESS = { school: 0.20, professional: 0.44, date_casual_glam: 0.64, party_glam: 0.88 };
  const CATEGORY_BOLD = { lips: 1.00, blush: 0.80, eyebrows: 0.90, contour: 0.70, foundation: 0.05 };
  function lookBoldness(step) { const b = LOOK_BOLDNESS[STATE.look]; return Math.min(1, (typeof b === 'number' ? b : 0.55) * (CATEGORY_BOLD[step] ?? 0.85)); }
  function shadeContrast(hex, skin) { if (!hex || hex.length < 7) return 0; const dr = parseInt(hex.slice(1, 3), 16) - skin.r, dg = parseInt(hex.slice(3, 5), 16) - skin.g, db = parseInt(hex.slice(5, 7), 16) - skin.b; return Math.sqrt(dr * dr + dg * dg + db * db); }
  function altOptions(entry) { return (entry && entry.alt) || []; }
  function productCandidates(entry) { if (!entry) return []; return [{ shade: entry.shade, product: entry.product, brand: entry.brand, slot: entry.slot, hex: entry.hex, primary: true }, ...altOptions(entry).map(a => ({ ...a, primary: false }))]; }
  function toneToRGB(k) { return { light_warm: { r: 225, g: 192, b: 167 }, light_cool: { r: 218, g: 190, b: 180 }, medium_warm: { r: 190, g: 150, b: 120 }, medium_cool: { r: 178, g: 152, b: 144 }, dark_warm: { r: 133, g: 100, b: 70 }, dark_cool: { r: 122, g: 98, b: 93 } }[k] || { r: 185, g: 148, b: 122 }; }
  function bestProduct(entry, step) {
    const cands = productCandidates(entry);
    if (cands.length <= 1) return cands[0] ? { ...cands[0], others: [] } : null;
    const skin = toneToRGB(STATE.toneKey || 'medium_warm');
    const dist = cands.map(c => shadeContrast(c.hex, skin));
    const lo = Math.min(...dist), hi = Math.max(...dist), span = (hi - lo) || 1;
    const target = lookBoldness(step);
    let win = 0, winScore = Infinity;
    cands.forEach((c, i) => { const norm = (dist[i] - lo) / span; const score = Math.abs(norm - target) - (c.primary ? 0.001 : 0); if (score < winScore) { winScore = score; win = i; } });
    const w = cands[win];
    return { shade: w.shade, product: w.product, brand: w.brand, slot: w.slot, hex: w.hex, others: cands.filter((_, i) => i !== win) };
  }
  function selectBestSet(tone) { if (!tone) return tone; const out = {}; STEPS.forEach(s => { const b = bestProduct(tone[s], s); if (b) out[s] = b; }); return out; }

  // Ported from app.js: look + style intensity
  function currentLook() { return (STATE.look && STATE.lookData?.[STATE.look]) || null; }
  function lookIntensity(step) { const m = currentLook()?.intensity?.[step]; return (typeof m === 'number' && m > 0) ? Math.min(1, m) : 1; }
  function lookNote(step) { const l = currentLook(); if (!l) return ''; const focalStep = STATE.focalData?.[STATE.focal]?.mapStep || FOCAL_TO_STEP[STATE.focal]; return (step === focalStep ? l.focalGuide?.[step] : null) || l.guide?.[step] || ''; }
  function styleIntensity(step, style) {
    const s = style === undefined ? STATE.style : style;
    const scale = v => Math.max(0.18, Math.min(1, v * lookIntensity(step)));
    if (s?.intensity && typeof s.intensity[step] === 'number') return scale(s.intensity[step]);
    const FALLBACK = { lips: { lips: 1.00, blush: 0.38, eyebrows: 0.50, contour: 0.55 }, eyebrows: { lips: 0.38, blush: 0.32, eyebrows: 1.00, contour: 0.60 }, cheeks: { lips: 0.38, blush: 1.00, eyebrows: 0.50, contour: 0.55 }, contour: { lips: 0.38, blush: 0.32, eyebrows: 0.50, contour: 1.00 } };
    return scale((FALLBACK[STATE.focal] || FALLBACK.lips)[step] ?? 0.5);
  }
  function formatTone(k) { return { light_warm: 'Light Warm', light_cool: 'Light Cool', medium_warm: 'Medium Warm', medium_cool: 'Medium Cool', dark_warm: 'Deep Warm', dark_cool: 'Deep Cool' }[k] || k; }

  // Ported verbatim from app.js: skin tone detection
  // Skin tone
  // The whites of the eyes are close to neutral for everyone, so any tint there comes
  // from the lighting. It's used to white-balance the skin sample (Mbatha et al.).
function sampleScleraWhite(ctx, lm, vW, vH) {
  try {
    const pts=[];
    const between=(cornerIdx, irisIdx)=>{
      const c=lm[cornerIdx], ir=lm[irisIdx];
      if(!c||!ir) return;
      [0.35,0.55].forEach(t=>pts.push({x:c.x+(ir.x-c.x)*t, y:c.y+(ir.y-c.y)*t}));
    };
    if (lm.length>473){
      // refineLandmarks gives iris centres (468 left, 473 right): the segment
      // from each eye corner toward the iris lands squarely on sclera.
      between(33,468); between(133,468);
      between(263,473); between(362,473);
    } else {
      [[33,133],[362,263]].forEach(([a,b])=>{
        const p=lm[a], q=lm[b]; if(!p||!q) return;
        pts.push({x:(p.x+q.x)/2, y:(p.y+q.y)/2});
      });
    }

    const cand=[];
    pts.forEach(p=>{
      const cx=Math.round(p.x*vW), cy=Math.round(p.y*vH);
      const x0=Math.max(0,cx-2), y0=Math.max(0,cy-2);
      const w=Math.min(vW,cx+3)-x0, h=Math.min(vH,cy+3)-y0;
      if(w<=0||h<=0) return;
      const d=ctx.getImageData(x0,y0,w,h).data;
      for(let q=0;q<d.length;q+=4){
        const r=d[q], g=d[q+1], b=d[q+2];
        const mx=Math.max(r,g,b), mn=Math.min(r,g,b);
        const sat = mx===0 ? 0 : (mx-mn)/mx;
        // Sclera: bright and the least saturated thing near the eye. Kept loose because a
        // strong colour cast tints the sclera too, and that tint is what we're measuring.
        if (mx>70 && sat<0.45) cand.push({r,g,b,v:mx,s:sat});
      }
    });
    if (cand.length<8) return null;
    // Keep the least saturated half (skin and iris are more saturated than sclera).
    cand.sort((a,b)=>a.s-b.s);
    const top=cand.slice(0, Math.max(6, Math.floor(cand.length*0.5)));
    const med=k=>{const a=top.map(s=>s[k]).sort((p,q)=>p-q);return a[a.length>>1];};
    const w={r:med('r'), g:med('g'), b:med('b')};
    // A clipped reference has lost its colour information, so the cast it
    // reports cannot be trusted (only its brightness can).
    w.clipped = Math.max(w.r,w.g,w.b) >= 250;
    return w;
  } catch(e){ return null; }
}

function detectToneFromImage(image, lm, W, H) {
  try {
    const vW=image.width||W, vH=image.height||H;
    const tmp=document.createElement('canvas'); tmp.width=vW; tmp.height=vH;
    const ctx=tmp.getContext('2d',{willReadFrequently:true}); ctx.drawImage(image,0,0,vW,vH);
    // Well-lit skin only: cheeks and forehead (no nose tip shine or chin shadow).
    const idxs=[234,454,116,345,50,280,205,425,10,151,9,117,346];
    const samples=[];
    idxs.forEach(i=>{
      const p=lm[i]; if(!p) return;
      const cx=Math.round(p.x*vW), cy=Math.round(p.y*vH);
      const x0=Math.max(0,cx-2), y0=Math.max(0,cy-2);
      const w=Math.min(vW,cx+3)-x0, h=Math.min(vH,cy+3)-y0;
      if(w<=0||h<=0) return;
      const d=ctx.getImageData(x0,y0,w,h).data;
      let r=0,g=0,b=0,n=0;
      for(let q=0;q<d.length;q+=4){r+=d[q];g+=d[q+1];b+=d[q+2];n++;}
      if(n) samples.push({r:r/n,g:g/n,b:b/n});
    });
    if (!samples.length) return 'medium_warm';
    // Median per channel, robust to a single shadowed point, stray hair, or a
    // glasses frame crossing a sample.
    const med=k=>{const a=samples.map(s=>s[k]).sort((p,q)=>p-q);return a[a.length>>1];};
    let r=med('r'), g=med('g'), b=med('b');

    // Lighting normalisation against the neutral sclera reference
    const white=sampleScleraWhite(ctx, lm, vW, vH);
    if (white){
      // 1. Colour cast: per-channel gains that turn the reference grey (von Kries).
      //    Skipped when the reference is clipped.
      const clampGain=v=>Math.min(1.6, Math.max(0.625, v));
      if (!white.clipped){
        const wMean=(white.r+white.g+white.b)/3;
        r=Math.min(255,r*clampGain(wMean/Math.max(1,white.r)));
        g=Math.min(255,g*clampGain(wMean/Math.max(1,white.g)));
        b=Math.min(255,b*clampGain(wMean/Math.max(1,white.b)));
      } else {
        // Clipped reference: anchor on green for a partial correction.
        r=Math.min(255,r*clampGain(white.g/Math.max(1,white.r)));
        b=Math.min(255,b*clampGain(white.g/Math.max(1,white.b)));
      }

    }

    const br=r*.299+g*.587+b*.114;

    // Tone level
    // Skin brightness relative to the sclera, so exposure cancels out.
    let level;
    if (white && !white.clipped){
      const wBr=white.r*.299+white.g*.587+white.b*.114;
      const ratio=br/Math.max(1,wBr);
      // Boundaries sit midway between the reference skin swatches measured
      // against a neutral sclera (light .90, medium .68, deep .42).
      level = ratio>0.785 ? 'light' : ratio>0.545 ? 'medium' : 'dark';
    } else {
      // No usable reference (eyes closed or blown out): fall back to absolute bands.
      level = br>178 ? 'light' : br>128 ? 'medium' : 'dark';
    }
    // Undertone judged relative to overall brightness, so it isn't just "warm"
    // for everyone (skin is always r>b in absolute terms).
    const undertone = (r-b) > br*0.20 ? 'warm' : 'cool';
    return `${level}_${undertone}`;
  } catch(e){return 'medium_warm';}
}


  // Fallback when FaceMesh can't load: sample a clicked point
  function classifyRGB(r, g, b) {
    const br = r * .299 + g * .587 + b * .114;
    const level = br > 178 ? 'light' : br > 128 ? 'medium' : 'dark';
    const undertone = (r - b) > br * 0.20 ? 'warm' : 'cool';
    return `${level}_${undertone}`;
  }

  // FaceMesh loader (same CDN and options as the thesis app)
  let meshPromise = null;
  function loadFaceMesh() {
    if (meshPromise) return meshPromise;
    meshPromise = new Promise((resolve, reject) => {
      const done = () => {
        try {
          const mesh = new window.FaceMesh({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}` });
          mesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: .6, minTrackingConfidence: .6 });
          resolve(mesh);
        } catch (e) { reject(e); }
      };
      if (window.FaceMesh) return done();
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
      s.crossOrigin = 'anonymous';
      s.onload = done; s.onerror = () => reject(new Error('FaceMesh script blocked'));
      document.head.appendChild(s);
      setTimeout(() => reject(new Error('FaceMesh took too long to load')), 15000);
    }).catch(e => { meshPromise = null; throw e; });
    return meshPromise;
  }
  function runMesh(mesh, image) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('FaceMesh timed out')), 20000);
      mesh.onResults(res => { clearTimeout(t); resolve(res.multiFaceLandmarks && res.multiFaceLandmarks[0] || null); });
      mesh.send({ image }).catch(err => { clearTimeout(t); reject(err); });
    });
  }

  const LIPS_OUTER = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146];
  const LIPS_INNER = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95];
  const BROW_L = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];
  const BROW_R = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276];

  function mount(root) {
    loadShades();
    root.innerHTML = `
      <div class="studio">
        <div>
          <div class="cam" id="aimStage">
            <div class="placeholder">Start your camera or upload a photo. FaceMesh maps your face, then the app reads your skin tone the same way the mirror does.</div>
            <video id="aimVideo" playsinline muted hidden></video>
            <canvas id="aimImg" hidden></canvas>
            <canvas id="aimOverlay" class="overlay" hidden></canvas>
          </div>
          <div class="actions" style="margin-top:12px">
            <button class="btn small" type="button" id="aimCam">Use my camera</button>
            <label class="btn small ghost" style="margin:0" for="aimFile">Upload a photo</label>
            <input type="file" id="aimFile" accept="image/*" class="sr-only">
            <button class="btn small ghost" type="button" id="aimSample">Use my portrait</button>
          </div>
          <div class="actions" style="margin-top:8px">
            <button class="btn small blush" type="button" id="aimCapture" hidden>Capture and analyze</button>
            <label class="switch" id="tryWrap" hidden><input type="checkbox" id="aimTry" checked> Show virtual try-on</label>
            <label class="switch"><input type="checkbox" id="aimMeshToggle" checked> Show face mesh</label>
          </div>
          <p class="status" id="aimStatus" role="status"></p>
        </div>
        <div>
          <div class="picker-label" style="margin-top:0">Skin tone <span class="muted" id="toneSrc" style="font-weight:400">(pick one, or analyze a photo)</span></div>
          <div class="tones" id="aimTones"></div>
          <div class="picker-label">Makeup look</div>
          <div class="seg" id="aimLooks"></div>
          <div class="picker-label">Focal point</div>
          <div class="seg" id="aimFocal"></div>
          <div class="picker-label">Recommended for you</div>
          <div class="recs" id="aimRecs"></div>
          <div class="picker-label">Coverage options for your focal point</div>
          <div class="variations" id="aimVars"></div>
          <p class="guide-text" id="aimGuide"></p>
        </div>
      </div>
      <p class="note">Everything runs in your browser. Like the real mirror, no photo is uploaded anywhere. If FaceMesh can't load (for example, offline), click on your cheek in the photo and the demo samples that spot instead.</p>`;

    const $ = s => root.querySelector(s);
    const video = $('#aimVideo'), imgC = $('#aimImg'), ov = $('#aimOverlay'), stage = $('#aimStage'), status = $('#aimStatus');
    let stream = null, landmarks = null, mode = null, fallbackClick = false;

    function setStatus(t, err) { status.textContent = t; status.style.color = err ? 'var(--warn)' : ''; }
    function stopCam() { if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } }
    window.addEventListener('pf:leave', stopCam, { once: true });

    /* Pickers */
    $('#aimTones').innerHTML = TONES.map(k => { const c = toneToRGB(k); return `<button type="button" class="tone-btn" data-k="${k}" aria-pressed="false"><i style="background:rgb(${c.r},${c.g},${c.b})"></i>${formatTone(k)}</button>`; }).join('');
    $('#aimLooks').innerHTML = Object.entries(D.looks).map(([k, v]) => `<button type="button" data-k="${k}" aria-pressed="false" title="${v.desc}">${v.label}</button>`).join('');
    $('#aimFocal').innerHTML = Object.entries(D.focal).map(([k, v]) => `<button type="button" data-k="${k}" aria-pressed="false" title="${v.desc}">${v.label}</button>`).join('');
    root.querySelectorAll('#aimTones .tone-btn').forEach(b => b.addEventListener('click', () => { STATE.toneKey = b.dataset.k; $('#toneSrc').textContent = '(picked manually)'; render(); }));
    root.querySelectorAll('#aimLooks button').forEach(b => b.addEventListener('click', () => { STATE.look = b.dataset.k; render(); }));
    root.querySelectorAll('#aimFocal button').forEach(b => b.addEventListener('click', () => { STATE.focal = b.dataset.k; STATE.style = null; render(); }));

    function render() {
      root.querySelectorAll('#aimTones .tone-btn').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === STATE.toneKey)));
      root.querySelectorAll('#aimLooks button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === STATE.look)));
      root.querySelectorAll('#aimFocal button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === STATE.focal)));
      const set = selectBestSet(STATE.shades[STATE.toneKey]);
      const focalStep = FOCAL_TO_STEP[STATE.focal];
      const f = STATE.foundationData[STATE.toneKey];
      $('#aimRecs').innerHTML = STEPS.map(s => {
        const p = set[s]; if (!p) return '';
        const alts = p.others && p.others.length ? `<span>Also compared: ${p.others.map(o => o.brand + ' ' + o.shade).join(', ')}</span>` : '';
        return `<div class="rec${s === focalStep ? ' focal' : ''}"><div class="sw" style="background:${p.hex}"></div><div><b>${STEP_LABELS[s]}: ${p.shade}</b><span>${p.brand}, ${p.product}${s === focalStep ? ' (focal point)' : ''}</span>${alts}</div></div>`;
      }).join('') + (f ? `<div class="rec"><div class="sw" style="background:${f.hex}"></div><div><b>Foundation: ${f.shade}</b><span>${f.brand}, ${f.product}</span></div></div>` : '');
      const vars = D.styles[STATE.focal] || [];
      if (!STATE.style || !vars.find(v => v.id === STATE.style.id)) STATE.style = vars[1] || vars[0] || null;
      $('#aimVars').innerHTML = vars.map(v => `<button type="button" class="var" data-id="${v.id}" aria-pressed="${STATE.style && STATE.style.id === v.id}"><b>${v.name}</b><small>${v.desc}</small><div class="bars">${STEPS.map(s => { const val = styleIntensity(s, v); return `<div class="bar"><span>${STEP_LABELS[s]}</span><div><i style="width:${Math.round(val * 100)}%"></i></div><span>${Math.round(val * 100)}%</span></div>`; }).join('')}</div></button>`).join('');
      root.querySelectorAll('#aimVars .var').forEach(b => b.addEventListener('click', () => { STATE.style = vars.find(v => v.id === b.dataset.id); render(); }));
      const l = currentLook();
      $('#aimGuide').innerHTML = `<b>${l.label} guidance for your focal step:</b> ${lookNote(focalStep)}`;
      drawOverlay();
    }

    /* Overlay: mesh points + simple try-on using the recommended shades */
    function sizeOverlay(w, h) { ov.width = w; ov.height = h; ov.hidden = false; }
    function poly(ctx, idx, w, h) { ctx.beginPath(); idx.forEach((i, n) => { const p = landmarks[i]; const x = p.x * w, y = p.y * h; n ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); }
    function drawOverlay() {
      if (!landmarks || ov.hidden) return;
      const ctx = ov.getContext('2d'), w = ov.width, h = ov.height;
      ctx.clearRect(0, 0, w, h);
      const set = selectBestSet(STATE.shades[STATE.toneKey]);
      if ($('#aimTry').checked) {
        const k = s => styleIntensity(s);
        ctx.save(); ctx.globalAlpha = 0.45 * k('lips'); ctx.fillStyle = set.lips.hex; poly(ctx, LIPS_OUTER, w, h); ctx.fill(); ctx.globalCompositeOperation = 'destination-out'; ctx.globalAlpha = 1; poly(ctx, LIPS_INNER, w, h); ctx.fill(); ctx.restore();
        [[50], [280]].forEach(([i]) => { const p = landmarks[i]; const r = Math.hypot((landmarks[234].x - landmarks[454].x) * w, (landmarks[234].y - landmarks[454].y) * h) * 0.11; const g = ctx.createRadialGradient(p.x * w, p.y * h, 0, p.x * w, p.y * h, r); g.addColorStop(0, set.blush.hex); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.save(); ctx.globalAlpha = 0.5 * k('blush'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x * w, p.y * h, r, 0, Math.PI * 2); ctx.fill(); ctx.restore(); });
        ctx.save(); ctx.globalAlpha = 0.35 * k('eyebrows'); ctx.fillStyle = set.eyebrows.hex; poly(ctx, BROW_L, w, h); ctx.fill(); poly(ctx, BROW_R, w, h); ctx.fill(); ctx.restore();
      }
      if ($('#aimMeshToggle').checked) {
        ctx.fillStyle = 'rgba(255,158,187,.85)';
        const r = Math.max(1, w / 420);
        landmarks.forEach((p, i) => { if (i % 2) return; ctx.beginPath(); ctx.arc(p.x * w, p.y * h, r, 0, Math.PI * 2); ctx.fill(); });
      }
    }
    $('#aimTry').addEventListener('change', drawOverlay);
    $('#aimMeshToggle').addEventListener('change', () => { drawOverlay(); });

    /* Analyze a still image */
    async function analyze(source, w, h) {
      imgC.width = w; imgC.height = h; imgC.hidden = false;
      const ictx = imgC.getContext('2d'); ictx.drawImage(source, 0, 0, w, h);
      sizeOverlay(w, h); ov.classList.remove('mirrored');
      stage.querySelector('.placeholder')?.remove();
      landmarks = null; fallbackClick = false; $('#tryWrap').hidden = true;
      ov.getContext('2d').clearRect(0, 0, w, h);
      setStatus('Loading MediaPipe FaceMesh…');
      try {
        const mesh = await loadFaceMesh();
        setStatus('Mapping 468 face points…');
        const lm = await runMesh(mesh, imgC);
        if (!lm) { setStatus('No face found. Try a well-lit photo facing forward.', true); return; }
        landmarks = lm;
        STATE.toneKey = detectToneFromImage(imgC, lm, w, h);
        $('#toneSrc').textContent = '(detected from your photo)';
        $('#tryWrap').hidden = false;
        setStatus(`Detected skin tone: ${formatTone(STATE.toneKey)}. Change the look or focal point to see the recommendations update.`);
        render();
      } catch (e) {
        fallbackClick = true;
        setStatus('FaceMesh could not load here. Click on your cheek in the photo to sample your skin tone.', true);
      }
    }
    ov.addEventListener('click', e => {
      if (!fallbackClick) return;
      const r = ov.getBoundingClientRect();
      // object-fit: cover maps the click back to canvas pixels
      const scale = Math.max(r.width / imgC.width, r.height / imgC.height);
      const ox = (r.width - imgC.width * scale) / 2, oy = (r.height - imgC.height * scale) / 2;
      const x = Math.round((e.clientX - r.left - ox) / scale), y = Math.round((e.clientY - r.top - oy) / scale);
      const d = imgC.getContext('2d').getImageData(Math.max(0, x - 3), Math.max(0, y - 3), 7, 7).data;
      let R = 0, G = 0, B = 0, n = 0; for (let i = 0; i < d.length; i += 4) { R += d[i]; G += d[i + 1]; B += d[i + 2]; n++; }
      STATE.toneKey = classifyRGB(R / n, G / n, B / n);
      $('#toneSrc').textContent = '(sampled from the spot you clicked)';
      const c = ov.getContext('2d'); c.clearRect(0, 0, ov.width, ov.height); c.strokeStyle = '#fff'; c.lineWidth = Math.max(2, ov.width / 200); c.beginPath(); c.arc(x, y, ov.width / 30, 0, Math.PI * 2); c.stroke();
      setStatus(`Sampled skin tone: ${formatTone(STATE.toneKey)}.`);
      render();
    });

    function loadImage(src) {
      const im = new Image();
      im.onload = () => { stopCam(); video.hidden = true; $('#aimCapture').hidden = true; const s = Math.min(1, 900 / Math.max(im.width, im.height)); analyze(im, Math.round(im.width * s), Math.round(im.height * s)); };
      im.onerror = () => setStatus('That file could not be opened as an image.', true);
      im.src = src;
    }
    $('#aimSample').addEventListener('click', () => loadImage('assets/img/resi.jpg'));
    $('#aimFile').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => loadImage(rd.result); rd.readAsDataURL(f); });

    $('#aimCam').addEventListener('click', async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setStatus('This browser can’t open a camera here. Upload a photo instead.', true); return; }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 960 } }, audio: false });
        video.srcObject = stream; video.hidden = false; await video.play();
        stage.querySelector('.placeholder')?.remove(); imgC.hidden = true; ov.hidden = true; landmarks = null;
        $('#aimCapture').hidden = false; mode = 'cam';
        setStatus('Face the camera in even light, then press Capture and analyze.');
      } catch (e) { setStatus('Camera access was blocked. Allow the camera, or upload a photo instead.', true); }
    });
    $('#aimCapture').addEventListener('click', () => {
      if (!stream) return;
      const w = video.videoWidth, h = video.videoHeight;
      const c = document.createElement('canvas'); c.width = w; c.height = h; const cx = c.getContext('2d');
      cx.translate(w, 0); cx.scale(-1, 1); cx.drawImage(video, 0, 0, w, h);
      stopCam(); video.hidden = true; $('#aimCapture').hidden = true;
      analyze(c, w, h);
    });

    render();
  }

  window.AimDemo = { mount };
})();
