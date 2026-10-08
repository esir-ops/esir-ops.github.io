/* Blood Donation Hub flow
   Screens, messages, and validation follow account/views.py and account/forms.py
   in github.com/esir-ops/Blood-Donation-Project. Data stays in this browser. */
(function () {
  const TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const today = () => new Date(new Date().toDateString());

  function mount(root) {
    const db = () => PStore.get('bd-db', { users: [], profiles: {} });
    const save = d => PStore.set('bd-db', d);
    let current = null, flash = null;

    root.innerHTML = `
      <div class="blood-grid">
        <div class="phone"><div class="phone-top"><span>🩸 Blood Donation Hub</span><span id="bdWho" style="font-weight:500;font-size:13px"></span></div><div class="phone-body" id="bdScreen"></div></div>
        <div>
          <div class="picker-label" style="margin-top:0">What's happening behind the screen</div>
          <div id="bdExplain" class="qcard" style="font-size:15px"></div>
          <div class="actions" style="margin-top:14px"><button class="btn small ghost" type="button" id="bdReset">Clear demo data</button></div>
        </div>
      </div>`;
    const $ = s => root.querySelector(s);
    const scr = $('#bdScreen');

    function explain(view, html) { $('#bdExplain').innerHTML = `<div class="badge" style="margin-bottom:10px">${view}</div>${html}`; }
    function msg() { if (!flash) return ''; const m = `<p class="${flash[1] === 'error' ? 'err' : 'okmsg'}" role="status" style="margin:0 0 12px">${esc(flash[0])}</p>`; flash = null; return m; }
    function nav() { $('#bdWho').textContent = current ? current.username : ''; }

    function viewRegister(errs = {}, vals = {}) {
      nav();
      scr.innerHTML = `${msg()}<h4 style="margin-bottom:14px">Register</h4>
        <div class="field"><label for="bU">Username</label><input id="bU" type="text" maxlength="30" value="${esc(vals.u)}">${errs.u ? `<p class="err">${errs.u}</p>` : ''}</div>
        <div class="field"><label for="bE">Email</label><input id="bE" type="email" value="${esc(vals.e)}">${errs.e ? `<p class="err">${errs.e}</p>` : ''}</div>
        <div class="field"><label for="bP">Password</label><input id="bP" type="password">${errs.p ? `<p class="err">${errs.p}</p>` : ''}</div>
        <button class="btn" type="button" id="bReg">Register</button>
        <p class="muted" style="font-size:14px;margin-top:14px">Already have an account? <a href="#" id="toLogin">Log in</a></p>`;
      explain('register()', `<p>Uses <code>RegistrationForm</code>, a ModelForm on the custom user model. <code>clean_password()</code> rejects passwords shorter than 6 characters, and username and email must be unique.</p><p class="muted" style="margin:0">On success the view shows "Registration successful! You can now log in." and redirects to login.</p>`);
      $('#toLogin').addEventListener('click', e => { e.preventDefault(); viewLogin(); });
      $('#bReg').addEventListener('click', () => {
        const u = $('#bU').value.trim(), e = $('#bE').value.trim(), p = $('#bP').value, d = db(), er = {};
        if (!u) er.u = 'This field is required.'; else if (d.users.some(x => x.username.toLowerCase() === u.toLowerCase())) er.u = 'Custom user with this Username already exists.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) er.e = 'Enter a valid email address.'; else if (d.users.some(x => x.email.toLowerCase() === e.toLowerCase())) er.e = 'Custom user with this Email already exists.';
        if (p.length < 6) er.p = 'Password must be at least 6 characters long.';
        if (Object.keys(er).length) return viewRegister(er, { u, e });
        d.users.push({ username: u, email: e.toLowerCase(), password: hashish(p) }); save(d);
        flash = ['Registration successful! You can now log in.', 'success']; viewLogin({}, { e });
      });
    }

    function viewLogin(errs = {}, vals = {}) {
      nav();
      scr.innerHTML = `${msg()}<h4 style="margin-bottom:14px">Login</h4>
        <div class="field"><label for="lE">Email</label><input id="lE" type="email" placeholder="Enter your email" value="${esc(vals.e)}">${errs.e ? `<p class="err">${errs.e}</p>` : ''}</div>
        <div class="field"><label for="lP">Password</label><input id="lP" type="password" placeholder="Enter your password">${errs.p ? `<p class="err">${errs.p}</p>` : ''}</div>
        <button class="btn" type="button" id="bLog">Log in</button>
        <p class="muted" style="font-size:14px;margin-top:14px">No account yet? <a href="#" id="toReg">Register</a></p>`;
      explain('login_view()', `<p>The custom user model logs in with <b>email</b> instead of a username (<code>USERNAME_FIELD = 'email'</code>). After authenticating, the view checks for a <code>UserProfile</code>.</p><p class="muted" style="margin:0">No profile yet means a redirect to complete_profile with "Please complete your profile."</p>`);
      $('#toReg').addEventListener('click', e => { e.preventDefault(); viewRegister(); });
      $('#bLog').addEventListener('click', () => {
        const e = $('#lE').value.trim().toLowerCase(), p = $('#lP').value, er = {};
        if (!e) er.e = 'Email is required.'; if (!p) er.p = 'Password is required.';
        if (Object.keys(er).length) return viewLogin(er, { e });
        const d = db(), u = d.users.find(x => x.email === e && x.password === hashish(p));
        if (!u) { flash = ['Invalid credentials.', 'error']; return viewLogin({}, { e }); }
        current = u;
        if (!d.profiles[u.email]) { flash = ['Please complete your profile.', 'warning']; return viewProfileForm(true); }
        viewProfile();
      });
    }

    function profileFields(p = {}, errs = {}, complete) {
      return `
        <div class="grid2"><div class="field"><label for="pF">First name</label><input id="pF" type="text" maxlength="30" value="${esc(p.first_name)}"></div>
        <div class="field"><label for="pL">Last name</label><input id="pL" type="text" maxlength="30" value="${esc(p.last_name)}"></div></div>
        <div class="grid2"><div class="field"><label for="pW">Weight (kg)</label><input id="pW" type="number" step="0.1" value="${esc(p.weight)}">${errs.w ? `<p class="err">${errs.w}</p>` : ''}</div>
        <div class="field"><label for="pH">Height (cm)</label><input id="pH" type="number" step="0.1" value="${esc(p.height)}">${errs.h ? `<p class="err">${errs.h}</p>` : ''}</div></div>
        <div class="field"><label for="pR">Region</label><input id="pR" type="text" maxlength="50" value="${esc(p.region ?? 'Central Luzon')}"></div>
        <div class="grid2"><div class="field"><label for="pP">Province</label><input id="pP" type="text" maxlength="50" value="${esc(p.province ?? 'Pampanga')}"></div>
        <div class="field"><label for="pM">Municipality</label><input id="pM" type="text" maxlength="50" value="${esc(p.municipality ?? 'Angeles City')}"></div></div>
        <div class="grid2"><div class="field"><label for="pB">Blood type</label><select id="pB" ${complete ? '' : 'disabled'}>${TYPES.map(t => `<option ${p.blood_type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
        <div class="field"><label for="pD">Last donation date</label><input id="pD" type="date" value="${esc(p.last_donation_date)}"></div></div>
        <label class="switch" style="margin-bottom:6px"><input type="checkbox" id="pA" ${p.availability !== false ? 'checked' : ''}> Available to donate</label>
        ${errs.a ? `<p class="err">${errs.a}</p>` : ''}
        ${errs.req ? `<p class="err">${errs.req}</p>` : ''}`;
    }
    function readProfile() {
      return { first_name: $('#pF').value.trim(), last_name: $('#pL').value.trim(), weight: $('#pW').value, height: $('#pH').value, region: $('#pR').value.trim(), province: $('#pP').value.trim(), municipality: $('#pM').value.trim(), blood_type: $('#pB').value, last_donation_date: $('#pD').value || null, availability: $('#pA').checked };
    }
    function validate(p) {
      const er = {};
      if (!p.first_name || !p.last_name || !p.region || !p.province || !p.municipality || p.weight === '' || p.height === '') er.req = 'Fill in all required fields.';
      if (p.weight !== '' && +p.weight <= 0) er.w = 'Weight must be a positive number.';
      if (p.height !== '' && +p.height <= 0) er.h = 'Height must be a positive number.';
      return er;
    }

    function viewProfileForm(complete, errs = {}, vals) {
      nav();
      const d = db(), existing = d.profiles[current.email] || {};
      const p = vals || existing;
      scr.innerHTML = `${msg()}<h4 style="margin-bottom:14px">${complete ? 'Complete Your Profile' : 'Update Your Profile'}</h4>${profileFields(p, errs, complete)}
        <div class="actions" style="margin-top:10px"><button class="btn" type="button" id="pSave">${complete ? 'Save profile' : 'Update profile'}</button>${complete ? '' : '<button class="btn ghost" type="button" id="pBack">Cancel</button>'}</div>`;
      if (complete) explain('complete_profile()', `<p><code>UserProfileForm</code> saves weight, height, region, province, municipality, blood type, and availability. <code>clean_weight()</code> and <code>clean_height()</code> reject values of 0 or less.</p><p class="muted" style="margin:0">On success: "Profile completed successfully!"</p>`);
      else explain('UpdateProfileView.post()', `<p>If you switch availability on and your last donation was less than <b>56 days</b> ago, the view adds an error with the days remaining and keeps you on this page.</p><p class="muted" style="margin:0">Try it: set a last donation date from a few weeks ago, then turn on availability. Blood type is locked after the first save.</p>`);
      $('#pSave').addEventListener('click', () => {
        const np = readProfile(); if (!complete) np.blood_type = existing.blood_type;
        const er = validate(np);
        if (!complete && np.availability && existing.last_donation_date) {
          const days = Math.floor((today() - new Date(existing.last_donation_date + 'T00:00:00')) / 864e5);
          if (days < 56) er.a = `You must wait ${56 - days} more days before becoming available again.`;
        }
        if (Object.keys(er).length) return viewProfileForm(complete, er, np);
        const dd = db(); dd.profiles[current.email] = { ...np, updated_at: new Date().toISOString(), create_at: existing.create_at || new Date().toISOString() }; save(dd);
        flash = [complete ? 'Profile completed successfully!' : 'Profile updated successfully!', 'success'];
        viewProfile();
      });
      $('#pBack')?.addEventListener('click', viewProfile);
    }

    function viewProfile() {
      nav();
      const p = db().profiles[current.email];
      let wait = '';
      if (p.last_donation_date) {
        const days = Math.floor((today() - new Date(p.last_donation_date + 'T00:00:00')) / 864e5);
        wait = days < 56 ? `${days} days since last donation, ${56 - days} days until eligible` : `${days} days since last donation, eligible`;
      }
      scr.innerHTML = `${msg()}<h4 style="margin-bottom:14px">Your Profile</h4>
        <div style="display:flex;gap:16px;align-items:center;margin-bottom:12px"><div class="bt">${esc(p.blood_type)}</div><div><b>${esc(p.first_name)} ${esc(p.last_name)}</b><div class="muted" style="font-size:14px">${esc(p.municipality)}, ${esc(p.province)}</div></div></div>
        <div class="profile-row"><span>Status</span><b style="color:${p.availability ? 'var(--ok)' : 'var(--warn)'}">${p.availability ? 'Available' : 'Not available'}</b></div>
        <div class="profile-row"><span>Weight / height</span><b>${esc(p.weight)} kg / ${esc(p.height)} cm</b></div>
        <div class="profile-row"><span>Region</span><b>${esc(p.region)}</b></div>
        <div class="profile-row"><span>Last donation</span><b>${p.last_donation_date ? esc(p.last_donation_date) : 'None yet'}</b></div>
        ${wait ? `<p class="muted" style="font-size:14px;margin-top:10px">${wait}</p>` : ''}
        <div class="profile-row"><span>Donation requests</span><b>0</b></div>
        <div class="actions" style="margin-top:16px"><button class="btn" type="button" id="pEdit">Update profile</button><button class="btn ghost" type="button" id="pOut">Log out</button></div>`;
      explain('profile_view()', `<p>Shows the logged-in user's <code>UserProfile</code> and their <code>BloodDonationRequest</code> records. The page is protected with <code>@login_required</code>.</p>`);
      $('#pEdit').addEventListener('click', () => viewProfileForm(false));
      $('#pOut').addEventListener('click', () => { current = null; viewLogin(); });
    }

    // Demo-only stand-in for Django's password hashing
    function hashish(s) { let h = 5381; for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) | 0; return 'demo$' + (h >>> 0).toString(16); }

    $('#bdReset').addEventListener('click', () => { PStore.set('bd-db', { users: [], profiles: {} }); current = null; flash = ['Demo data cleared.', 'success']; viewRegister(); });
    viewRegister();
  }
  window.BloodDemo = { mount };
})();
