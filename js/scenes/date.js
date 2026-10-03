// Nível "Primeiro Date": um jantar em vários "pratos", cada um um microjogo.
// Todos alimentam o medidor de Química; com Química alta há um final alternativo.
//
// Cada microjogo (em GAMES) tem:
//   title / hint        textos mostrados no topo do ecrã ({par} = nome do par)
//   init(s, g)          prepara o estado `g` do microjogo
//   update(s, g, dt, I, pressed)   lógica; termina com s.done(perfeito, mensagem, química)
//   pose(s, g)          (opcional) inclinação/rotação das personagens
//   back(s, g, R, t)    (opcional) desenho atrás da mesa
//   draw(s, g, R, t)    desenho por cima da mesa e no painel inferior
import { LEVELS } from '../levels/index.js';
import { getCharacter, getSprites, partnerOf } from '../sprites.js';
import { Particles } from '../fx.js';

const SW = 240, SH = 146, FLOOR = 100;
const INK = '#2b1d2e', CREAM = '#fff6e6', PINK = '#ff5d8f', GOLD = '#ffd166', GREEN = '#5cf08a';
const RED = '#ff3b3b', WINE = '#8a1f3d', SKIN = '#f6c9a0', WOOD = '#8a5a3c', WOODD = '#5a3524', SLATE = '#4a3a55';
const GZ = 'rgba(92,240,138,0.38)';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mod = (a, n) => ((a % n) + n) % n;
const rnd = (a, b) => a + Math.random() * (b - a);

// Temas de conversa: os bons dizem-se, os maus engolem-se.
const TOPICS = {
  good: [
    { icon: 'heart', txt: 'Um elogio sincero' },
    { icon: 'note', txt: 'Música preferida' },
    { icon: 'plane', txt: 'Viagens de sonho' },
    { icon: 'sun', txt: 'Planos para as férias' },
  ],
  bad: [
    { icon: 'broken', txt: 'Falar da ex...' },
    { icon: 'bone', txt: 'Uma fratura exposta em detalhe' },
    { icon: 'zzz', txt: 'Escalas e relatórios do hospital' },
  ],
};

const GAMES = {
  // 1. Troca de olhares: manter premido só quando o par espreita por cima da ementa.
  olhares: {
    title: 'Troca de olhares',
    hint: 'Mantém premido para olhar quando {par} espreitar. Olhar de mais faz corar!',
    init(s, g) { Object.assign(g, { n: 0, blush: 0, phase: 'menu', t: 1.5, scored: false, hide: 0, ok: true, gaze: false }); },
    update(s, g, dt, I) {
      g.t -= dt;
      if (g.t <= 0) {
        if (g.phase === 'menu') { g.phase = 'tell'; g.t = 0.5; }
        else if (g.phase === 'tell') { g.phase = 'glance'; g.t = 1.05; g.scored = false; }
        else { g.phase = 'menu'; g.t = rnd(1, 2.3); }
      }
      if (g.hide > 0) { g.hide -= dt; g.gaze = false; g.blush = Math.max(0, g.blush - dt * 0.4); return; }
      g.gaze = I.action;
      g.blush = clamp(g.blush + (g.gaze ? 0.62 : -0.42) * dt, 0, 1);
      if (g.gaze && g.phase === 'glance' && !g.scored) {
        g.scored = true;
        g.n++;
        g.blush = Math.max(0, g.blush - 0.25);
        s.sfx('heart');
        s.hearts(120, 44, 4);
        if (g.n >= 3) s.done(g.ok, g.ok ? 'Olhares cruzados! Que faísca!' : 'Olhares cruzados... e bochechas bem coradas.');
      } else if (g.blush >= 1) {
        g.ok = false;
        g.hide = 1.6;
        g.blush = 0.55;
        s.sfx('hurt');
        s.say(`${s.meL ? 'Apanhada' : 'Apanhado'} a olhar fixamente! Que vergonha...`, 1.6);
      }
    },
    pose(s, g) { return { me: { dx: g.gaze ? 3 : 0 } }; },
    draw(s, g, R, t) {
      const low = g.phase === 'glance' ? 16 : g.phase === 'tell' ? 6 : 0;
      s.menu(s.date, s.date.top + 2 + low);
      if (g.phase === 'tell' && Math.floor(t * 12) % 2) s.emote(s.date, '?');
      if (g.phase === 'glance' && g.scored) s.emote(s.date, 'heart');
      if (g.hide > 0) s.menu(s.me, s.me.top + 2);
      else {
        s.blush(s.me, g.blush, g.gaze ? 3 * s.me.lean : 0);
        if (g.gaze) s.emote(s.me, 'heart', 3);
      }
      // painel: termómetro da vergonha + olhares cruzados
      R(34, 120, 126, 12, CREAM);
      R(36, 122, 122, 8, SLATE);
      R(36, 122, Math.round(g.blush * 122), 8, g.blush > 0.75 ? RED : PINK);
      for (let i = 0; i < 3; i++) s.img(i < g.n ? s.spr.heart : s.spr.heartOff, 170 + i * 14, 122);
    },
  },

  // 2. Servir o vinho: manter premido e largar entre as marcas, um copo de cada vez.
  vinho: {
    title: 'Servir o vinho',
    hint: 'Mantém premido para servir e larga entre as marcas verdes. Sem entornar!',
    init(s, g) { Object.assign(g, { i: 0, fills: [0, 0], res: [], pouring: false, wait: 0, zone: [0.56, 0.76] }); },
    update(s, g, dt, I, pressed) {
      if (g.wait > 0) {
        g.wait -= dt;
        if (g.wait <= 0) {
          g.i++;
          if (g.i >= 2) {
            const ok = g.res.every((r) => r === 'ok');
            g.i = 1;
            s.done(ok, ok ? `Dois copos no ponto. Mãos de ${s.meL ? 'anestesista' : 'cirurgião'}!` : s.tipsy ? 'Copos cheios até cima... isto vai subir à cabeça!' : 'Servido. Mais ou menos...');
          } else {
            const lo = rnd(0.45, 0.62);
            g.zone = [lo, lo + 0.19];
          }
        }
        return;
      }
      const end = (r) => {
        g.pouring = false;
        g.res.push(r);
        g.wait = 1;
        if (r === 'ok') { s.sfx('check'); s.say('Na medida certa!', 1); }
        else if (r === 'low') { s.sfx('hurt'); s.say('Só um dedinho? Que forreta...', 1); }
        else { s.tipsy = true; s.sfx('buzz'); s.say('Entornou! Copo cheio até cima...', 1); }
      };
      if (I.action && (g.pouring || pressed)) {
        g.pouring = true;
        g.fills[g.i] += (0.3 + g.fills[g.i] * 0.85) * dt * (g.i ? 1.2 : 1);
        if (g.fills[g.i] >= 1.04) { g.fills[g.i] = 1; end('over'); }
      } else if (g.pouring) {
        const f = g.fills[g.i];
        end(f < g.zone[0] ? 'low' : f > g.zone[1] ? 'over' : 'ok');
      }
    },
    draw(s, g, R) {
      for (let j = 0; j < 2; j++) {
        const gx = 70 + j * 62, f = g.fills[j], h = Math.round(Math.min(1, f) * 22);
        R(gx, 113, 28, 25, 'rgba(255,255,255,0.14)');
        R(gx + 1, 137 - h, 26, h, WINE);
        R(gx, 113, 1, 25, '#cfe6f0');
        R(gx + 27, 113, 1, 25, '#cfe6f0');
        R(gx, 137, 28, 1, '#cfe6f0');
        if (j === g.i && g.wait <= 0) {
          const yLo = 137 - Math.round(g.zone[0] * 22), yHi = 137 - Math.round(g.zone[1] * 22);
          R(gx - 4, yHi, 36, 1, GREEN);
          R(gx - 4, yLo, 36, 1, GREEN);
          R(gx + 1, yHi + 1, 26, yLo - yHi - 1, GZ);
          // garrafa
          R(gx - 20, 113, 9, 22, '#2f6b3f');
          R(gx - 12, 115, 8, 3, '#2f6b3f');
          R(gx - 19, 121, 7, 7, CREAM);
          if (g.pouring) R(gx - 4, 117, 2, 20 - h, WINE);
        }
        if (g.res[j]) R(gx + 10, 140, 8, 2, g.res[j] === 'ok' ? GREEN : RED);
        if (g.res[j] === 'over') { R(gx - 3, 136, 3, 2, WINE); R(gx + 28, 135, 4, 3, WINE); }
      }
    },
  },

  // 3. Conversa: tocar para dizer os bons temas, deixar passar os maus.
  conversa: {
    title: 'Conversa de médicos',
    hint: 'Toca para dizer os bons temas. Os maus... deixa passar!',
    init(s, g) {
      const pick = (list, n) => [...list].sort(() => Math.random() - 0.5).slice(0, n);
      const seq = [...pick(TOPICS.good, 4).map((x) => ({ ...x, good: true })), ...pick(TOPICS.bad, 3).map((x) => ({ ...x, good: false }))];
      seq.sort(() => Math.random() - 0.5);
      Object.assign(g, { seq, k: 0, t: 0, st: 'wait', res: [], dur: s.tipsy ? 1.05 : 1.5, tipsy: s.tipsy });
    },
    update(s, g, dt, I, pressed) {
      g.t += dt;
      const cur = g.seq[g.k];
      if (g.st === 'wait') {
        if (g.t > 0.35) { g.st = 'show'; g.t = 0; s.say(cur.txt, 9); }
      } else if (g.st === 'show') {
        if (pressed) {
          g.res[g.k] = cur.good;
          g.st = cur.good ? 'fly' : 'gaffe';
          g.t = 0;
          s.sfx(cur.good ? 'heart' : 'buzz');
        } else if (g.t > g.dur) {
          g.res[g.k] = !cur.good;
          g.st = 'pop';
          g.t = 0;
        }
      } else if (g.t > 0.7) {
        g.k++;
        g.t = 0;
        g.st = 'wait';
        if (g.k >= g.seq.length) {
          g.k = g.seq.length - 1;
          g.st = 'end';
          const right = g.res.filter(Boolean).length;
          s.tipsy = false;
          s.done(right === 7, right === 7 ? 'Conversa perfeita! Nem um deslize.' : right >= 5 ? 'Boa conversa, com uma ou outra gafe...' : 'Muitas gafes... mas houve gargalhadas!', right === 7 ? 11 : right >= 5 ? 7 : 4);
        }
      }
    },
    draw(s, g, R, t) {
      const cur = g.seq[g.k], me = s.me, d = s.date;
      if (g.st === 'show' || g.st === 'fly' || g.st === 'gaffe') {
        let bx = me.x + 4 + (g.tipsy ? Math.round(Math.sin(t * 9) * 4) : 0), by = me.top - 27;
        if (g.st === 'fly') {
          const e = Math.min(1, g.t / 0.45);
          bx += (d.x + 4 - bx) * e;
          by -= Math.round(Math.sin(e * Math.PI) * 6);
        }
        if (g.st === 'gaffe') bx += Math.round(Math.sin(t * 50) * 2);
        bx = Math.round(bx);
        R(bx - 1, by - 1, 26, 20, INK);
        R(bx, by, 24, 18, g.st === 'gaffe' ? '#ffb3b3' : '#ffffff');
        R(bx + 9, by + 18, 6, 2, INK);
        R(bx + 10, by + 18, 4, 1, g.st === 'gaffe' ? '#ffb3b3' : '#ffffff');
        s.icon(cur.icon, bx + 8, by + 4);
        if (g.st === 'show') R(bx + 2, by + 15, Math.round(20 * (1 - g.t / g.dur)), 2, PINK);
      }
      if (g.st === 'fly' && g.t > 0.4) s.emote(d, 'heart');
      if (g.st === 'gaffe') s.emote(d, 'drop');
      // painel: os 7 temas
      for (let i = 0; i < g.seq.length; i++) {
        const r = g.res[i];
        R(49 + i * 21, 119, 16, 14, i === g.k && g.st !== 'end' ? GOLD : SLATE);
        R(51 + i * 21, 121, 12, 10, r === undefined ? '#2a2233' : r ? GREEN : RED);
      }
    },
  },

  // 4. Roubar batatas: só quando o par está a olhar para o lado.
  batatas: {
    title: 'Roubar batatas fritas',
    hint: 'Toca para roubar uma batata... só quando {par} olhar para o lado!',
    init(s, g) { Object.assign(g, { n: 0, look: 'watch', t: 1.3, reach: 0, stun: 0, ok: true }); },
    update(s, g, dt, I, pressed) {
      g.t -= dt;
      if (g.t <= 0) {
        if (g.look === 'watch') { g.look = 'away'; g.t = rnd(0.9, 1.6); }
        else { g.look = 'watch'; g.t = rnd(0.9, 1.9); }
      }
      if (g.stun > 0) { g.stun -= dt; return; }
      const caught = () => {
        g.reach = 0;
        g.stun = 1.2;
        g.ok = false;
        s.sfx('hurt');
        s.say(`${s.meL ? 'Apanhada' : 'Apanhado'}! Levaste com o garfo na mão.`, 1.3);
      };
      if (g.reach > 0) {
        if (g.look === 'watch') return caught();
        g.reach -= dt;
        if (g.reach <= 0) {
          g.n++;
          s.sfx('pop');
          if (g.n >= 5) s.done(g.ok, g.ok ? 'Cinco batatas roubadas sem dar nas vistas!' : 'Batatas roubadas... e uns dedos doridos.');
        }
      } else if (pressed) {
        if (g.look === 'watch') caught();
        else g.reach = 0.4;
      }
    },
    pose(s, g) { return { date: { flip: g.look === 'away' } }; },
    draw(s, g, R, t) {
      // pratos; as batatas estão no prato do par
      R(s.M(82, 22), 75, 22, 3, '#e6e6f0');
      const px = s.M(136, 22);
      R(px, 75, 22, 3, '#e6e6f0');
      for (let k = 0; k < 5 - g.n; k++) R(px + 3 + k * 3, 67 - (k % 2) * 2, 2, 8, GOLD);
      if (g.look === 'away' && g.t < 0.3) s.emote(s.date, '?');
      // a mão que rouba
      const e = g.reach > 0 ? Math.sin(Math.PI * (1 - g.reach / 0.4)) : g.stun > 0 ? 0.8 : 0;
      if (e > 0) {
        const len = Math.round(12 + e * 46);
        R(s.M(84, len), 71, len, 4, SKIN);
        R(s.M(84 + len - 5, 5), 69, 5, 7, SKIN);
        if (g.stun > 0) {
          const fx = s.M(84 + len - 6, 9);
          R(fx + 3, 58, 2, 11, '#d8dce6');
          R(fx, 64, 8, 2, '#d8dce6');
          if (Math.floor(t * 12) % 2) { R(fx - 2, 62, 2, 2, RED); R(fx + 9, 66, 2, 2, RED); R(fx + 3, 55, 2, 2, GOLD); }
        }
      }
      if (g.stun > 0) s.emote(s.me, 'drop');
      // painel: olho do par (aberto = está a ver) + batatas roubadas
      const open = g.look === 'watch';
      R(56, 116, 36, 20, open ? '#ffffff' : SLATE);
      R(54, 120, 2, 12, open ? '#ffffff' : SLATE);
      R(92, 120, 2, 12, open ? '#ffffff' : SLATE);
      if (open) { R(68, 118, 12, 16, '#55703f'); R(71, 122, 6, 8, INK); R(72, 122, 2, 2, '#ffffff'); }
      else R(58, 126, 32, 2, INK);
      for (let k = 0; k < 5; k++) {
        R(112 + k * 18, 116, 8, 20, k < g.n ? GOLD : SLATE);
        if (k < g.n) R(112 + k * 18, 116, 2, 20, '#fff3c4');
      }
    },
  },

  // 5. Esparguete: toques a ritmo certo para manter a agulha no verde.
  esparguete: {
    title: 'Esparguete a dois',
    hint: 'Toca a um ritmo certo: mantém a agulha no verde. Nem depressa, nem devagar!',
    init(s, g) { Object.assign(g, { v: 0, p: 0, low: 0, ok: true, started: false, splash: 0, stains: 0 }); },
    update(s, g, dt, I, pressed) {
      if (g.splash > 0) { g.splash -= dt; return; }
      if (pressed) { g.v += 0.2; g.started = true; s.sfx('slurp'); }
      g.v = Math.max(0, g.v - 0.42 * dt);
      if (g.v >= 1) {
        g.ok = false;
        g.v = 0.3;
        g.splash = 0.9;
        g.stains++;
        s.sfx('buzz');
        s.say('Depressa de mais! Molho na roupa...', 1.2);
      } else if (g.v >= 0.4 && g.v <= 0.75) {
        g.p += dt * 0.21;
        g.low = 0;
        if (g.p >= 1) { g.p = 1; s.done(g.ok, g.ok ? 'Encontraram-se a meio do fio... que momento!' : 'Chegaram ao meio do fio, com algum molho pelo caminho.'); }
      } else if (g.started && g.v < 0.4) {
        g.low += dt;
        if (g.low > 1.6) {
          g.ok = false;
          g.low = 0;
          g.started = false;
          g.p = Math.max(0, g.p - 0.25);
          s.sfx('hurt');
          s.say('Devagar de mais: o fio partiu-se!', 1.2);
        }
      }
    },
    pose(s, g) { const dx = Math.round(g.p * 17); return { me: { dx }, date: { dx } }; },
    draw(s, g, R, t) {
      const dx = Math.round(g.p * 17);
      R(107, 75, 26, 3, '#e6e6f0');
      R(111, 70, 18, 5, '#ffe08a');
      R(114, 68, 12, 2, '#ffe08a');
      R(117, 66, 6, 4, '#a8324a');
      // o fio entre as duas bocas
      const L = s.L, Rc = s.Rc;
      const xa = L.x + 22 + dx, xb = Rc.x + 10 - dx, ya = 55, yb = 51;
      for (let x = xa; x < xb; x += 2) {
        const e = (x - xa) / Math.max(1, xb - xa);
        R(x, Math.round(ya + (yb - ya) * e + Math.sin(e * Math.PI) * (4 + Math.sin(t * 10) * (g.splash > 0 ? 2 : 0.6))), 2, 1, '#ffe08a');
      }
      for (let k = 0; k < Math.min(g.stains, 4); k++) R(s.me.x + 10 + k * 4, 60 + (k % 2) * 3, 2, 2, '#c2384a');
      if (g.p > 0.9) { s.blush(s.me, 0.8, s.me.lean * dx); s.blush(s.date, 0.8, s.date.lean * dx); }
      // painel: velocímetro de sorver + progresso
      R(38, 119, 164, 12, CREAM);
      R(40, 121, 160, 8, SLATE);
      R(40 + 64, 121, 56, 8, GZ);
      R(40 + 64, 121, 1, 8, GREEN);
      R(40 + 119, 121, 1, 8, GREEN);
      R(40 + Math.round(Math.min(1, g.v) * 158), 116, 2, 18, g.splash > 0 ? RED : GOLD);
      R(40, 136, 160, 3, SLATE);
      R(40, 136, Math.round(g.p * 160), 3, PINK);
    },
  },

  // 6. Pezinho: levar o pé até ao do par, recuando quando o empregado passa.
  pezinho: {
    title: 'Pezinho debaixo da mesa',
    hint: 'Arrasta o dedo (ou mantém premido / setas) para tocar no pé d{par_}. Recua quando passar o empregado!',
    init(s, g) { Object.assign(g, { u: 0.12, d: 0.78, dv: 0.09, contact: 0, wt: 2.4, ws: 'idle', hit: false, stun: 0, ok: true }); },
    update(s, g, dt, I) {
      // empregado: avisa (sombra) e depois passa pela zona do meio
      g.wt -= dt;
      if (g.wt <= 0) {
        if (g.ws === 'idle') { g.ws = 'warn'; g.wt = 0.85; s.sfx('click'); }
        else if (g.ws === 'warn') { g.ws = 'stomp'; g.wt = 0.75; g.hit = false; }
        else { g.ws = 'idle'; g.wt = rnd(1.8, 3.2); }
      }
      // o pé do par passeia; encolhe-se quando vem o empregado
      if (g.ws === 'idle') {
        g.d += g.dv * dt;
        if (g.d > 0.88) { g.d = 0.88; g.dv = -Math.abs(g.dv); } else if (g.d < 0.64) { g.d = 0.64; g.dv = Math.abs(g.dv); }
      } else g.d = Math.min(0.95, g.d + dt * 0.5);
      if (g.stun > 0) { g.stun -= dt; g.u = Math.max(0.1, g.u - dt * 1.2); return; }
      // o meu pé: segue o dedo, ou estica enquanto se mantém premido / seta na direção do par
      if (s.px !== null) {
        const target = clamp(s.meL ? (s.px - 26) / 188 : (214 - s.px) / 188, 0.08, 0.99);
        g.u += clamp(target - g.u, -1.7 * dt, 1.7 * dt);
      } else {
        const toward = s.meL ? I.right : I.left, back = s.meL ? I.left : I.right;
        g.u += (toward || (I.action && !back) ? 0.7 : -0.9) * dt;
      }
      g.u = clamp(g.u, 0.08, g.d + 0.045);
      if (g.ws === 'stomp' && !g.hit && g.u > 0.36) {
        g.hit = true;
        g.ok = false;
        g.stun = 1.2;
        s.sfx('buzz');
        s.fx.burst(120, 126, 14, [GOLD, '#ffffff', RED], 70);
        s.say('Rasteira ao empregado! Lá vai o tabuleiro...', 1.5);
      } else if (g.u > g.d + 0.03) {
        g.ok = false;
        g.stun = 0.9;
        s.sfx('hurt');
        s.say('Ui! Isso foi a canela...', 1.2);
      } else if (g.u >= g.d - 0.07) {
        g.contact += dt;
        if (Math.floor(g.contact * 5) !== Math.floor((g.contact - dt) * 5)) s.fx.heart(s.ux((g.u + g.d) / 2 + 0.03), 122);
        if (g.contact >= 2.6) s.done(g.ok, g.ok ? 'Pezinho discreto... e caras muito compostas.' : 'Pezinho conseguido, com alguns acidentes pelo caminho.');
      }
    },
    draw(s, g, R, t) {
      const touching = g.u >= g.d - 0.07 && g.stun <= 0;
      if (touching) { s.blush(s.me, 0.7); s.blush(s.date, 0.7); }
      // painel: vista por baixo da toalha
      R(22, 112, 196, 28, '#5e4650');
      R(22, 137, 196, 3, WOOD);
      R(22, 112, 196, 4, CREAM);
      for (let x = 22; x < 218; x += 8) R(x + 1, 116, 6, 2, CREAM);
      const leg = (uTip, fromMe, name) => {
        const pants = name === 'luisa' ? SKIN : '#34406e', shoe = name === 'luisa' ? '#d43d51' : '#15151f';
        const tip = s.ux(uTip), edge = s.ux(fromMe ? 0 : 1);
        const x0 = Math.min(tip, edge), w = Math.abs(tip - edge);
        R(x0, 127, w, 6, pants);
        const dir = tip > edge ? 1 : -1;
        R(dir > 0 ? tip - 2 : tip - 8, 125, 10, 9, shoe);
        R(dir > 0 ? tip + 4 : tip - 8, 123, 4, 3, shoe);
      };
      leg(g.d + 0.02, false, s.date.name);
      leg(g.u - 0.02, true, s.me.name);
      const wx = s.ux(0.46);
      if (g.ws === 'warn' && Math.floor(t * 10) % 2) R(wx - 16, 135, 32, 3, 'rgba(0,0,0,0.5)');
      if (g.ws === 'stomp') {
        R(wx - 10, 112, 7, 22, INK);
        R(wx + 3, 112, 7, 22, INK);
        R(wx - 13, 133, 11, 4, INK);
        R(wx + 2, 133, 11, 4, INK);
      }
      for (let k = 0; k < 5; k++) R(s.M(174, 6) + (s.meL ? k * 8 : -k * 8), 119, 6, 5, k < Math.floor((g.contact / 2.6) * 5) ? PINK : SLATE);
    },
  },

  // 7. Guerra da conta: toques puxam a conta; mantê-la ao centro até ao fim dá "dividimos?".
  conta: {
    title: 'A guerra da conta',
    hint: 'Toques rápidos puxam a conta. Mantém-na ao centro até ao fim para dividirem!',
    init(s, g) { Object.assign(g, { p: 0, time: 6, force: 0.25, surge: 0.6 }); },
    update(s, g, dt, I, pressed) {
      g.time -= dt;
      if (pressed) g.p += 0.085;
      g.surge -= dt;
      if (g.surge <= 0) { g.force = rnd(0.14, 0.44); g.surge = rnd(0.5, 1.1); }
      g.p = clamp(g.p - g.force * dt, -1, 1);
      if (g.p >= 1) s.done(false, 'A conta é tua! Um gesto com muita classe.', 8);
      else if (g.p <= -1) s.done(false, s.fmt('{Par} adiantou-se e pagou tudo.'), 5);
      else if (g.time <= 0) {
        if (Math.abs(g.p) < 0.23) s.done(true, 'Empate! «Dividimos?» — a resposta certa.');
        else if (g.p > 0) s.done(false, 'Ficaste com a conta. Que classe!', 8);
        else s.done(false, s.fmt('{Par} puxou mais e pagou a conta.'), 5);
      }
    },
    draw(s, g, R, t) {
      const sgn = s.meL ? -1 : 1;
      const bx = Math.round(120 + sgn * g.p * 30);
      R(s.L.x + 22, 71, Math.max(2, bx - 7 - s.L.x - 22), 4, SKIN);
      R(bx + 7, 71, Math.max(2, s.Rc.x + 10 - bx - 7), 4, SKIN);
      R(bx - 8, 67, 16, 10, INK);
      R(bx - 7, 68, 14, 8, CREAM);
      R(bx - 5, 70, 8, 1, INK);
      R(bx - 5, 72, 10, 1, INK);
      R(bx - 5, 74, 5, 1, RED);
      // painel
      R(33, 122, 174, 8, CREAM);
      R(35, 124, 170, 4, SLATE);
      R(120 - 20, 118, 40, 16, GZ);
      R(100, 118, 1, 16, GREEN);
      R(139, 118, 1, 16, GREEN);
      const mx = Math.round(120 + sgn * g.p * 85);
      R(mx - 6, 116, 12, 20, INK);
      R(mx - 5, 117, 10, 18, CREAM);
      R(mx - 3, 120, 6, 1, INK);
      R(mx - 3, 123, 6, 1, INK);
      R(mx - 3, 129, 4, 2, RED);
      R(35, 137, Math.round(170 * Math.max(0, g.time) / 6), 2, GOLD);
    },
  },

  // 8. O primeiro beijo: tocar quando os dois corações se sobrepõem.
  beijo: {
    title: 'O primeiro beijo',
    hint: 'Toca quando os dois corações se encontrarem ao centro!',
    init(s, g) { Object.assign(g, { a: 0, v: 0.5, ok: true, fail: 0, kind: null, won: false }); },
    update(s, g, dt, I, pressed) {
      if (g.fail > 0) {
        g.fail -= dt;
        if (g.fail <= 0) { g.a = 0; g.v = rnd(0.45, 0.8); g.kind = null; }
        return;
      }
      g.a += g.v * dt;
      const miss = (kind, msg) => {
        g.ok = false;
        g.fail = 1.6;
        g.kind = kind;
        s.sfx(kind === 'late' ? 'buzz' : 'hurt');
        s.say(msg, 1.6);
      };
      if (pressed) {
        if (g.a >= 0.9 && g.a <= 1.09) {
          g.won = true;
          g.a = 1;
          s.sfx('kiss');
          s.hearts(120, 40, 10);
          s.done(g.ok, g.ok ? 'O primeiro beijo. Perfeito!' : 'O primeiro beijo! (à segunda foi de vez)');
        } else if (g.a < 0.9) miss('early', 'Cedo de mais! Bateram com os narizes...');
      } else if (g.a > 1.22) miss('late', 'Tarde de mais! Beijaste o empregado da sobremesa...');
    },
    pose(s, g) {
      const dx = Math.round(Math.min(1, g.a) * (g.kind === 'early' ? 12 : 17));
      return { me: { dx }, date: { dx: g.kind === 'late' ? 0 : dx } };
    },
    back(s, g, R, t) {
      if (g.kind === 'late') {
        s.ctx.drawImage(s.waiter.stand[s.meL ? 'l' : 'r'], s.ox + 106, s.oy + 30, 32, 48);
        R(112, 60, 16, 3, '#e6e6f0');
        R(115, 54, 10, 6, '#ffb3d1');
        R(119, 51, 2, 3, RED);
      }
    },
    draw(s, g, R, t) {
      if (g.kind === 'early' && Math.floor(t * 12) % 2) { R(118, 46, 4, 4, GOLD); R(116, 48, 8, 1, GOLD); R(120, 44, 1, 8, GOLD); }
      if (g.won) {
        s.blush(s.me, 0.9, s.me.lean * 17);
        s.blush(s.date, 0.9, s.date.lean * 17);
        const b = Math.round(Math.sin(t * 6) * 2);
        s.img(s.spr.heart, 106, 8 + b, 27, 24);
      }
      // painel: dois corações a aproximarem-se do alvo
      R(108, 113, 24, 1, GOLD);
      R(108, 138, 24, 1, GOLD);
      R(108, 113, 1, 26, GOLD);
      R(131, 113, 1, 26, GOLD);
      const a = g.won ? 1 : g.a;
      s.img(s.spr.heart, Math.round(30 + a * 81), 118, 18, 16);
      s.img(s.spr.heartGold, Math.round(192 - a * 81), 118, 18, 16);
    },
  },

  // Interrupção: o telefone do hospital toca e é preciso silenciá-lo depressa (mas não antes!).
  phone: {
    card: false,
    heart: false,
    hint: 'Que noite agradável...',
    init(s, g) { Object.assign(g, { wait: rnd(1.1, 2.4), ring: 0, st: 'calm', beep: 0 }); },
    update(s, g, dt, I, pressed) {
      if (g.st === 'calm') {
        g.wait -= dt;
        if (pressed) s.done(false, 'Calma! Com os nervos, lá se entornou um copo...', -3);
        else if (g.wait <= 0) { g.st = 'ring'; s.say('TRRRIM! O telefone do hospital! Toca para o silenciar!', 9); }
      } else {
        g.ring += dt;
        g.beep -= dt;
        if (g.beep <= 0) { s.sfx('ring'); g.beep = 0.35; }
        if (pressed) s.done(false, g.ring < 0.9 ? 'Silenciado a tempo. Sorriso intacto!' : 'Demorou... mas lá se calou.', g.ring < 0.9 ? 6 : 2);
        else if (g.ring > 2.4) s.done(false, 'O telefone não se cala! Que momento...', -4);
      }
    },
    draw(s, g, R, t) {
      const ringing = g.st === 'ring' && s.state === 'play';
      const dx = ringing ? Math.round(Math.sin(t * 60) * 2) : 0;
      if (ringing) s.emote(s.me, '!');
      R(107 + dx, 112, 26, 28, '#8a8498');
      R(108 + dx, 113, 24, 26, '#3a3448');
      R(110 + dx, 115, 20, 15, ringing ? (Math.floor(t * 8) % 2 ? '#7be0b0' : '#2f8a6c') : '#1d2a2a');
      R(117 + dx, 133, 6, 4, '#8a8498');
      if (ringing) {
        for (let k = 0; k < 3; k++) {
          const on = Math.floor(t * 10) % 3 >= k;
          R(100 - k * 7, 119 - k * 2, 2, 12 + k * 4, on ? GOLD : SLATE);
          R(138 + k * 7, 119 - k * 2, 2, 12 + k * 4, on ? GOLD : SLATE);
        }
      }
    },
  },
};

export class DateScene {
  constructor(game, index) {
    this.game = game;
    this.index = index;
    this.level = LEVELS[index];
    this.courses = this.level.courses;
    this.total = this.courses.filter((id) => GAMES[id].heart !== false).length;
    this.spr = getSprites();
    this.waiter = getCharacter('waiter');
    const meName = game.save.data.character;
    // A Luísa senta-se à esquerda e o Sérgio à direita; o jogador controla a personagem escolhida no menu.
    this.L = { name: 'luisa', frames: getCharacter('luisa', 'night'), x: 50, dir: 'r', lean: 1, top: 36, cheek: [22, 22] };
    this.Rc = { name: 'sergio', frames: getCharacter('sergio', 'night'), x: 158, dir: 'l', lean: -1, top: 32, cheek: [7, 19] };
    this.meL = meName === 'luisa';
    this.me = this.meL ? this.L : this.Rc;
    this.date = this.meL ? this.Rc : this.L;
    this.dateName = partnerOf(meName);
    this.t = 0;
    this.paused = false;
    this.setup();
  }

  setup() {
    this.state = 'intro';   // intro → (card → play → result) por cada prato → ending → done
    this.ci = 0;
    this.chem = 0;          // Química, de 0 a 100
    this.got = 0;           // pratos perfeitos (corações)
    this.tipsy = false;     // vinho a mais: a conversa seguinte fica mais difícil
    this.timer = 0;
    this.lock = 0;
    this.sayT = 0;
    this.px = null;
    this.hot = false;
    this.fx = new Particles();
    this.def = GAMES[this.courses[0]];
    this.g = {};
    this.def.init(this, this.g);
  }

  enter() { this.game.ui.showStory(this.index); }

  exit() {
    document.body.classList.remove('minigame');
    this.game.ui.setLevelMode(false, false);
  }

  begin() {
    this.paused = false;
    this.game.input.reset();
    document.body.classList.add('minigame');
    this.game.ui.setHud(this.got, this.total, this.level.title);
    this.game.ui.setLevelMode(true, true);
    this.startCourse();
  }

  restart() {
    this.setup();
    this.begin();
  }

  togglePause() {
    if (this.state === 'intro' || this.state === 'ending' || this.state === 'done') return;
    this.paused = !this.paused;
    this.game.input.reset();
    this.game.ui.setLevelMode(true, !this.paused);
    this.game.ui.show(this.paused ? 'pause' : null);
  }

  autoPause() { if (!this.paused) this.togglePause(); }

  // ---------- Ajudas para os microjogos ----------
  fmt(text) {
    const d = this.dateName === 'luisa' ? { n: 'Luísa', a: 'a' } : { n: 'Sérgio', a: 'o' };
    return this.game.ui.fmt(text.replace(/d\{par_\}/g, 'd' + d.a + ' ' + d.n));
  }
  sfx(name) { this.game.audio.play(name); }
  setBase(text) { this.baseHint = this.fmt(text); this.sayT = 0; this.game.ui.setHint(this.baseHint); }
  // Mensagem temporária; depois volta à instrução do microjogo.
  say(text, secs) { this.game.ui.setHint(this.fmt(text)); this.sayT = secs; }
  hearts(x, y, n) { for (let i = 0; i < n; i++) this.fx.heart(x - 10 + Math.random() * 20, y + Math.random() * 8, Math.random() < 0.3 ? GOLD : PINK); }
  // Espelha uma posição quando o jogador é a personagem da direita (o cenário é simétrico).
  M(x, w = 0) { return this.meL ? x : SW - x - w; }
  // Posição no painel "debaixo da mesa": u = 0 no meu lado, 1 no lado do par.
  ux(u) { return Math.round(this.meL ? 26 + u * 188 : 214 - u * 188); }

  startCourse() {
    const id = this.courses[this.ci];
    this.def = GAMES[id];
    this.g = {};
    this.def.init(this, this.g);
    if (this.def.card === false) {
      this.state = 'play';
      this.lock = 0.3;
      this.setBase(this.def.hint);
    } else {
      const n = this.courses.slice(0, this.ci + 1).filter((c) => GAMES[c].card !== false).length;
      this.state = 'card';
      this.timer = 1.8;
      this.setBase(`${n}/${this.total} — ${this.def.title}` + (id === 'conversa' && this.tipsy ? ' (com um copo a mais...)' : ''));
      this.sfx('check');
    }
  }

  // Termina o microjogo atual. chem: Química ganha (por omissão 11 se perfeito, 6 se não).
  done(perfect, msg, chem) {
    if (this.state !== 'play') return;
    this.state = 'result';
    this.timer = 1.9;
    this.chem = clamp(this.chem + (chem === undefined ? (perfect ? 11 : 6) : chem), 0, 100);
    if (perfect && this.def.heart !== false) {
      this.got++;
      this.game.ui.setHud(this.got, this.total, this.level.title);
      this.hearts(120, 30, 5);
      this.sfx('win');
    }
    this.setBase(msg);
  }

  update(dt) {
    this.t += dt;
    if (this.paused) return;
    this.fx.update(dt);
    const I = this.game.input, v = this.game.view;
    if (this.lock > 0) this.lock -= dt;
    const pressed = I.actionPressed && this.lock <= 0;
    if (this.sayT > 0) {
      this.sayT -= dt;
      if (this.sayT <= 0 && this.state === 'play') this.game.ui.setHint(this.baseHint);
    }
    this.px = I.pointerX >= 0 ? I.pointerX * v.w - this.offsets(v).ox : null;

    if (this.state === 'card') {
      this.timer -= dt;
      if (this.timer <= 0) { this.state = 'play'; this.lock = 0.2; this.setBase(this.def.hint); }
    } else if (this.state === 'play') {
      this.def.update(this, this.g, dt, I, pressed);
    } else if (this.state === 'result') {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.ci++;
        if (this.ci < this.courses.length) this.startCourse();
        else {
          this.state = 'ending';
          this.timer = 0;
          this.hot = this.chem >= this.level.hot;
          this.game.ui.setLevelMode(true, false);
          this.sfx('fanfare');
          this.setBase(this.hot ? 'E depois do jantar...' : 'Um jantar para repetir. Boa noite!');
        }
      }
    } else if (this.state === 'ending') {
      this.timer += dt;
      const rate = this.hot ? 14 : 4;
      if (Math.floor(this.timer * rate) !== Math.floor((this.timer - dt) * rate)) {
        if (this.hot) this.fx.heart(20 + Math.random() * 200, 60 + Math.random() * 50, Math.random() < 0.3 ? GOLD : PINK);
        else this.hearts(120, 34, 1);
      }
      if (this.timer > (this.hot ? 5 : 3.2)) this.finish();
    }
  }

  finish() {
    this.state = 'done';
    this.game.save.complete(this.level.id, this.got, this.total);
    document.body.classList.remove('minigame');
    this.game.ui.setLevelMode(false, false);
    const text = (this.hot ? this.level.outroHot : this.level.outro) + ` Química: ${Math.round(this.chem)}%`;
    this.game.ui.showComplete(this.index, this.got, this.total, text);
  }

  // ---------- Desenho ----------
  offsets(v) {
    return {
      ox: Math.floor((v.w - SW) / 2),
      oy: v.portrait ? Math.floor((v.h - SH) * 0.36) : Math.max(0, Math.floor((v.h - SH) / 2) + 4),
    };
  }

  img(sprite, x, y, w, h) {
    if (w) this.ctx.drawImage(sprite, this.ox + x, this.oy + y, w, h);
    else this.ctx.drawImage(sprite, this.ox + x, this.oy + y);
  }

  // Ementa à frente da cara.
  menu(c, y) {
    this.R(c.x + 1, y, 30, 25, INK);
    this.R(c.x + 2, y + 1, 28, 23, '#f2e2c0');
    this.R(c.x + 8, y + 4, 16, 2, WINE);
    for (let k = 0; k < 4; k++) this.R(c.x + 6, y + 9 + k * 3, 20 - (k % 2) * 6, 1, '#b9a67e');
  }

  blush(c, a, dx = 0) {
    if (a <= 0.05) return;
    this.R(c.x + c.cheek[0] + dx, 30 + c.cheek[1], 5, 3, `rgba(255,70,110,${(Math.round(a * 5) / 5) * 0.8})`);
  }

  // Pequeno símbolo por cima da cabeça de uma personagem.
  emote(c, kind, dx = 0) {
    const x = c.x + 12 + dx * c.lean, y = c.top - 13, R = this.R;
    const bob = Math.round(Math.sin(this.t * 8) * 1);
    if (kind === 'heart') this.img(this.spr.heart, x, y + bob);
    else if (kind === '!') { R(x + 3, y - 2 + bob, 3, 7, RED); R(x + 3, y + 7 + bob, 3, 2, RED); }
    else if (kind === '?') { R(x + 2, y - 1, 5, 2, GOLD); R(x + 6, y + 1, 2, 3, GOLD); R(x + 4, y + 3, 2, 2, GOLD); R(x + 4, y + 7, 2, 2, GOLD); }
    else if (kind === 'drop') { const sx = c.x + (c.lean > 0 ? 3 : 27); R(sx, c.top + 4, 2, 2, '#8fd0f5'); R(sx - 1, c.top + 6, 4, 3, '#8fd0f5'); }
  }

  icon(kind, x, y) {
    const R = this.R;
    if (kind === 'heart') this.img(this.spr.heart, x, y);
    else if (kind === 'note') { R(x + 5, y, 1, 7, '#6f5bd6'); R(x + 5, y, 4, 2, '#6f5bd6'); R(x + 2, y + 5, 4, 3, '#6f5bd6'); }
    else if (kind === 'plane') { R(x, y + 3, 9, 2, '#3d8fe0'); R(x + 3, y, 2, 8, '#3d8fe0'); R(x, y + 1, 2, 2, '#3d8fe0'); R(x + 8, y + 3, 1, 1, '#ffffff'); }
    else if (kind === 'sun') { R(x + 2, y + 2, 5, 5, '#f0a93e'); R(x + 4, y, 1, 1, '#f0a93e'); R(x + 4, y + 8, 1, 1, '#f0a93e'); R(x, y + 4, 1, 1, '#f0a93e'); R(x + 8, y + 4, 1, 1, '#f0a93e'); R(x + 1, y + 1, 1, 1, '#f0a93e'); R(x + 7, y + 1, 1, 1, '#f0a93e'); R(x + 1, y + 7, 1, 1, '#f0a93e'); R(x + 7, y + 7, 1, 1, '#f0a93e'); }
    else if (kind === 'broken') { this.img(this.spr.heartOff, x, y); R(x + 4, y + 1, 1, 2, '#ffffff'); R(x + 3, y + 3, 1, 2, '#ffffff'); R(x + 4, y + 5, 1, 2, '#ffffff'); }
    else if (kind === 'bone') { R(x + 1, y + 3, 7, 2, '#b9a67e'); R(x, y + 2, 2, 4, '#b9a67e'); R(x + 7, y + 2, 2, 4, '#b9a67e'); R(x + 4, y + 1, 1, 6, RED); R(x + 4, y + 8, 1, 1, RED); }
    else if (kind === 'zzz') { R(x + 1, y + 1, 7, 1, '#6a6f80'); R(x + 1, y + 7, 7, 1, '#6a6f80'); for (let k = 1; k < 6; k++) R(x + 7 - k, y + 1 + k, 1, 1, '#6a6f80'); }
  }

  draw(ctx, v) {
    const { ox, oy } = this.offsets(v);
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(ox + Math.round(x), oy + Math.round(y), w, h); };
    Object.assign(this, { ctx, ox, oy, R });
    const t = this.t, g = this.g, def = this.def;

    this.drawRoom(ctx, v, ox, oy, R, t);

    // Cadeiras e personagens (sentadas atrás da mesa)
    for (const x of [46, 154]) {
      R(x, 44, 40, 3, WOODD);
      R(x, 44, 3, 58, WOODD);
      R(x + 37, 44, 3, 58, WOODD);
      R(x + 3, 47, 34, 22, '#a8324a');
    }
    const pose = def.pose ? def.pose(this, g) : {};
    const joy = this.state === 'ending' && !this.hot ? Math.round(Math.abs(Math.sin(t * 5)) * 2) : 0;
    for (const [c, p] of [[this.me, pose.me || {}], [this.date, pose.date || {}]]) {
      const facing = p.flip ? (c.dir === 'r' ? 'l' : 'r') : c.dir;
      ctx.drawImage(c.frames.stand[facing], ox + c.x + (p.dx || 0) * c.lean, oy + 30 - joy, 32, 48);
    }
    if (def.back) def.back(this, g, R, t);

    // Mesa com toalha e vela
    R(64, 78, 112, 5, CREAM);
    R(66, 83, 108, 19, '#ffffff');
    R(66, 99, 108, 3, '#d8d0c0');
    for (let x = 66; x < 174; x += 12) R(x, 83, 1, 16, '#ece6da');
    if (!(def === GAMES.esparguete || def === GAMES.beijo)) {
      R(116, 76, 8, 2, GOLD);
      R(118, 67, 4, 9, CREAM);
      R(119, 62 + (Math.floor(t * 9) % 2), 2, 5, GOLD);
      R(119, 65, 2, 2, '#ff8a4b');
    }

    // Painel inferior (onde se joga cada microjogo)
    R(18, 108, 204, 36, INK);
    R(20, 110, 200, 32, '#e8d9b8');
    R(22, 112, 196, 28, '#2a2233');
    def.draw(this, g, R, t);

    // Medidor de Química (a marca dourada é o limiar do final alternativo)
    const h = Math.round((58 * this.chem) / 100), hotY = 82 - Math.round((58 * this.level.hot) / 100);
    R(227, 22, 8, 62, INK);
    R(229, 24, 4, 58, SLATE);
    R(229, 82 - h, 4, h, this.chem >= this.level.hot ? RED : PINK);
    R(225, hotY, 12, 1, GOLD);
    this.img(this.chem >= this.level.hot && Math.floor(t * 4) % 2 ? this.spr.heartGold : this.spr.heart, 227, 12);

    // Final alternativo: o ecrã escurece e ficam só os corações
    if ((this.state === 'ending' || this.state === 'done') && this.hot) {
      const a = Math.round(clamp((this.timer - 0.6) / 2.4, 0, 0.95) * 10) / 10;
      ctx.fillStyle = `rgba(14,8,26,${this.state === 'done' ? 0.95 : a})`;
      ctx.fillRect(0, 0, v.w, v.h);
    }
    this.fx.draw(ctx, -ox, -oy);
  }

  drawRoom(ctx, v, ox, oy, R, t) {
    const fy = oy + FLOOR;
    // Parede com papel de parede e lambril de madeira
    ctx.fillStyle = '#6b2a3f';
    ctx.fillRect(0, 0, v.w, fy);
    ctx.fillStyle = '#7d3550';
    for (let y = fy - 34, row = 0; y > -8; y -= 8, row++) {
      for (let x = mod(ox, 16) - 16 + (row % 2) * 8; x < v.w; x += 16) ctx.fillRect(x, y, 2, 2);
    }
    ctx.fillStyle = '#4a2a20';
    ctx.fillRect(0, fy - 26, v.w, 26);
    ctx.fillStyle = '#5f392a';
    ctx.fillRect(0, fy - 26, v.w, 2);
    for (let x = mod(ox, 24) - 24; x < v.w; x += 24) ctx.fillRect(x, fy - 22, 1, 20);
    // Chão de madeira
    ctx.fillStyle = WOOD;
    ctx.fillRect(0, fy, v.w, v.h - fy);
    ctx.fillStyle = '#75492f';
    for (let y = fy, row = 0; y < v.h; y += 10, row++) {
      ctx.fillRect(0, y, v.w, 1);
      for (let x = mod(ox, 48) - 48 + (row % 2) * 24; x < v.w; x += 48) ctx.fillRect(x, y, 1, 10);
    }

    // Janela com a cidade à noite
    R(84, 5, 72, 2, GOLD);
    R(90, 8, 60, 46, '#e8d9b8');
    R(93, 11, 54, 40, '#141a45');
    for (let i = 0; i < 9; i++) if (Math.sin(t * 2 + i * 1.9) > -0.5) R(95 + ((i * 23) % 50), 13 + ((i * 11) % 16), 1, 1, '#ffffff');
    R(134, 15, 6, 6, '#fff6d6');
    const sky = [10, 16, 8, 20, 13, 9, 18, 12];
    for (let i = 0; i < 8; i++) {
      R(93 + i * 7, 51 - sky[i], 7, sky[i], '#0b0e2a');
      if (i % 2 === 0) R(95 + i * 7, 51 - sky[i] + 3, 2, 2, GOLD);
    }
    R(119, 11, 2, 40, '#e8d9b8');
    R(93, 30, 54, 2, '#e8d9b8');
    R(86, 7, 8, 50, '#a8324a');
    R(146, 7, 8, 50, '#a8324a');
    R(88, 7, 2, 50, '#8a2338');
    R(150, 7, 2, 50, '#8a2338');

    // Candeeiros de parede
    for (const x of [28, 196]) {
      R(x - 4, 14, 14, 8, 'rgba(255,220,140,0.22)');
      R(x - 1, 16, 8, 5, '#fff3c4');
      R(x, 21, 6, 7, GOLD);
      R(x + 2, 28, 2, 4, '#b8862e');
    }
  }
}
