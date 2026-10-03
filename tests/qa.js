// Suite de QA automática do jogo. Abre o jogo com ?qa no endereço (por exemplo
// http://localhost:8080/?qa) e os testes correm sozinhos, com o resultado num painel.
//
// O que se testa:
//   1. Dados: níveis, etiquetas, textos (marcadores por substituir, temas proibidos),
//      cruzamentos entre níveis (recordações do pedido, aves, rondas da maternidade).
//   2. O jogo completo, do primeiro nível ao bónus, com "robôs" que jogam cada cena:
//      ecrã de introdução, pausa, retomar, jogar até ao fim, ecrã de nível concluído,
//      gravação, desbloqueio do nível seguinte, casamento, bónus e final da família.
//   3. Recomeçar e repetir níveis, opções (personagem, música, sons), gravações antigas,
//      navegação por teclado nos menus, vários tamanhos de ecrã e a API de som.
// Atenção: os testes apagam o progresso guardado neste browser.
import { LEVELS, levelLabel } from '../js/levels/index.js';
import { SAVE_KEY } from '../js/config.js';
import { computeLayout, SIDE_MIN_ASPECT } from '../js/layout.js';

const STEP = 1 / 60;
const results = [];
let errors = [];
let game, I;

function check(name, ok, info = '') {
  results.push({ name, ok: !!ok, info: ok ? '' : String(info) });
  log((ok ? '✔ ' : '✘ ') + name + (ok || !info ? '' : ' — ' + info));
}

let panel;
function log(line) {
  if (!panel) {
    panel = document.createElement('pre');
    panel.style.cssText = 'position:fixed;left:0;top:0;right:0;max-height:45vh;overflow:auto;margin:0;padding:6px 8px;font:11px/1.35 monospace;background:rgba(0,0,0,.85);color:#cfc;z-index:99;white-space:pre-wrap;pointer-events:auto';
    document.body.append(panel);
  }
  panel.textContent += line + '\n';
  panel.scrollTop = panel.scrollHeight;
  console.log('[QA] ' + line);
}

const tick = () => new Promise((r) => setTimeout(r, 0));
const $ = (s) => document.querySelector(s);
const hud = () => $('#hud-hearts').textContent;

// ---------- Simulação ----------
// Avança n passos de jogo; antes de cada passo, o robô da cena decide o que "carregar".
function frames(n, bot = autoBot) {
  for (let k = 0; k < n; k++) {
    const s = game.scene;
    clearInput();
    try {
      if (bot) bot(s);
      s.update(STEP);
      I.endFrame();
      if (k % 20 === 0) s.draw(game.ctx2d, game.view);
    } catch (err) {
      errors.push(`${s.constructor.name}: ${err.message}`);
      throw err;
    }
  }
}

function clearInput() {
  I.left = I.right = I.up = I.down = I.jump = I.action = false;
  I.jumpPressed = I.actionPressed = false;
  I.pointerX = I.pointerY = -1;
}

// Corre até `until()` ser verdadeiro (ou acabar o tempo, em segundos de jogo).
async function runUntil(until, maxSecs, bot = autoBot) {
  const max = Math.round(maxSecs / STEP);
  let n = 0;
  while (!until() && n < max) {
    frames(60, bot);
    n += 60;
    if (n % 1800 === 0) await tick();
  }
  return until();
}

// Toca num ponto do ecrã (coordenadas de jogo).
function tap(x, y) {
  I.pointerX = x / game.view.w;
  I.pointerY = y / game.view.h;
  I.action = true;
  I.actionPressed = true;
}

// ---------- Robôs ----------
const BOTS = {
  PlayScene: platformBot,
  OperationScene(s) {
    if (s.state === 'cut' && s.lock <= 0 && s.anim <= 0) {
      const x = 30 + s.m * 180, [b0, bw] = s.band;
      if (x > b0 + 3 && x < b0 + bw - 3) { I.action = true; I.actionPressed = true; }
    } else if (s.state === 'anes') {
      const mid = (s.zone[0] + s.zone[1]) / 2;
      if (s.fill < mid) { I.action = true; I.actionPressed = !s.holding; }
    }
  },
  DateScene(s) {
    if (s.state !== 'play') return;
    const g = s.g, id = s.courses[s.ci], press = () => { I.action = true; I.actionPressed = true; };
    if (id === 'olhares') { if (g.phase === 'glance' && !g.scored) I.action = true; }
    else if (id === 'vinho') { if (g.wait <= 0 && g.fills[g.i] < (g.zone[0] + g.zone[1]) / 2) { I.action = true; I.actionPressed = !g.pouring; } }
    else if (id === 'conversa') { if (g.st === 'show' && g.seq[g.k].good && g.t > 0.1) press(); }
    else if (id === 'batatas') { if (g.look === 'away' && g.t > 0.55 && g.reach <= 0 && g.stun <= 0) press(); }
    else if (id === 'esparguete') { if (g.v < 0.5 && s.t % 0.2 < STEP) press(); }
    else if (id === 'pezinho') {
      const toward = s.meL ? 'right' : 'left', back = s.meL ? 'left' : 'right';
      if (g.ws !== 'idle') { if (g.u > 0.3) I[back] = true; }
      else if (g.u < g.d - 0.04) I[toward] = true;
    } else if (id === 'conta') { if (g.p < -0.05 && s.t % 0.12 < STEP) press(); }
    else if (id === 'beijo') { if (g.fail <= 0 && g.a >= 0.96 && g.a <= 1.04) press(); }
    else if (id === 'phone') { if (g.st === 'ring') press(); }
  },
  BikeScene(s) {
    if (s.state === 'ride') {
      I.right = true;
      const ahead = s.obstacles.find((o) => !o.hit && o.x - (s.bx + 16) > 0 && o.x - (s.bx + 16) < 10 + s.v * 0.12);
      if (ahead && s.hop <= 0) I.jumpPressed = true;
      const lead = s.riders[s.front];
      if (lead.e < 0.15 && s.swapT <= 0 && !s.botSwap) { I.left = true; s.botSwap = true; } else s.botSwap = false;
    } else if (s.state === 'furo' && Math.round(s.timer / STEP) % 6 === 0) { I.actionPressed = true; I.action = true; }
  },
  TourScene: tourBot,
  PrepScene: tourBot,
  OvenScene(s) {
    if (s.state === 'lenha') { if (s.m >= 0.86 && s.lock <= 0 && s.swing <= 0) { I.action = true; I.actionPressed = true; } }
    else if (s.state === 'amassar') {
      s.botK = (s.botK || 0) + 1;
      if (s.botK % 4 === 0) I[(s.next || 'L') === 'L' ? 'left' : 'right'] = true;
    } else if (s.state === 'cozer' && s.wait <= 0 && s.lock <= 0) {
      const i = s.bolas.findIndex((b) => !b.out && b.d > 0.66 && b.d < 0.78);
      if (i >= 0) tap(s.offsets(game.view).ox + 60 + i * 60, game.view.h / 2);
    }
  },
  CovidScene(s) {
    if (s.state === 'inter') { I.actionPressed = true; return; }
    if (s.state !== 'wave') return;
    const L = s.layout(game.view);
    const heart = s.drops.find((d) => d.kind === 'heart' && d.f > 0.55);
    const vi = [...s.viruses].sort((a, b) => b.f - a.f)[0];
    const u = heart ? heart.u : vi ? vi.u : 0.5;
    I.pointerX = (L.fx0 + u * L.FW) / game.view.w;
    I.pointerY = 0.9;
  },
  BirdsScene(s) {
    const b = s.birds.find((x) => !x.found && !x.hidden && x.state === 'here' && !x.way.joke);
    if (!b) return;
    const img = s.art[b.id][0].r;
    I.pointerX = b.x / game.view.w;
    I.pointerY = (b.y - img.height / 2 + (I.touch ? 26 : 0)) / game.view.h;
  },
  AuroraScene(s) {
    const v = game.view;
    if (s.state === 'trace') {
      const p = s.path(s.k, Math.min(1, s.tau + STEP / 11), v);
      I.pointerX = p.x / v.w;
      I.pointerY = (p.y + (I.touch ? 22 : 0)) / v.h;
    } else if (s.state === 'photo' && s.timer > 0.7 && s.brightness() > 0.86) { I.action = true; I.actionPressed = true; }
  },
  ProposalScene(s) {
    const v = game.view, L = s.layout(v);
    const center = (i) => [L.gx + (i % L.cols) * (L.cs + 4) + L.cs / 2, L.gy + Math.floor(i / L.cols) * (L.cs + 4) + L.cs / 2];
    if (s.state === 'memory' && s.wait <= 0 && s.picked.length < 2) {
      s.botK = (s.botK || 0) + 1;
      if (s.botK % 10) return;
      let i;
      if (s.picked.length === 1) { const k = s.cards[s.picked[0]].kind; i = s.cards.findIndex((c, j) => j !== s.picked[0] && c.kind === k && !c.gone); }
      else i = s.cards.findIndex((c) => !c.gone && !c.up);
      if (i >= 0) tap(...center(i));
    } else if (s.state === 'tree' && s.timer > 0.9) tap(L.boxX, L.boxY);
    else if (s.state === 'ask' && s.timer > 1.3) tap(v.w / 2, v.h / 2);
  },
  BirthScene(s) {
    if (s.state === 'fly' && s.baby) I.pointerX = s.baby.tx / game.view.w;
  },
  VictoryScene() { I.action = true; I.actionPressed = true; },
};

function autoBot(s) {
  const b = BOTS[s.constructor.name];
  if (b) b(s);
}

// Plataformas: anda sempre para a direita e salta antes de espinhos, buracos, paredes e nuvens.
function platformBot(s) {
  const p = s.player;
  I.right = true;
  if (!p || s.state !== 'play') return;
  let want = false;
  if (p.onGround) {
    const fr = Math.floor((p.y + 21) / 16), front = p.x + 10;
    for (let c = Math.floor(front / 16); c <= Math.floor((front + 48) / 16); c++) {
      const haz = s.tile(c, fr - 1) === '^' || (s.tile(c, fr) !== '#' && s.tile(c, fr) !== '-' && s.tile(c, fr + 1) !== '#');
      const wall = s.tile(c, fr - 1) === '#';
      if (haz || wall) { const d = c * 16 - front; if (d < (wall ? 12 : p.sled ? 24 : 16) && d > -8) want = true; break; }
    }
    for (const w of s.walkers) if (!w.dead && w.x - front < 26 && w.x - front > 0 && Math.abs(w.y - p.y) < 30) want = true;
    s.botStuck = Math.abs(p.x - (s.botX || 0)) < 0.01 ? (s.botStuck || 0) + 1 : 0;
    if (s.botStuck > 20) want = true;
    s.botX = p.x;
  }
  if (want) { I.jumpPressed = true; I.jump = true; s.botJump = true; }
  if (!p.onGround && s.botJump && p.vy < 0) I.jump = true;
  if (p.onGround && !want) s.botJump = false;
}

// Visitas vistas de cima (e preparativos): caminho mais curto (BFS) até ao próximo objetivo.
function tourBot(s) {
  if (s.state !== 'walk') return;
  const goals = s.poles ? prepGoals(s) : tourGoals(s);
  if (!goals.length) return;
  const T = 16, m = s.map, p = s.p;
  const saveCows = m.cows, saveSpr = s.sprinklerOn;
  m.cows = [];
  s.sprinklerOn = () => false;
  const free = (tx, ty) => !s.blocked(tx * T + 8, ty * T + 12);
  const sx = Math.floor(p.x / T), sy = Math.floor((p.y - 3) / T);
  const key = (x, y) => y * m.cols + x, prev = new Map([[key(sx, sy), null]]);
  const q = [[sx, sy]];
  let hit = null;
  while (q.length && !hit) {
    const [x, y] = q.shift();
    for (const gl of goals) if (Math.hypot(x * T + 8 - gl.x, y * T + 12 - gl.y) <= gl.r) { hit = [x, y]; break; }
    if (hit) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (nx < 0 || ny < 0 || nx >= m.cols || ny >= m.rows || prev.has(k) || !free(nx, ny)) continue;
      prev.set(k, [x, y]);
      q.push([nx, ny]);
    }
  }
  m.cows = saveCows;
  s.sprinklerOn = saveSpr;
  if (!hit) { const gl = goals[0]; steer(gl.x - p.x, gl.y - p.y); return; }
  // primeiro passo do caminho
  let cur = hit, path = [cur];
  while (prev.get(key(cur[0], cur[1]))) { cur = prev.get(key(cur[0], cur[1])); path.unshift(cur); }
  const next = path[Math.min(1, path.length - 1)];
  const tx = path.length === 1 ? goals.find((gl) => Math.hypot(p.x - gl.x, p.y - gl.y) <= gl.r + 16) : null;
  if (path.length === 1) {
    if (tx && tx.stay) return;                            // chegou: fica (postes, carrinha...)
    const gl = goals[0];
    steer(gl.x - p.x, gl.y - p.y);
  } else steer(next[0] * T + 8 - p.x, next[1] * T + 12 - p.y);
}

function steer(dx, dy) {
  if (dx > 1.5) I.right = true; else if (dx < -1.5) I.left = true;
  if (dy > 1.5) I.down = true; else if (dy < -1.5) I.up = true;
}

function tourGoals(s) {
  const m = s.map, out = [];
  if (s.sergioLost) out.push({ x: s.c.x, y: s.c.y, r: 14 });
  for (const h of m.hearts) if (!h.got) out.push({ x: h.x, y: h.y + 6, r: 9 });
  for (const poi of m.pois) if (!poi.done && !poi.def.final) out.push({ x: poi.x, y: poi.y, r: 10 });
  if (out.length) return out;
  const pending = s.pois.some((q) => !q.done && !q.def.final && q.map !== m.id) || Object.values(s.maps).some((mm) => mm !== m && mm.hearts.some((h) => !h.got));
  if (pending && m.def.door) return m.doors.map((d) => ({ x: d.x * 16 + 8, y: d.y * 16 + 12, r: 4 }));
  const fin = m.pois.find((q) => q.def.final && !q.done);
  if (fin) return [{ x: fin.x, y: fin.y, r: 10 }];
  if (m.def.door) return m.doors.map((d) => ({ x: d.x * 16 + 8, y: d.y * 16 + 12, r: 4 }));
  return [];
}

function prepGoals(s) {
  const reach = (o) => (o === s.van ? 30 : o === s.stall ? 20 : s.poles.includes(o) ? 14 : s.hooks.includes(o) ? 16 : 22);
  return s.targets().filter(Boolean).map((o) => ({ x: o.x, y: o.y, r: reach(o), stay: true }));
}

// ---------- Testes ----------
function collectStrings(obj, path, out) {
  if (typeof obj === 'string') out.push([path, obj]);
  else if (Array.isArray(obj)) obj.forEach((x, i) => collectStrings(x, `${path}[${i}]`, out));
  else if (obj && typeof obj === 'object') for (const [k, x] of Object.entries(obj)) if (k !== 'rows' && k !== 'chunks') collectStrings(x, `${path}.${k}`, out);
  return out;
}

function testData() {
  log('— Dados dos níveis —');
  const ids = LEVELS.map((L) => L.id);
  check('ids dos níveis únicos', new Set(ids).size === ids.length, ids.join(','));
  const finals = LEVELS.filter((L) => L.final);
  check('exatamente um nível final', finals.length === 1);
  const fi = LEVELS.indexOf(finals[0]);
  check('níveis bónus todos depois do final', LEVELS.every((L, i) => !!L.bonus === i > fi), LEVELS.map((L) => L.id + (L.bonus ? '*' : '')).join(','));
  check('cada tipo de nível tem cena', LEVELS.every((L) => !L.type || game.scenes[L.type]), LEVELS.filter((L) => L.type && !game.scenes[L.type]).map((L) => L.type).join(','));
  check('etiquetas Nível 1…N e Bónus', LEVELS.map((L, i) => levelLabel(i)).join('|') === [...LEVELS.slice(0, fi + 1).map((L, i) => 'Nível ' + (i + 1)), 'Bónus'].join('|'), LEVELS.map((L, i) => levelLabel(i)).join('|'));
  for (const L of LEVELS) check(`${L.id}: título, história e texto final`, L.title && L.story && (L.outro || L.outroHot));

  // textos: marcadores por substituir (com as duas personagens) e temas proibidos
  const all = LEVELS.flatMap((L) => collectStrings(L, L.id, []));
  const ui = game.ui, keep = game.save.data.character;
  for (const who of ['luisa', 'sergio']) {
    game.save.data.character = who;
    const bad = all.filter(([, t]) => /\{(?!par_\})[^}]*\}/.test(ui.fmt(t)));
    check(`sem marcadores por substituir (a jogar com ${who})`, !bad.length, bad.map(([p]) => p).join(', '));
  }
  game.save.data.character = keep;
  const html = document.body.innerText + ' ' + all.map(([, t]) => t).join(' ');
  check('nenhuma menção à mãe do Sérgio', !/\bm[ãa]e\b|\bmam[ãa]\b/i.test(html));
  // (o \b do JavaScript não conhece letras acentuadas: "Vocês" é PT-PT correto)
  const BR = /(^|[^\wÀ-ú])(tela|celular|você|ônibus|registrar|contato|bônus|aterrissa\w*|time de|banheiro|geladeira)(?![\wÀ-ú])/gi;
  check('sem formas do português do Brasil comuns', !BR.test(html), (html.match(BR) || []).join(', '));

  // cruzamentos entre níveis
  const ped = LEVELS.find((L) => L.type === 'proposal'), pi = LEVELS.indexOf(ped);
  check('pedido: uma recordação por cada nível anterior', ped.memories.length === pi, `${ped.memories.length} recordações para ${pi} níveis`);
  check('pedido: ícones das recordações todos diferentes', new Set(ped.memories.map((m) => m.icon)).size === ped.memories.length);
  const aves = LEVELS.find((L) => L.type === 'birds');
  const sp = new Set(aves.species.map((s) => s.id));
  check('aves: a ordem só usa espécies do caderno (ou o pardal)', aves.order.every((id) => sp.has(id) || id === 'pardal'), aves.order.join(','));
  check('aves: todas as espécies visitantes aparecem', aves.species.slice(1).every((s) => aves.order.includes(s.id)));
  const mat = LEVELS.find((L) => L.type === 'birth');
  check('maternidade: duas rondas, Xavier e depois a Luisinha', mat.rounds.length === 2 && mat.rounds[0].name === 'Xavier' && mat.rounds[1].toddler);
  const date = LEVELS.find((L) => L.type === 'date');
  check('date: limiar do final alternativo entre 0 e 100', date.hot > 0 && date.hot < 100);
}

// Visitas vistas de cima: todos os corações e pontos de interesse têm de ser alcançáveis a pé
// (a partir do início do mapa ou da porta), sem contar com vacas nem regadores.
function testReachable() {
  log('— Corações e pontos alcançáveis (visitas) —');
  LEVELS.forEach((L, i) => {
    if (L.type !== 'tour') return;
    game.startLevel(i);
    const s = game.scene, T = 16, lost = [];
    for (const id of Object.keys(s.maps)) {
      s.enterMap(id, s.maps[id].start ? null : {});   // mapas sem início entram pela porta
      const m = s.map, cows = m.cows, spr = s.sprinklerOn;
      m.cows = [];
      s.sprinklerOn = () => false;
      const free = (x, y) => x >= 0 && y >= 0 && x < m.cols && y < m.rows && !s.blocked(x * T + 8, y * T + 12);
      const seen = new Set(), q = [];
      const add = (x, y) => { const k = y * m.cols + x; if (!seen.has(k) && free(x, y)) { seen.add(k); q.push([x, y]); } };
      add(Math.floor(s.p.x / T), Math.floor((s.p.y - 3) / T));
      for (const d of m.doors) for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) add(d.x + dx, d.y + dy);
      while (q.length) { const [x, y] = q.shift(); add(x + 1, y); add(x - 1, y); add(x, y + 1); add(x, y - 1); }
      const ok = (px, py, r) => [...seen].some((k) => Math.hypot((k % m.cols) * T + 8 - px, Math.floor(k / m.cols) * T + 12 - py) <= r);
      m.hearts.forEach((h, n) => { if (!ok(h.x, h.y + 6, 10)) lost.push(`${id} coração ${n}`); });
      m.pois.forEach((p) => { if (!ok(p.x, p.y, 12)) lost.push(`${id} ponto ${p.n}`); });
      if (m.lost && !ok(m.lost.x, m.lost.y, 17)) lost.push(`${id} par perdido`);
      m.cows = cows;
      s.sprinklerOn = spr;
    }
    check(`${L.id}: todos os corações e pontos alcançáveis`, !lost.length, lost.join(', '));
  });
  game.goMenu();
}

// Disposição do ecrã: área de jogo e botões táteis, em telemóvel, tablet e computador.
function testLayout() {
  log('— Disposição do ecrã (js/layout.js) —');
  const none = { t: 0, r: 0, b: 0, l: 0 };
  const L = (W, H, mobile, controls, safe = none) => computeLayout({ W, H, mobile, controls, safe });
  let a = L(390, 844, true, true, { t: 47, r: 0, b: 34, l: 0 });
  check('telemóvel ao alto: botões numa barra por baixo do jogo', a.mode === 'bar' && a.y === 0 && a.h + a.bar === 844 && a.bar >= a.tb + 34 && a.h > a.w, JSON.stringify(a));
  a = L(844, 390, true, true, { t: 0, r: 47, b: 21, l: 47 });
  check('telemóvel deitado: botões em faixas laterais, fora do jogo', a.mode === 'side' && a.h === 390 && a.x >= 47 + 2 * a.tb && 844 - a.x - a.w >= 47 + a.tb && a.w / a.h >= SIDE_MIN_ASPECT, JSON.stringify(a));
  a = L(1024, 768, true, true);
  check('tablet deitado: botões numa barra por baixo (jogo largo)', a.mode === 'bar' && a.w === 1024 && a.w / a.h > 1.4, JSON.stringify(a));
  a = L(768, 1024, true, true);
  check('tablet ao alto: barra por baixo', a.mode === 'bar' && a.h > a.w && a.bar < 1024 * 0.3, JSON.stringify(a));
  a = L(844, 390, true, false);
  check('minijogos em telemóvel/tablet: ecrã todo', a.mode === 'none' && a.w === 844 && a.h === 390);
  a = L(1920, 1080, false, false);
  check('computador 16:9: ecrã todo, versão horizontal', a.x === 0 && a.y === 0 && a.w === 1920 && a.h === 1080);
  a = L(600, 900, false, false);
  check('computador com janela alta: moldura 16:9 horizontal, centrada', a.w === 600 && Math.abs(a.w / a.h - 16 / 9) < 0.01 && Math.abs(a.y - (900 - a.h) / 2) <= 1, JSON.stringify(a));
  a = L(3440, 1000, false, false);
  check('computador ultralargo: limitado a 2,4:1 e centrado', Math.abs(a.w / a.h - 2.4) < 0.01 && Math.abs(a.x - (3440 - a.w) / 2) <= 1, JSON.stringify(a));
  // varrimento de tamanhos: tudo dentro do ecrã, botões nunca por cima do jogo, PC sempre horizontal
  const bad = [];
  let n = 0;
  for (let W = 320; W <= 1400; W += 54) for (let H = 320; H <= 1400; H += 54) {
    n++;
    const c = L(W, H, true, true, { t: 0, r: 20, b: 20, l: 20 });
    const inside = c.x >= 0 && c.y >= 0 && c.x + c.w <= W && c.y + c.h <= H && c.w >= 200 && c.h >= 150;
    const room = c.mode === 'bar' ? c.bar >= c.tb + 20 && c.y + c.h + c.bar === H : c.mode === 'side' && c.x >= 20 + 2 * c.tb && W - c.x - c.w >= 20 + c.tb;
    if (!inside || !room) bad.push(`tátil ${W}x${H}`);
    const p = L(W, H, false, false);
    if (p.w < p.h || p.x < 0 || p.y < 0 || p.x + p.w > W || p.y + p.h > H) bad.push(`pc ${W}x${H}`);
  }
  check(`varrimento de ${n} tamanhos de ecrã: disposições válidas`, !bad.length, bad.slice(0, 8).join(', '));

  // neste ecrã, a sério: num nível com botões, em modo tátil, os botões não tapam o jogo
  const wasTouch = I.touch;
  window.dispatchEvent(new Event('touchstart'));
  const rect = (el) => el.getBoundingClientRect();
  const hit = (p, q) => p.left < q.right - 1 && q.left < p.right - 1 && p.top < q.bottom - 1 && q.top < p.bottom - 1;
  const inView = (el) => { const b = rect(el); return b.width > 0 && b.top >= -1 && b.left >= -1 && b.bottom <= innerHeight + 1 && b.right <= innerWidth + 1; };
  LEVELS.forEach((lv, i) => {
    game.startLevel(i);
    if (!game.scene.usesPad) return;
    game.ui.act('start');
    const cv = rect(document.getElementById('game'));
    const btns = [...document.querySelectorAll('#touch .tbtn')];
    check(`${lv.id}: botões táteis visíveis e fora da área de jogo (${game.layout.mode})`, btns.length === 3 && btns.every((b) => inView(b) && !hit(rect(b), cv)) && game.layout.mode !== 'none', JSON.stringify(game.layout));
  });
  // um minijogo ocupa o ecrã todo (sem botões)
  game.startLevel(0);
  game.ui.act('start');
  check('minijogo: sem botões táteis', game.layout.mode === 'none' && getComputedStyle(document.getElementById('touch')).display === 'none');
  // o toque é medido em relação à área de jogo (e não ao ecrã inteiro)
  const canvas = document.getElementById('game'), cv = rect(canvas);
  canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: cv.left + cv.width * 0.25, clientY: cv.top + cv.height * 0.75, pointerId: 91, pointerType: 'touch', bubbles: true }));
  check('toque: posição relativa à área de jogo', Math.abs(I.pointerX - 0.25) < 0.01 && Math.abs(I.pointerY - 0.75) < 0.01, I.pointerX + ', ' + I.pointerY);
  canvas.dispatchEvent(new PointerEvent('pointerup', { pointerId: 91, pointerType: 'touch', bubbles: true }));
  check('toque: larga ao levantar o dedo', I.pointerX === -1);
  // todos os ecrãs cabem neste tamanho (botões sempre à vista)
  const out = [];
  for (let i = 0; i < LEVELS.length; i++) { game.startLevel(i); if (!inView($('[data-screen=story] [data-action=start]'))) out.push('introdução ' + LEVELS[i].id); }
  game.startLevel(0); game.ui.act('start'); game.ui.act('pause');
  if (![...document.querySelectorAll('[data-screen=pause] .btn')].every(inView)) out.push('pausa');
  game.ui.act('resume');
  game.ui.showComplete(0, 5, 5);
  if (![...document.querySelectorAll('[data-screen=complete] .btn')].every(inView)) out.push('nível concluído');
  game.goMenu();
  if (![...document.querySelectorAll('[data-screen=menu] .btn')].filter((b) => !b.hidden).every(inView)) out.push('menu');
  for (const sc of ['howto', 'levels']) { game.ui.act(sc); if (!inView($(`[data-screen=${sc}] [data-action=back]`))) out.push(sc); game.ui.act('back'); }
  check(`todos os botões dos menus e painéis cabem neste ecrã (${innerWidth}x${innerHeight})`, !out.length, out.join(', '));
  if (!wasTouch) {
    // repõe o modo teclado
    game.startLevel(0); game.ui.act('start');
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }));
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowRight' }));
  }
  game.goMenu();
}

// Joga um nível do princípio ao fim, a partir do ecrã de introdução.
async function playLevel(i, opts = {}) {
  const L = LEVELS[i];
  check(`${L.id}: ecrã de introdução`, game.ui.current === 'story' && $('#story-title').textContent === L.title && $('#story-kicker').textContent === levelLabel(i), `${game.ui.current} / ${$('#story-title').textContent}`);
  game.ui.act('start');
  check(`${L.id}: começa a jogar`, document.body.classList.contains('playing') && document.body.classList.contains('in-level'), document.body.className);
  frames(90);
  // pausa e retomar
  game.ui.act('pause');
  const paused = game.scene.paused && game.ui.current === 'pause';
  const before = JSON.stringify([game.scene.t]);
  frames(30, null);
  game.ui.act('resume');
  check(`${L.id}: pausa e retomar`, paused && !game.scene.paused && game.ui.current === null, `paused=${paused}`);
  void before;
  const t0 = performance.now();
  const ok = await runUntil(() => game.ui.current === 'complete', opts.max || 420);
  const ms = Math.round(performance.now() - t0);
  check(`${L.id}: chega ao fim (${ms} ms)`, ok, `estado=${game.scene.state} cena=${game.scene.constructor.name}`);
  if (!ok) return false;
  const rec = game.save.data.done[L.id];
  const shown = $('#complete-hearts').textContent;
  check(`${L.id}: gravado com corações válidos (${shown})`, rec && rec.hearts >= 0 && rec.hearts <= rec.total && shown === rec.hearts + '/' + rec.total, JSON.stringify(rec) + ' vs ' + shown);
  check(`${L.id}: HUD igual ao resultado`, hud() === shown, hud() + ' vs ' + shown);
  check(`${L.id}: «Perfeito!» só com todos os corações`, $('#complete-perfect').hidden === (rec.hearts !== rec.total));
  if (i + 1 < LEVELS.length) check(`${L.id}: desbloqueia o nível seguinte`, game.isUnlocked(i + 1));
  results.push({ name: `${L.id}: pontuação do robô`, ok: true, info: shown });
  log(`   ${L.id}: ${shown} corações`);
  return true;
}

async function testFullGame() {
  log('— Jogo completo, do primeiro nível ao bónus —');
  localStorage.removeItem(SAVE_KEY);
  game.save.load();
  game.goMenu();
  check('jogo novo: botão «Jogar»', $('#btn-play').textContent === 'Jogar');
  check('jogo novo: só o nível 1 desbloqueado', game.isUnlocked(0) && !game.isUnlocked(1));
  for (let i = 0; i < LEVELS.length; i++) {
    const L = LEVELS[i];
    if (i === 0 || !LEVELS[i - 1].final) {
      // entra pelo botão do menu, que deve levar ao próximo nível por fazer
      game.goMenu();
      if (i > 0) check(`menu: «Continuar» depois de ${LEVELS[i - 1].id}`, $('#btn-play').textContent === 'Continuar');
      game.ui.act('play');
      check(`menu: «Continuar» leva a ${L.id}`, game.scene.index === i, `índice ${game.scene.index}`);
    }
    if (!(await playLevel(i))) return;
    game.ui.act('next');
    if (L.final) {
      check('depois do final: animação do casamento', game.scene.constructor.name === 'VictoryScene' && game.scene.variant === 'wedding');
      await runUntil(() => game.ui.current === 'victory' && !$('[data-screen=victory]').classList.contains('cutscene'), 60);
      check('casamento: ecrã de parabéns com a data', $('#v-title').textContent === 'Parabéns!' && $('#v-date').textContent === '08-10-22' && /4 anos/.test($('#v-line').textContent));
      check('casamento: botão do nível bónus visível', !$('#v-bonus').hidden);
      game.ui.act('bonus');
      check('botão bónus abre a maternidade', game.scene.level && game.scene.level.bonus === true);
    } else if (i === LEVELS.length - 1) {
      check('depois do bónus: final da família', game.scene.constructor.name === 'VictoryScene' && game.scene.variant === 'family');
      frames(10);
      check('família: texto e sem botão bónus', $('#v-title').textContent === 'Família completa!' && $('#v-bonus').hidden);
    } else {
      check(`«Continuar» abre ${LEVELS[i + 1].id}`, game.scene.index === i + 1 && game.ui.current === 'story');
    }
  }
  game.goMenu();
  game.ui.act('play');
  check('tudo feito: «Continuar» mostra a lista de níveis', game.ui.current === 'levels');
  const btns = [...document.querySelectorAll('.level-btn')];
  check('lista de níveis: todos abertos e com pontuação', btns.length === LEVELS.length && btns.every((b) => !b.disabled && b.querySelector('.lv-score').textContent.includes('/')));
}

async function testRestart() {
  log('— Recomeçar e repetir —');
  // recomeçar a meio, pela pausa
  for (const id of ['encontro', 'covid', 'aves', 'maternidade']) {
    const i = LEVELS.findIndex((L) => L.id === id);
    game.startLevel(i);
    game.ui.act('start');
    await runUntil(() => game.scene.got > 0, 120);
    const had = game.scene.got;
    game.ui.act('pause');
    game.ui.act('restart');
    check(`${id}: «Recomeçar nível» volta a zero`, game.scene.got === 0 && !game.scene.paused && game.ui.current === null && hud().startsWith('0/'), `got ${had}→${game.scene.got}, hud ${hud()}`);
  }
  // repetir um nível em duas partes, no ecrã final: deve voltar ao início do nível
  for (const id of ['pretarouca', 'noruega']) {
    const i = LEVELS.findIndex((L) => L.id === id);
    game.startLevel(i);
    game.ui.act('start');
    await runUntil(() => game.ui.current === 'complete', 420);
    game.ui.act('retry');
    check(`${id}: «Repetir» recomeça o nível desde o início`, game.scene.index === i && game.ui.current === 'story' && !game.scene.prev, `${game.scene.constructor.name} / ${game.ui.current}`);
  }
}

function testSettings() {
  log('— Opções e gravação —');
  game.goMenu();
  const d = game.save.data;
  const c0 = d.character;
  game.ui.act('character');
  check('personagem: troca e grava', d.character !== c0 && JSON.parse(localStorage.getItem(SAVE_KEY)).character === d.character);
  check('personagem: botão atualizado', $('#btn-character').textContent.endsWith(d.character === 'luisa' ? 'Luísa' : 'Sérgio'));
  const di = LEVELS.findIndex((L) => L.type === 'date');
  game.startLevel(di);
  check('date: joga-se com a personagem escolhida', game.scene.me.name === d.character);
  game.goMenu();
  game.ui.act('character');
  const m0 = d.musicMuted, s0 = d.muted;
  game.ui.act('music');
  check('música: desliga e grava', d.musicMuted === !m0 && game.audio.musicMuted === d.musicMuted && JSON.parse(localStorage.getItem(SAVE_KEY)).musicMuted === d.musicMuted);
  check('música: botões do menu e da pausa iguais', $('#btn-music').textContent === $('#btn-music-pause').textContent);
  game.ui.act('music');
  game.ui.act('sound');
  check('sons: desliga e grava, sem mexer na música', d.muted === !s0 && game.audio.muted === d.muted && d.musicMuted === m0);
  game.ui.act('sound');
  // tecla M
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM', bubbles: true }));
  document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM', bubbles: true }));
  check('tecla M liga/desliga a música', d.musicMuted === !m0);
  game.ui.act('music');
  // gravação antiga (um só botão de som) e gravação estragada
  const keep = localStorage.getItem(SAVE_KEY);
  localStorage.setItem(SAVE_KEY, JSON.stringify({ character: 'sergio', muted: true, done: { encontro: { hearts: 2, total: 5 } } }));
  game.save.load();
  check('gravação antiga: som desligado passa a desligar também a música', game.save.data.musicMuted === true && game.save.data.done.encontro.hearts === 2);
  localStorage.setItem(SAVE_KEY, '{isto não é json');
  game.save.load();
  check('gravação estragada: não rebenta e volta ao início', typeof game.save.data.done === 'object' && !Object.keys(game.save.data.done).length);
  localStorage.setItem(SAVE_KEY, 'null');
  game.save.load();
  check('gravação «null»: volta ao início', game.save.data.character === 'luisa' && !Object.keys(game.save.data.done).length);
  if (keep) localStorage.setItem(SAVE_KEY, keep); else localStorage.removeItem(SAVE_KEY);
  game.save.load();
  game.audio.setMuted(game.save.data.muted);
  game.audio.setMusicMuted(game.save.data.musicMuted);
  // melhor resultado mantém-se
  const id = LEVELS[0].id, best = game.save.data.done[id];
  if (best) {
    game.save.complete(id, 0, best.total);
    check('repetir pior não apaga o melhor resultado', game.save.data.done[id].hearts === best.hearts);
  }
}

function testMenus() {
  log('— Menus e teclado —');
  game.goMenu();
  game.ui.kb = true;
  const key = (code) => document.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
  key('Enter');
  const first = document.activeElement;
  check('Enter no menu foca/ativa o botão principal', game.ui.current !== 'menu' || first.classList.contains('btn'));
  game.goMenu();
  game.ui.focusFirst();
  const a = document.activeElement;
  key('ArrowDown');
  check('seta para baixo muda de botão', document.activeElement !== a && document.activeElement.classList.contains('btn'));
  game.ui.act('howto');
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }));
  check('Esc no «Como Jogar» volta ao menu', game.ui.current === 'menu');
  game.ui.act('levels');
  check('lista de níveis mostra todos', document.querySelectorAll('.level-btn').length === LEVELS.length);
  game.ui.act('back');
  game.ui.act('install');
  check('«Instalar app» mostra os passos (ou o pedido do browser)', game.ui.current === 'install' ? document.querySelectorAll('#install-steps li').length >= 2 : true);
  game.ui.act('back');
  check('ids usados pela interface existem', ['#btn-play', '#btn-music', '#btn-sound', '#btn-music-pause', '#btn-sound-pause', '#btn-install', '#btn-fullscreen', '#pad', '#jump', '#hint', '#hud-hearts', '#v-bonus'].every((s) => $(s)));
  game.ui.kb = false;
}

// Cada cena aguenta vários tamanhos de ecrã (telemóvel, tablet, computador) sem erros.
async function testViewports() {
  log('— Tamanhos de ecrã —');
  const views = [
    { name: 'telemóvel vertical', w: 251, h: 542, k: 3, portrait: true },
    { name: 'telemóvel deitado', w: 361, h: 167, k: 3, portrait: false },
    { name: 'telemóvel estreito', w: 220, h: 476, k: 2, portrait: true },
    { name: 'iPhone', w: 281, h: 609, k: 4, portrait: true },
    { name: 'janela estreita', w: 188, h: 406, k: 2, portrait: true },
    { name: 'tablet vertical', w: 256, h: 342, k: 4, portrait: true },
    { name: 'tablet deitado', w: 342, h: 256, k: 4, portrait: false },
    { name: 'computador', w: 427, h: 240, k: 4, portrait: false },
    { name: 'ecrã largo', w: 640, h: 180, k: 6, portrait: false },
  ];
  const keep = { ...game.view };
  const cv = document.createElement('canvas'), ctx = cv.getContext('2d');
  for (let i = 0; i < LEVELS.length; i++) {
    const fails = [];
    for (const v of views) {
      game.startLevel(i);
      game.ui.act('start');
      Object.assign(game.view, v);
      if (game.scene.onResize) game.scene.onResize();
      cv.width = v.w; cv.height = v.h;
      try {
        frames(600);   // 10 s: chega aos primeiros momentos de cada nível (ex.: o primeiro bebé a voar)
        game.scene.draw(ctx, game.view);
      } catch (err) { fails.push(`${v.name}: ${err.message}`); }
    }
    check(`${LEVELS[i].id}: desenha em ${views.length} tamanhos de ecrã`, !fails.length, fails.join('; '));
  }
  for (const variant of ['wedding', 'family']) {
    const fails = [];
    for (const v of views) {
      game.showVictory(variant);
      Object.assign(game.view, v);
      cv.width = v.w; cv.height = v.h;
      try { frames(variant === 'wedding' ? 1500 : 120, null); game.scene.draw(ctx, game.view); } catch (err) { fails.push(`${v.name}: ${err.message}`); }
    }
    check(`final ${variant}: desenha em todos os tamanhos`, !fails.length, fails.join('; '));
  }
  delete game.view.name;
  Object.assign(game.view, keep);
  game.goMenu();
}

function testAudio() {
  log('— Som —');
  let ok = true;
  try {
    for (const t of ['menu', 'play', 'calm', 'party', 'inexistente']) game.audio.setTrack(t);
    game.audio.duck(true); game.audio.duck(false);
    for (const s of ['click', 'jump', 'heart', 'win', 'fanfare', 'chirp', 'nada']) game.audio.play(s);
    game.audio.visibility(true); game.audio.visibility(false);
  } catch (err) { ok = false; errors.push('audio: ' + err.message); }
  check('API de som não dá erros', ok);
  game.goMenu();
  check('menu toca a faixa do menu', game.scene.music === 'menu');
}

// Folha de contacto: desenha todas as cenas num dado tamanho de ecrã (em píxeis de jogo), lado
// a lado, para rever as disposições. Na consola:
//   (await import('/tests/qa.js')).sheet(__game, { w: 422, h: 195, portrait: false }, 3)
// only: 'pad' (só as cenas com botões ◀ ▶ ▲) ou 'nopad' (só as outras); a faixa escura no
// topo de cada imagem marca a zona tapada pelo HUD e pela linha de instruções.
export async function sheet(g, v, cols = 3, only = null, secs = 9) {
  game = g;
  I = g.input;
  game.ctx2d = document.getElementById('game').getContext('2d');
  const keep = { ...game.view }, tiles = [];
  const snap = (label) => {
    const c = document.createElement('canvas');
    c.width = v.w; c.height = v.h;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    game.scene.draw(x, game.view);
    x.fillStyle = 'rgba(26,20,51,0.45)';
    x.fillRect(0, 0, v.w, 14);
    x.fillRect(Math.round(v.w * 0.08), 28, Math.round(v.w * 0.84), 16);
    x.fillStyle = '#fff';
    x.font = '8px monospace';
    x.fillText(label, 3, 10);
    tiles.push(c);
  };
  const use = () => { Object.assign(game.view, v); if (game.scene.onResize) game.scene.onResize(); };
  for (let i = 0; i < LEVELS.length; i++) {
    game.startLevel(i);
    const pad = !!game.scene.usesPad;
    if (only === 'pad' && !pad && !LEVELS[i].then) continue;
    game.ui.act('start');
    use();
    const first = game.scene;
    frames(Math.round(secs * 60));
    if (!(only === 'pad' && !pad) && !(only === 'nopad' && pad)) snap(LEVELS[i].id);
    if (LEVELS[i].then && only !== 'pad') {
      await runUntil(() => game.scene !== first || game.ui.current === 'complete', 400);
      if (game.scene !== first) { use(); frames(Math.round(secs * 60)); snap(LEVELS[i].id + ' (2)'); }
    }
  }
  if (only !== 'pad') {
    game.showVictory('wedding'); use(); frames(60 * 12, null); snap('casamento: igreja');
    frames(60 * 9, null); snap('casamento: festa');
    frames(60 * 8, null); snap('casamento: céu');
    game.showVictory('family'); use(); frames(120, null); snap('família');
    game.goMenu(); use(); frames(60, null); snap('menu');
  }
  Object.assign(game.view, keep);
  game.goMenu();
  const rows = Math.ceil(tiles.length / cols), out = document.createElement('canvas');
  out.width = cols * (v.w + 4); out.height = rows * (v.h + 4);
  const x = out.getContext('2d');
  x.fillStyle = '#000';
  x.fillRect(0, 0, out.width, out.height);
  tiles.forEach((c, i) => x.drawImage(c, (i % cols) * (v.w + 4) + 2, Math.floor(i / cols) * (v.h + 4) + 2));
  const old = document.getElementById('qa-sheet');
  if (old) old.remove();
  out.id = 'qa-sheet';
  out.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;object-fit:contain;background:#000;z-index:200;image-rendering:pixelated';
  document.body.append(out);
  return { tiles: tiles.length, size: [out.width, out.height] };
}

// Para depurar um robô na consola: (await import('/tests/qa.js')).debugLevel(__game, 2)
export async function debugLevel(g, i, secs = 300) {
  game = g;
  I = g.input;
  game.ctx2d = document.getElementById('game').getContext('2d');
  g.startLevel(i);
  g.ui.act('start');
  const trace = [];
  let last = '';
  await runUntil(() => {
    const s = game.scene, p = s.player || s.p;
    const st = `${s.constructor.name}:${s.state}` + (p ? `@${Math.round(p.x / 16)},${Math.round(p.y / 16)}` : '');
    if (s.state !== last) { trace.push(st); last = s.state; }
    return game.ui.current === 'complete';
  }, secs);
  const s = game.scene, p = s.player || s.p;
  return { done: game.ui.current === 'complete', scene: s.constructor.name, state: s.state, got: s.got, pos: p && [Math.round(p.x / 16), Math.round(p.y / 16)], trace: trace.slice(-12) };
}

export async function run(g) {
  game = g;
  I = g.input;
  game.ctx2d = document.getElementById('game').getContext('2d');
  window.addEventListener('error', (e) => errors.push('window: ' + e.message));
  // ?qa&touch: simula um ecrã tátil (para correr a suite num telemóvel ou com o ecrã emulado)
  if (new URLSearchParams(location.search).has('touch')) window.dispatchEvent(new Event('touchstart'));
  log('QA — Luísa & Sérgio (' + new Date().toLocaleString('pt-PT') + ')');
  const t0 = performance.now();
  const steps = [testData, testReachable, testLayout, testMenus, testSettings, testAudio, testFullGame, testRestart, testViewports];
  for (const fn of steps) {
    try { await fn(); } catch (err) { check(`${fn.name} terminou sem exceções`, false, err.stack || err.message); }
    await tick();
  }
  check('sem erros de JavaScript durante os testes', !errors.length, errors.join(' | '));
  const bad = results.filter((r) => !r.ok);
  log(`\n${results.length - bad.length}/${results.length} verificações OK em ${Math.round((performance.now() - t0) / 1000)} s` + (bad.length ? `\nFALHAS:\n` + bad.map((r) => ' ✘ ' + r.name + (r.info ? ' — ' + r.info : '')).join('\n') : ''));
  localStorage.removeItem(SAVE_KEY);
  game.save.load();
  game.goMenu();
  window.__qa = { results, errors, bad };
  return window.__qa;
}
