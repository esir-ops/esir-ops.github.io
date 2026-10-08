/* Trivia Quiz client
   Questions are the rows of instance/trivia.db from github.com/esir-ops/trivia-quiz.
   Hint text, answer normalization, scoring (+2 per correct) and the bonus rule
   (+1 when the session score is 10 or more) follow routes.py. */
(function () {
  const Q = window.TRIVIA_QUESTIONS;

  // routes.py: normalize_answer
  const normalize = a => a.trim().toLowerCase().split(/\s+/).filter(Boolean).join(' ');
  // routes.py: get_hints
  function hint(q) {
    const words = q.answer.split(/\s+/).filter(Boolean), n = words.length;
    const first = words.map(w => w[0]).join(', '), last = words.map(w => w[w.length - 1]).join(', ');
    return `The answer consists of ${n} word${n !== 1 ? 's' : ''}. The first letter${n === 1 ? ' is' : 's are'}: ${first}; the last letter${n === 1 ? ' is' : 's are'}: ${last}.`;
  }
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function mount(root) {
    const S = { user: null, token: null, quizId: null, qs: [], i: 0, answers: [], checked: false, hintUsed: false };
    let quizCounter = PStore.get('tq-quiz-id', 100);

    root.innerHTML = `
      <div class="trivia">
        <div id="tqMain"></div>
        <div>
          <div class="picker-label" style="margin-top:0">API console</div>
          <div class="console" id="tqConsole" aria-live="polite"><div style="color:#8F86A8"># Requests appear here as you play</div></div>
          <div class="picker-label">Leaderboard <span class="muted" style="font-weight:400">(GET /trivia/leaderboard, saved in this browser)</span></div>
          <ol class="lb" id="tqLb"></ol>
        </div>
      </div>`;
    const $ = s => root.querySelector(s);
    const main = $('#tqMain');

    function call(method, path, body, res) {
      const c = $('#tqConsole');
      c.insertAdjacentHTML('beforeend', `<div class="req">${method} ${esc(path)}${S.token && !/auth\/login|leaderboard|questions\/\d+\/(hints|answer)/.test(path) ? '\n  Authorization: Bearer ' + S.token.slice(0, 18) + '…' : ''}${body ? '\n' + esc(JSON.stringify(body, null, 2)) : ''}</div><div class="res">${esc(JSON.stringify(res, null, 2))}</div>`);
      c.scrollTop = c.scrollHeight;
      return res;
    }
    function board() { return PStore.get('tq-board', []); }
    function renderBoard() {
      const b = board().sort((a, c) => c.score - a.score).slice(0, 10);
      $('#tqLb').innerHTML = b.length ? b.map((u, i) => `<li><span>${i + 1}. ${esc(u.username)}</span><b>${u.score}</b></li>`).join('') : '<li class="muted">No scores yet. Finish a quiz to get on the board.</li>';
    }

    function viewLogin() {
      main.innerHTML = `
        <div class="qcard">
          <h4 style="margin-bottom:6px">Log in to start</h4>
          <p class="muted" style="font-size:15px">The real API issues a JWT on login. Here a demo token is created in your browser.</p>
          <div class="field"><label for="tqUser">Username</label><input id="tqUser" type="text" maxlength="24" autocomplete="nickname" placeholder="e.g. resi"></div>
          <div class="field"><label for="tqN">Number of questions (max 10)</label><select id="tqN">${[3, 5, 7, 10].map(n => `<option ${n === 5 ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
          <button class="btn" type="button" id="tqStart">Log in and start quiz</button>
          <p class="err" id="tqErr" role="alert"></p>
        </div>`;
      $('#tqStart').addEventListener('click', start);
      $('#tqUser').addEventListener('keydown', e => { if (e.key === 'Enter') start(); });
    }

    function start() {
      const name = $('#tqUser').value.trim();
      if (!name) { $('#tqErr').textContent = 'Enter a username to log in.'; return; }
      S.user = name;
      S.token = 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify({ sub: name, t: Date.now() })).replace(/=/g, '');
      call('POST', '/auth/login', { username: name, password: '••••••' }, { access_token: S.token, notifications: [] });
      const n = +$('#tqN').value;
      S.qs = shuffle(Q).slice(0, n); S.i = 0; S.answers = []; S.quizId = ++quizCounter; PStore.set('tq-quiz-id', quizCounter);
      call('POST', '/trivia/quiz/start', { num_questions: n }, { message: 'Quiz started successfully!', quiz_id: S.quizId, questions: S.qs.map(q => ({ id: q.id, question: q.question, category: q.category })) });
      viewQuestion();
    }

    function viewQuestion() {
      const q = S.qs[S.i]; S.checked = false; S.hintUsed = false;
      main.innerHTML = `
        <div class="qcard">
          <div class="progress"><i style="width:${(S.i / S.qs.length) * 100}%"></i></div>
          <div class="qmeta"><span class="badge">${esc(q.category)}</span><span class="badge" style="background:var(--lilac-tint)">${esc(q.difficulty)}</span><span class="muted" style="font-size:14px;margin-left:auto">Question ${S.i + 1} of ${S.qs.length}</span></div>
          <div class="qtext">${esc(q.question)}</div>
          <div class="field"><label for="tqAns">Your answer</label><input id="tqAns" type="text" autocomplete="off" spellcheck="false"></div>
          <div class="actions">
            <button class="btn" type="button" id="tqCheck">Check answer</button>
            <button class="btn ghost" type="button" id="tqHint">Get a hint</button>
            <button class="btn ghost" type="button" id="tqSkip">Skip</button>
          </div>
          <div id="tqHintBox"></div>
          <div id="tqResult"></div>
        </div>`;
      const ans = $('#tqAns'); ans.focus();
      ans.addEventListener('keydown', e => { if (e.key === 'Enter') (S.checked ? next() : check()); });
      $('#tqCheck').addEventListener('click', () => (S.checked ? next() : check()));
      $('#tqHint').addEventListener('click', () => {
        const res = call('GET', `/trivia/questions/${q.id}/hints`, null, { question: q.question, word_count: q.answer.split(/\s+/).length, hint: hint(q) });
        $('#tqHintBox').innerHTML = `<div class="result" style="background:var(--lilac-tint)">💡 ${esc(res.hint)}</div>`;
      });
      $('#tqSkip').addEventListener('click', () => { S.answers.push({ question_id: q.id, answer: '' }); next(); });
    }

    function check() {
      const q = S.qs[S.i], a = $('#tqAns').value;
      if (!a.trim()) { $('#tqResult').innerHTML = '<p class="err">Type an answer first, or press Skip.</p>'; return; }
      const ok = normalize(a) === normalize(q.answer);
      call('POST', `/trivia/questions/${q.id}/answer`, { answer: a }, { question: q.question, your_answer: a, correct_answer: q.answer, is_correct: ok, feedback: ok ? 'Correct!' : 'Incorrect. Try again.' });
      S.answers.push({ question_id: q.id, answer: a }); S.checked = true;
      $('#tqResult').innerHTML = `<div class="result ${ok ? 'good' : 'bad'}"><b>${ok ? 'Correct!' : 'Not quite.'}</b> The answer is <b>${esc(q.answer)}</b>.<br><span class="muted">${esc(q.explanation)}</span></div>`;
      $('#tqCheck').textContent = S.i + 1 < S.qs.length ? 'Next question' : 'See my results';
      $('#tqHint').disabled = true; $('#tqSkip').disabled = true; $('#tqAns').readOnly = true;
    }

    function next() {
      S.i++;
      if (S.i < S.qs.length) return viewQuestion();
      finish();
    }

    function finish() {
      // routes.py: answer_multiple_questions -> +2 per correct answer
      const results = {}; let score = 0;
      S.answers.forEach(({ question_id, answer }) => {
        const q = Q.find(x => x.id === question_id), ok = normalize(answer || '') === normalize(q.answer);
        results[`Question ${question_id}`] = { question: q.question, your_answer: normalize(answer || ''), correct: ok };
        if (ok) score += 2;
      });
      call('POST', '/trivia/quiz/answer', { quiz_id: S.quizId, answers: S.answers }, { message: 'Answers submitted!', quiz_id: S.quizId, results });
      const b = board(); let u = b.find(x => x.username.toLowerCase() === S.user.toLowerCase()); if (!u) { u = { username: S.user, score: 0 }; b.push(u); }
      u.score += score;
      call('POST', '/trivia/quiz/end', { quiz_id: S.quizId }, { message: 'Quiz ended successfully', final_score: score, total_score: u.score, quiz_details: S.qs.map(q => ({ id: q.id, question: q.question, category: q.category, difficulty: q.difficulty, correct_answer: q.answer })) });
      // routes.py: update_score -> bonus = 1 if session.score >= 10
      const bonus = score >= 10 ? 1 : 0; u.score += bonus;
      call('PUT', '/trivia/score/update', { quiz_id: S.quizId }, { message: 'Score updated successfully', new_total_score: u.score });
      PStore.set('tq-board', b);
      call('GET', '/trivia/leaderboard', null, { leaderboard: b.sort((x, y) => y.score - x.score).slice(0, 10) });
      renderBoard();
      const correct = score / 2;
      main.innerHTML = `
        <div class="qcard">
          <div class="progress"><i style="width:100%"></i></div>
          <h4>Quiz finished, ${esc(S.user)}</h4>
          <div class="figs" style="margin:16px 0"><div><b>${correct}/${S.qs.length}</b>correct</div><div><b>${score}</b>session points</div><div><b>+${bonus}</b>bonus</div><div><b>${u.score}</b>total score</div></div>
          <p class="muted" style="font-size:15px">Each correct answer is worth 2 points. A session score of 10 or more earns a 1-point bonus, just like <code>/trivia/score/update</code>.</p>
          <div class="actions"><button class="btn" type="button" id="tqAgain">Play again</button><button class="btn ghost" type="button" id="tqOut">Log out</button></div>
        </div>`;
      $('#tqAgain').addEventListener('click', () => { viewLogin(); $('#tqUser').value = S.user; });
      $('#tqOut').addEventListener('click', () => { call('POST', '/auth/logout', null, { message: 'Successfully logged out' }); S.token = null; viewLogin(); });
    }

    renderBoard(); viewLogin();
  }
  window.TriviaDemo = { mount };
})();
