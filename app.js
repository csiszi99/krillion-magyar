(() => {
'use strict';
/* ====== Konstansok ====== */
const Q_PER_ROUND = 7, Q_TIME = 25000, COUNTDOWN = 3000, REVEAL_TIME = 9000, BONUS = 20;
const TIERS = [null,
  {n:'Plankton', p:10}, {n:'Túl okos', p:15}, {n:'Kishal', p:30},
  {n:'Ritka', p:60}, {n:'Mélytengeri', p:85}, {n:'Egy a krillióhoz', p:100}];
const PEER_PREFIX = 'melymerules-hu-';
/* Elutasított tippek névtelen naplója (Google űrlap → táblázat); naponta Claude nézi át */
const LOG_FORM = {id: '__LOG_FORM_ID__', entry: '__LOG_FORM_ENTRY__'}; // a GitHub Actions telepítéskor tölti ki titkos beállításból
const CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const BANK = (window.QBANK || []);
const BY_ID = Object.fromEntries(BANK.map(q => [q.id, q]));

/* ====== Segédek ====== */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rid = n => Array.from({length:n}, () => CODE_ABC[Math.random() * CODE_ABC.length | 0]).join('');
let toastT;
function toast(msg, ms = 3200) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, ms); }
function show(v) { for (const s of document.querySelectorAll('.view')) s.hidden = s.id !== 'v-' + v; window.scrollTo(0, 0); }
// lapfülenként saját azonosító (frissítés után is megmarad, így vissza lehet csatlakozni)
const myPid = (() => { try { let p = sessionStorage.getItem('mm_pid'); if (!p) { p = rid(10); sessionStorage.setItem('mm_pid', p); } return p; } catch { return rid(10); } })();

/* ====== Válasz-felismerés ====== */
function norm(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/^(a|az|the)\s+/, '').replace(/[^a-z0-9]/g, '');
}
function lev(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({length: b.length + 1}, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]; let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < best) best = cur[j];
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}
const IDX = {};
function index(q) {
  if (IDX[q.id]) return IDX[q.id];
  const m = new Map();
  q.a.forEach(([names], i) => names.split('|').forEach(n => { const k = norm(n); if (k && !m.has(k)) m.set(k, i); }));
  return IDX[q.id] = m;
}
/** visszaad: {i, name, tier} vagy null */
function match(q, text) {
  const k = norm(text); if (!k) return null;
  const m = index(q);
  let i = m.get(k);
  // magyar többes szám / ragozás: almák → alma, tigrisek → tigris, kutyát → kutya
  if (i == null && k.length >= 4) {
    for (const suf of ['ok', 'ek', 'ak', 'k', 'ot', 'et', 'at', 't']) {
      if (k.endsWith(suf) && k.length - suf.length >= 3 && m.has(k.slice(0, -suf.length))) { i = m.get(k.slice(0, -suf.length)); break; }
    }
  }
  if (i == null && k.length >= 5) {
    const max = k.length >= 12 ? 2 : 1; let best = max + 1, hit = null, tie = false;
    for (const [key, idx] of m) {
      if (key.length < 4) continue;
      const d = lev(k, key, max);
      if (d < best) { best = d; hit = idx; tie = false; } else if (d === best && idx !== hit) tie = true;
    }
    if (hit != null && best <= max && !tie) i = hit;
  }
  if (i == null) return null;
  const nm = q.a[i][0].split('|')[0];
  return {i, name: nm.charAt(0).toUpperCase() + nm.slice(1), tier: q.a[i][1]};
}

/* ====== Kérdésbank – ismétlődés nélkül ====== */
function poolInfo() {
  const used = new Set(store.get('mm_used', []));
  const left = BANK.filter(q => !used.has(q.id)).length;
  $('poolinfo').textContent = BANK.length ? `${BANK.length} kérdés a bankban · ezen az eszközön még ${left} új kérdés vár rád` : 'A kérdésbank nem töltődött be.';
}
function markUsed(ids) {
  const used = new Set(store.get('mm_used', [])); ids.forEach(i => used.add(i));
  if (used.size >= BANK.length) used.clear(), ids.forEach(i => used.add(i));
  store.set('mm_used', [...used]);
}
function pickQuestions(exclude = []) {
  const used = new Set([...store.get('mm_used', []), ...exclude]);
  let fresh = shuffle(BANK.filter(q => !used.has(q.id)));
  if (fresh.length < Q_PER_ROUND) {
    toast('Minden kérdésen végigmentetek ezen az eszközön! A bank új sorrendben indul újra.', 5000);
    const extra = shuffle(BANK.filter(q => !fresh.includes(q) && !exclude.includes(q.id)));
    store.set('mm_used', []);
    fresh = fresh.concat(extra);
  }
  // témák keverése: lehetőleg ne legyen két azonos kategória egymás után / körön belül
  const out = [], cats = new Set();
  for (const q of fresh) { if (out.length >= Q_PER_ROUND) break; if (!cats.has(q.cat)) { out.push(q); cats.add(q.cat); } }
  for (const q of fresh) { if (out.length >= Q_PER_ROUND) break; if (!out.includes(q)) out.push(q); }
  return shuffle(out).map(q => q.id);
}

/* ====== Hálózat ====== */
let peer = null, conns = new Map(); // host: pid -> conn
let hostConn = null;                // vendég: kapcsolat a gazdához
let role = null;                    // 'solo' | 'host' | 'guest'
let S = null;                       // gazda (és egyjátékos) hiteles állapota
let V = null;                       // amit a kliens lát (pillanatkép)
let clockOff = 0;                   // hostNow - localNow
let myAns = {};                     // qi -> {text, ok, tier, name}
let tick = null, lastNudge = 0, wake = null;
let rejected = []; // {q: kérdés-id, t: tipp}

function newState(code) {
  return {code, phase: 'lobby', round: 0, qids: [], qi: 0, endsAt: 0,
    players: {}, answers: {}, results: [], rounds: [], usedInSession: []};
}
function addPlayer(pid, name) {
  const p = S.players[pid];
  if (p) { p.online = true; p.name = name || p.name; }
  else S.players[pid] = {name: name || 'Játékos', online: true, total: 0, rounds: 0, wins: 0, best: 0, joinedRound: S.round};
}

/* Pillanatkép: a kérdés közben nem árulja el mások válaszait */
function snapshot() {
  const s = {code: S.code, phase: S.phase, round: S.round, qids: S.qids, qi: S.qi, endsAt: S.endsAt, now: Date.now(),
    players: Object.entries(S.players).map(([pid, p]) => ({pid, name: p.name, online: p.online, total: p.total, rounds: p.rounds, wins: p.wins, best: p.best,
      done: !!(S.answers[S.qi] && S.answers[S.qi][pid])})),
    results: S.results, rounds: S.rounds.slice(-1), session: sessionTable()};
  if (S.phase === 'question' || S.phase === 'countdown') s.results = S.results.slice(0, S.qi);
  return s;
}
function broadcast() {
  const snap = snapshot();
  for (const c of conns.values()) if (c.open) try { c.send({t: 'snap', s: snap}); } catch {}
  onSnap(snap, true);
}

function hostMessage(conn, msg) {
  const pid = conn.metadata && conn.metadata.pid;
  if (!pid || !msg) return;
  if (msg.t === 'ans' && S.phase === 'question' && msg.qi === S.qi) submitAnswer(pid, String(msg.text || '').slice(0, 60));
  hostLoop(); // bármely üzenet felébreszti a gazdát (háttérbe tett lapon a időzítők lassulnak)
}

function startHosting(name) {
  role = 'host';
  const tryOpen = attempt => {
    const code = rid(5);
    setMsg('home-msg', 'Szoba létrehozása…');
    peer = new Peer(PEER_PREFIX + code, {debug: 0});
    peer.on('open', () => {
      S = newState(code); addPlayer(myPid, name);
      location.hash = code; show('lobby'); broadcast();
    });
    peer.on('error', e => {
      if (e.type === 'unavailable-id' && attempt < 4) { peer.destroy(); tryOpen(attempt + 1); return; }
      if (!S) setMsg('home-msg', 'Nem sikerült kapcsolódni a szobaszerverhez. Ellenőrizd az internetet, és próbáld újra.', true);
      else toast('Hálózati hiba: ' + e.type);
    });
    peer.on('disconnected', () => { try { peer.reconnect(); } catch {} });
    peer.on('connection', conn => {
      conn.on('open', () => {
        const {pid, name: nm} = conn.metadata || {};
        if (!pid) return conn.close();
        const old = conns.get(pid); if (old && old !== conn) try { old.close(); } catch {}
        conns.set(pid, conn); addPlayer(pid, String(nm || '').slice(0, 16));
        broadcast();
      });
      conn.on('data', m => hostMessage(conn, m));
      conn.on('close', () => {
        const pid = conn.metadata && conn.metadata.pid;
        if (conns.get(pid) === conn) { conns.delete(pid); if (S.players[pid]) S.players[pid].online = false; broadcast(); }
      });
    });
  };
  tryOpen(0);
}

function joinRoom(code, name) {
  role = 'guest';
  setMsg('home-msg', 'Csatlakozás a(z) ' + code + ' szobához…');
  peer = new Peer(undefined, {debug: 0});
  let opened = false, signal = false;
  const fail = txt => { setMsg('home-msg', txt, true); role = null; try { peer.destroy(); } catch {} show('home'); };
  const to = setTimeout(() => { if (!opened) fail(signal
    ? 'A szoba megvan, de a közvetlen kapcsolat nem jött létre. Próbáld újra, vagy válts hálózatot (pl. wifi helyett mobilnet).'
    : 'A szobaszerver nem érhető el ezen a hálózaton. Ellenőrizd az internetet, és próbáld újra.'); }, 15000);
  peer.on('open', () => {
    signal = true;
    hostConn = peer.connect(PEER_PREFIX + code, {reliable: true, metadata: {pid: myPid, name}});
    hostConn.on('open', () => { opened = true; clearTimeout(to); location.hash = code; });
    hostConn.on('data', m => { if (m && m.t === 'snap') onSnap(m.s, false); });
    hostConn.on('close', () => { if (role === 'guest') { toast('A kapcsolat a szobával megszakadt. A gazda kiléphetett.', 6000); leave(); } });
  });
  peer.on('error', e => {
    if (e.type === 'peer-unavailable') { clearTimeout(to); fail('Nem található ilyen szoba, vagy a gazda már bezárta. Ellenőrizd a kódot.'); }
    else if (!opened) { clearTimeout(to); fail('Nem sikerült kapcsolódni a szobaszerverhez. Próbáld újra.'); }
  });
}

function startSolo(name) {
  role = 'solo';
  S = newState(null); addPlayer(myPid, name);
  startRound();
}

function leave() {
  clearInterval(tick); clearTimeout(revealT); try { wake && wake.release(); } catch {} wake = null;
  try { hostConn && hostConn.close(); } catch {}
  try { peer && peer.destroy(); } catch {}
  peer = null; hostConn = null; conns.clear(); role = null; S = null; V = null; myAns = {};
  history.replaceState(null, '', location.pathname + location.search);
  show('home'); poolInfo();
}

/* ====== Játékmenet (gazda / egyjátékos) ====== */
let revealT = null;
function startRound() {
  S.round++; S.qids = pickQuestions(S.usedInSession); S.usedInSession.push(...S.qids);
  S.qi = 0; S.answers = {}; S.results = [];
  beginQuestion();
}
function beginQuestion() {
  S.phase = 'countdown'; S.endsAt = Date.now() + COUNTDOWN; S.answers[S.qi] = {};
  broadcast();
}
function hostLoop() {
  if (!S || (role !== 'host' && role !== 'solo')) return;
  const now = Date.now();
  if (S.phase === 'countdown' && now >= S.endsAt) { S.phase = 'question'; S.endsAt = now + Q_TIME; broadcast(); }
  else if (S.phase === 'question') {
    const online = Object.entries(S.players).filter(([, p]) => p.online).map(([pid]) => pid);
    const all = online.length && online.every(pid => S.answers[S.qi][pid]) && now - (S.lastAnsAt || 0) > 1500;
    if (now >= S.endsAt || all) endQuestion();
  }
  else if (S.phase === 'reveal' && role === 'host' && now >= S.endsAt) nextQuestion();
}
function submitAnswer(pid, text) {
  const q = BY_ID[S.qids[S.qi]]; if (!q || S.answers[S.qi][pid]) return;
  const m = match(q, text); if (!m) return;
  S.answers[S.qi][pid] = {text, i: m.i, name: m.name, tier: m.tier}; S.lastAnsAt = Date.now();
  broadcast();
}
function endQuestion() {
  const q = BY_ID[S.qids[S.qi]], ans = S.answers[S.qi];
  const count = {}; Object.values(ans).forEach(a => count[a.i] = (count[a.i] || 0) + 1);
  const multi = Object.keys(S.players).length > 1;
  const rows = Object.keys(S.players).map(pid => {
    const a = ans[pid];
    if (!a) return {pid, name: null, tier: 0, pts: 0, bonus: 0};
    const bonus = multi && count[a.i] === 1 ? BONUS : 0;
    return {pid, name: a.name, typed: a.text, tier: a.tier, pts: TIERS[a.tier].p + bonus, bonus};
  });
  const given = new Set(Object.values(ans).map(a => a.i));
  const names = arr => arr.map(x => { const n = x[0].split('|')[0]; return n.charAt(0).toUpperCase() + n.slice(1); });
  const rare = names(q.a.filter((x, i) => x[1] >= 5 && !given.has(i)).sort((a, b) => b[1] - a[1]).slice(0, 6));
  const common = names(q.a.filter(x => x[1] === 1).slice(0, 4));
  S.results[S.qi] = {qid: q.id, rows, rare, common};
  S.phase = 'reveal'; S.endsAt = Date.now() + REVEAL_TIME;
  broadcast();
}
function nextQuestion() {
  clearTimeout(revealT);
  if (!S || S.phase !== 'reveal') return;
  if (S.qi + 1 < S.qids.length) { S.qi++; beginQuestion(); }
  else endRound();
}
function endRound() {
  const per = {};
  Object.keys(S.players).forEach(pid => per[pid] = S.results.map(r => (r.rows.find(x => x.pid === pid) || {pts: 0}).pts));
  const totals = Object.entries(per).map(([pid, a]) => [pid, a.reduce((x, y) => x + y, 0)]);
  const top = Math.max(0, ...totals.map(t => t[1]));
  totals.forEach(([pid, t]) => {
    const p = S.players[pid]; p.total += t; p.rounds++; p.best = Math.max(p.best, t);
    if (t === top && top > 0 && totals.length > 1) p.wins++;
  });
  S.rounds.push({round: S.round, per, names: Object.fromEntries(Object.entries(S.players).map(([k, p]) => [k, p.name]))});
  S.phase = 'end';
  broadcast();
}
function sessionTable() {
  return Object.entries(S.players).map(([pid, p]) => ({pid, name: p.name, total: p.total, rounds: p.rounds, wins: p.wins, best: p.best, online: p.online}))
    .sort((a, b) => b.total - a.total);
}

/* ====== Kliens oldali megjelenítés (mindenki) ====== */
let lastKey = '';
function onSnap(s, local) {
  if (!local) clockOff = s.now - Date.now(); else clockOff = 0;
  const prev = V; V = s;
  if (s.qids && s.qids.length && (!prev || prev.round !== s.round)) { myAns = {}; markUsed(s.qids); }
  const key = s.phase + ':' + s.round + ':' + s.qi;
  const fresh = key !== lastKey; lastKey = key;
  if (s.phase === 'lobby') renderLobby(s);
  else if (s.phase === 'countdown' || s.phase === 'question') renderQuestion(s, fresh);
  else if (s.phase === 'reveal') renderReveal(s, fresh);
  else if (s.phase === 'end') renderEnd(s);
}
const hostNow = () => Date.now() + clockOff;
const isHostish = () => role === 'host' || role === 'solo';

function renderLobby(s) {
  show('lobby');
  $('l-code').textContent = s.code;
  const link = location.origin + location.pathname + '#' + s.code;
  $('l-link').value = link;
  $('l-players').innerHTML = s.players.map(p => `<li class="${p.online ? '' : 'off'}">${esc(p.name)}${p.pid === myPid ? '<span class="you">te</span>' : ''}</li>`).join('');
  $('b-start').hidden = role !== 'host';
  const n = s.players.filter(p => p.online).length;
  setMsg('l-msg', role === 'host' ? (n < 2 ? 'Várakozás a többi játékosra… (egyedül is indíthatsz)' : `${n} játékos a szobában. Indulhat a kör!`) + ' Te vagy a szoba gazdája: játék közben tartsd ezt az oldalt nyitva, előtérben.' : 'Várakozás, hogy a gazda elindítsa a kört…');
}

function depthOf(s, pid) {
  let pts = 0; (s.results || []).forEach((r, i) => { if (r && i < s.qi + (s.phase === 'reveal' ? 1 : 0)) pts += (r.rows.find(x => x.pid === pid) || {pts: 0}).pts; });
  return pts;
}
function renderQuestion(s, fresh) {
  show('game');
  const q = BY_ID[s.qids[s.qi]];
  if (!q) { $('g-q').textContent = 'Ez a kérdés hiányzik ezen az eszközön – frissítsd az oldalt.'; return; }
  $('g-prog').textContent = `${s.round}. kör · ${s.qi + 1}/${s.qids.length}`;
  $('g-cat').textContent = q.cat;
  $('g-q').textContent = q.q;
  $('g-hint').textContent = q.hint || '';
  const pts = depthOf(s, myPid);
  $('g-depth').textContent = `${pts * 10} m · ${pts} pont`;
  setSea(pts);
  const mine = myAns[s.qi];
  const me = s.players.find(p => p.pid === myPid);
  const done = (me && me.done) || (mine && mine.ok);
  if (fresh) { $('g-in').value = ''; $('g-fb').innerHTML = ''; }
  $('g-in').disabled = $('g-send').disabled = s.phase !== 'question' || !!done;
  if (s.phase === 'question' && !done && fresh) setTimeout(() => $('g-in').focus(), 50);
  const others = s.players.filter(p => p.pid !== myPid);
  $('g-who').innerHTML = others.map(p => `<li class="${p.online ? '' : 'off'} ${p.done ? 'done' : ''}">${esc(p.name)}</li>`).join('');
  $('g-wait').textContent = done && others.some(p => p.online && !p.done) ? 'Megvan a válaszod! Várjuk a többieket…' : '';
  $('b-skip').hidden = !(role === 'solo' && done);
  $('g-count').hidden = s.phase !== 'countdown';
  startTick();
}
function startTick() {
  clearInterval(tick);
  const draw = () => {
    if (!V) return;
    if (isHostish()) hostLoop();
    else if (role === 'guest' && V && ['countdown', 'question', 'reveal'].includes(V.phase) && hostNow() > V.endsAt + 300 && Date.now() - lastNudge > 1000) {
      lastNudge = Date.now(); try { hostConn.send({t: 'tick'}); } catch {}
    }
    if (!V) return;
    const left = Math.max(0, V.endsAt - hostNow());
    if (V.phase === 'countdown') { $('g-count').textContent = Math.ceil(left / 1000) || ''; $('g-bar').style.transform = 'scaleX(1)'; }
    else if (V.phase === 'question') { const f = left / Q_TIME; $('g-bar').style.transform = `scaleX(${f})`; $('g-bar').classList.toggle('low', f < .25); }
    else if (V.phase === 'reveal') { $('r-auto').textContent = role === 'solo' ? '' : `Következő kérdés ${Math.ceil(left / 1000)} mp múlva…`; }
  };
  draw(); tick = setInterval(draw, 100);
}

function tierBadge(t, extra = '') { return t ? `<span class="badge t${t}">${TIERS[t].n} · ${TIERS[t].p} p${extra}</span>` : ''; }
function sendAnswer(text) {
  if (!V || V.phase !== 'question') return;
  const q = BY_ID[V.qids[V.qi]], m = match(q, text);
  if (!m) {
    if (rejected.length < 40 && !rejected.some(r => r.q === q.id && norm(r.t) === norm(text))) rejected.push({q: q.id, t: text.slice(0, 60)});
    $('g-fb').innerHTML = `<span class="badge no">„${esc(text)}” nem fogadható el – próbálj mást!</span>`;
    $('g-in').select(); return;
  }
  myAns[V.qi] = {text, ok: true, tier: m.tier, name: m.name};
  $('g-fb').innerHTML = `<div>${esc(m.name)}</div>${tierBadge(m.tier)}`;
  $('g-in').disabled = $('g-send').disabled = true;
  if (role === 'guest') { try { hostConn.send({t: 'ans', qi: V.qi, text}); } catch {} }
  else submitAnswer(myPid, text);
}

function renderReveal(s, fresh) {
  show('reveal');
  const r = s.results[s.qi], q = BY_ID[r.qid];
  $('r-prog').textContent = `${s.round}. kör · ${s.qi + 1}/${s.qids.length} · ${q.cat}`;
  $('r-q').textContent = q.q;
  const names = Object.fromEntries(s.players.map(p => [p.pid, p.name]));
  const rows = [...r.rows].sort((a, b) => b.pts - a.pts);
  $('r-list').innerHTML = rows.map(x => `<li><span class="nm">${esc(names[x.pid] || '?')}${x.pid === myPid ? ' (te)' : ''}</span>
    <span class="an">${x.name ? esc(x.name) : '<i>nincs válasz</i>'}</span>
    ${x.tier ? tierBadge(x.tier) : ''}${x.bonus ? `<span class="bonus">+${x.bonus} egyedi!</span>` : ''}
    <span class="pts">${x.pts} p</span></li>`).join('');
  $('r-rare').textContent = r.rare.length ? r.rare.join(', ') : 'A legritkábbakat ti is megtaláltátok!';
  $('r-common').textContent = r.common.join(', ');
  $('b-next').hidden = !isHostish();
  $('b-next').textContent = s.qi + 1 < s.qids.length ? 'Következő kérdés' : 'Kör eredménye';
  setSea(depthOf(s, myPid));
  startTick();
}

function renderEnd(s) {
  clearInterval(tick);
  sendRejected();
  show('end');
  const last = s.rounds[s.rounds.length - 1];
  const solo = role === 'solo';
  $('e-title').textContent = `A(z) ${last.round}. kör eredménye`;
  const rows = Object.entries(last.per).map(([pid, a]) => ({pid, a, t: a.reduce((x, y) => x + y, 0)})).sort((x, y) => y.t - x.t);
  const qh = s.qids.map((_, i) => `<th>${i + 1}.</th>`).join('');
  $('e-round').innerHTML = `<thead><tr><th>#</th><th>Játékos</th>${qh}<th>Pont</th><th>Mélység</th></tr></thead><tbody>` +
    rows.map((r, i) => `<tr class="${r.pid === myPid ? 'me' : ''} ${i === 0 && rows.length > 1 && r.t > 0 ? 'first' : ''}"><td>${i + 1}.</td><td>${esc(last.names[r.pid] || '?')}</td>${r.a.map(x => `<td>${x}</td>`).join('')}<td class="b">${r.t}</td><td>${r.t * 10} m</td></tr>`).join('') + '</tbody>';
  $('e-sess').innerHTML = `<thead><tr><th>#</th><th>Játékos</th><th>Körök</th>${solo ? '' : '<th>Győzelem</th>'}<th>Legjobb kör</th><th>Összesen</th></tr></thead><tbody>` +
    s.session.map((p, i) => `<tr class="${p.pid === myPid ? 'me' : ''}"><td>${i + 1}.</td><td>${esc(p.name)}${p.online ? '' : ' (kilépett)'}</td><td>${p.rounds}</td>${solo ? '' : `<td>${p.wins}</td>`}<td>${p.best * 10} m</td><td class="b">${p.total} p</td></tr>`).join('') + '</tbody>';
  $('e-sess-h').textContent = solo ? 'A mostani játékod összesítője' : 'A session összesítője';
  $('b-again').hidden = !isHostish();
  $('b-home').textContent = solo ? 'Főmenü' : 'Kilépés a szobából';
  setMsg('e-msg', role === 'guest' ? 'A gazda indíthatja a következő kört.' : '');
  const me = rows.find(r => r.pid === myPid);
  if (me) setSea(me.t);
  if (solo) { const best = store.get('mm_best', 0); if (me && me.t > best) { store.set('mm_best', me.t); toast(`Új egyéni rekord: ${me.t * 10} m!`); } }
}

function sendRejected() {
  if (!rejected.length || !LOG_FORM.id || LOG_FORM.id.startsWith('__')) { rejected = []; return; }
  const body = new URLSearchParams();
  body.append(LOG_FORM.entry, rejected.map(r => r.q + '\t' + r.t.replace(/[\t\n]/g, ' ')).join('\n'));
  rejected = [];
  try { fetch(`https://docs.google.com/forms/d/e/${LOG_FORM.id}/formResponse`, {method: 'POST', mode: 'no-cors', body}).catch(() => {}); } catch {}
}

/* ====== Hangulat: minél mélyebb, annál sötétebb ====== */
function setSea(pts) { document.querySelector('.sea').style.filter = `brightness(${Math.max(.45, 1 - pts / 900)}) saturate(${1 + pts / 1400})`; }
function bubbles() {
  const b = document.querySelector('.bubbles'); let h = '';
  for (let i = 0; i < 18; i++) { const s = 6 + Math.random() * 18; h += `<i style="left:${Math.random() * 100}%;width:${s}px;height:${s}px;animation-duration:${8 + Math.random() * 14}s;animation-delay:-${Math.random() * 20}s"></i>`; }
  b.innerHTML = h;
}
function setMsg(id, t, err) { const e = $(id); e.textContent = t; e.classList.toggle('err', !!err); }

/* ====== Események ====== */
function getName() {
  const n = $('name').value.trim().slice(0, 16);
  if (!n) { setMsg('home-msg', 'Add meg a neved!', true); $('name').focus(); return null; }
  store.set('mm_name', n); return n;
}
function needPeer() { if (!window.Peer) { setMsg('home-msg', 'A többjátékos modul nem töltődött be. Ellenőrizd az internetkapcsolatot és frissítsd az oldalt.', true); return false; } return true; }
$('b-solo').onclick = () => { const n = getName(); if (n) { setMsg('home-msg', ''); startSolo(n); } };
$('b-host').onclick = () => { const n = getName(); if (n && needPeer()) startHosting(n); };
$('b-join').onclick = () => {
  const n = getName(); if (!n || !needPeer()) return;
  const c = $('joincode').value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (c.length !== 5) return setMsg('home-msg', 'A szobakód 5 karakter.', true);
  joinRoom(c, n);
};
$('joincode').addEventListener('keydown', e => { if (e.key === 'Enter') $('b-join').click(); });
$('b-start').onclick = () => { if (role === 'host' && S && S.phase === 'lobby') startRound(); };
$('b-leave').onclick = leave;
$('b-home').onclick = leave;
$('b-again').onclick = () => { if (isHostish() && S && S.phase === 'end') startRound(); };
$('b-next').onclick = () => nextQuestion();
$('b-skip').onclick = () => { if (role === 'solo' && S && S.phase === 'question') endQuestion(); };
$('b-copy').onclick = async () => {
  const l = $('l-link');
  try { await navigator.clipboard.writeText(l.value); toast('Link vágólapra másolva!'); }
  catch { l.select(); toast('Jelöld ki és másold ki a linket.'); }
};
$('g-form').addEventListener('submit', e => { e.preventDefault(); const t = $('g-in').value.trim(); if (t) sendAnswer(t); });

/* ====== Képernyő ébren tartása játék közben ====== */
async function keepAwake() {
  try { if (!wake && navigator.wakeLock && role) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => wake = null); } } catch {}
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { keepAwake(); if (S && isHostish()) hostLoop(); } });
document.addEventListener('click', keepAwake);

/* ====== Indulás ====== */
$('name').value = store.get('mm_name', '');
$('tierlist').innerHTML = TIERS.slice(1).map((t, i) => `<li class="t${i + 1}"><b>${t.n}</b><br>${t.p} pont · ${t.p * 10} m</li>`).join('');
const hash = location.hash.replace('#', '').toUpperCase();
if (/^[A-Z0-9]{5}$/.test(hash)) { $('joincode').value = hash; setMsg('home-msg', 'Meghívtak egy szobába! Add meg a neved, és nyomd meg a Csatlakozás gombot.'); }
bubbles(); poolInfo(); show('home');
window.__mm = {match, norm, BANK};
})();
