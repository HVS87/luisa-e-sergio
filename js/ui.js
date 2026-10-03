// Interface (menus, HUD e painéis) feita em HTML por cima do canvas.
import { ANOS_CASADOS } from './config.js';
import { LEVELS, levelLabel } from './levels/index.js';
import { PEOPLE, partnerOf } from './sprites.js';

const $ = (sel) => document.querySelector(sel);
const HEART = '<svg class="ico-heart" aria-hidden="true"><use href="#heart"/></svg>';

export class UI {
  constructor(game) {
    this.game = game;
    this.screens = [...document.querySelectorAll('.screen')];
    this.current = null;
    this.kb = false;   // true quando a última interação foi por teclado

    document.addEventListener('pointerdown', () => { this.kb = false; game.audio.unlock(); }, true);
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn || btn.disabled) return;
      game.audio.unlock();
      game.audio.play('click');
      this.act(btn.dataset.action, btn);
    });
    document.addEventListener('keydown', (e) => this.onKey(e));

    const fs = $('#btn-fullscreen');
    if (document.fullscreenEnabled && document.documentElement.requestFullscreen) fs.hidden = false;

    this.refreshMenu();
  }

  // Mostra um ecrã pelo nome (ou nenhum, com null).
  show(name) {
    this.current = name;
    for (const s of this.screens) s.classList.toggle('active', s.dataset.screen === name);
    const scroller = name && this.active().querySelector('.scroll');
    if (scroller) scroller.scrollTop = 0;
    if (name && this.kb) this.focusFirst();
    else if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  active() { return this.screens.find((s) => s.classList.contains('active')); }

  buttons() {
    const s = this.active();
    return s ? [...s.querySelectorAll('.btn')].filter((b) => !b.disabled && !b.hidden && b.offsetParent !== null && getComputedStyle(b).visibility !== 'hidden') : [];
  }

  focusFirst() {
    const s = this.active();
    if (!s) return;
    const b = s.querySelector('.btn-primary:not([disabled]):not([hidden])') || this.buttons()[0];
    if (b) b.focus();
  }

  // inLevel: mostra o HUD · playing: mostra os controlos táteis e capta as teclas de jogo
  setLevelMode(inLevel, playing) {
    if (!inLevel) this.setHint('');
    document.body.classList.toggle('in-level', inLevel);
    document.body.classList.toggle('playing', playing);
  }

  setHud(got, total, title) {
    $('#hud-hearts').textContent = got + '/' + total;
    $('#hud-title').textContent = title;
  }

  // Linha de instruções por baixo do HUD (usada pelos minijogos).
  setHint(text) { $('#hint').textContent = text || ''; }

  // Substitui {eu}, {par}, {ao_par}... pelos nomes certos conforme a personagem escolhida.
  fmt(text) {
    const me = PEOPLE[this.game.save.data.character];
    const par = PEOPLE[partnerOf(this.game.save.data.character)];
    return text
      .replace(/\{eu\}/g, me.art + ' ' + me.nome)
      .replace(/\{Eu\}/g, me.art.toUpperCase() + ' ' + me.nome)
      .replace(/\{par\}/g, par.art + ' ' + par.nome)
      .replace(/\{Par\}/g, par.art.toUpperCase() + ' ' + par.nome)
      .replace(/\{ao_par\}/g, par.ao + ' ' + par.nome);
  }

  refreshMenu() {
    const d = this.game.save.data;
    const started = Object.keys(d.done).length > 0;
    $('#btn-play').textContent = started ? 'Continuar' : 'Jogar';
    $('#btn-character').textContent = 'Jogo com: ' + PEOPLE[d.character].nome;
    const som = 'Som: ' + (d.muted ? 'Não' : 'Sim');
    $('#btn-sound').textContent = som;
    $('#btn-sound-pause').textContent = som;
  }

  buildLevels() {
    const box = $('#level-list');
    box.textContent = '';
    LEVELS.forEach((L, i) => {
      const open = this.game.isUnlocked(i);
      const rec = this.game.save.data.done[L.id];
      const b = document.createElement('button');
      b.className = 'btn level-btn' + (L.bonus ? ' bonus' : '') + (open ? '' : ' locked');
      b.disabled = !open;
      b.dataset.action = 'level';
      b.dataset.index = i;
      const num = document.createElement('span');
      num.className = 'lv-num';
      num.textContent = levelLabel(i);
      const name = document.createElement('span');
      name.className = 'lv-name';
      name.textContent = open ? L.title : '???';
      const score = document.createElement('span');
      score.className = 'lv-score';
      if (rec) score.innerHTML = HEART + ' ' + rec.hearts + '/' + rec.total;
      b.append(num, name, score);
      box.append(b);
    });
  }

  showStory(index) {
    const L = LEVELS[index];
    $('#story-kicker').textContent = levelLabel(index);
    $('#story-title').textContent = L.title;
    $('#story-text').textContent = this.fmt(L.story || '');
    $('#story-help').textContent = this.fmt(L.help || '');
    $('#story-help').hidden = !L.help;
    this.setLevelMode(false, false);
    this.show('story');
  }

  showComplete(index, got, total, text) {
    const L = LEVELS[index];
    $('#complete-title').textContent = this.fmt(text || L.outro || L.title);
    $('#complete-hearts').textContent = got + '/' + total;
    $('#complete-perfect').hidden = !(total > 0 && got === total);
    this.show('complete');
  }

  showVictory(variant) {
    const family = variant === 'family';
    $('#v-title').textContent = family ? 'Família completa!' : 'Parabéns!';
    $('#v-line').textContent = family
      ? 'Luísa, Sérgio, Xavier e a pequena Luísa'
      : 'pelos ' + ANOS_CASADOS + ' anos de Casados';
    $('#v-bonus').hidden = family;
    this.setLevelMode(false, false);
    // Deixa o fogo de artifício brilhar um pouco antes de mostrar os botões.
    const actions = $('.victory-actions');
    actions.classList.remove('ready');
    clearTimeout(this.victoryTimer);
    this.victoryTimer = setTimeout(() => {
      actions.classList.add('ready');
      if (this.kb && this.current === 'victory') this.focusFirst();
    }, 2500);
    this.show('victory');
  }

  act(action, btn) {
    const g = this.game, save = g.save;
    switch (action) {
      case 'play': {
        const i = g.nextLevel();
        if (i < 0) { this.buildLevels(); this.show('levels'); } else g.startLevel(i);
        break;
      }
      case 'levels': this.buildLevels(); this.show('levels'); break;
      case 'howto': this.show('howto'); break;
      case 'back': this.show('menu'); break;
      case 'level': g.startLevel(Number(btn.dataset.index)); break;
      case 'character':
        save.data.character = partnerOf(save.data.character);
        save.write();
        this.refreshMenu();
        break;
      case 'sound':
        save.data.muted = !save.data.muted;
        save.write();
        g.audio.setMuted(save.data.muted);
        g.audio.play('click');
        this.refreshMenu();
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen().catch(() => {});
        break;
      case 'start': this.show(null); g.scene.begin(); break;
      case 'pause':
      case 'resume': if (g.scene.togglePause) g.scene.togglePause(); break;
      case 'restart':
      case 'retry': this.show(null); g.scene.restart(); break;
      case 'next': g.afterLevel(g.scene.index); break;
      case 'bonus': g.startLevel(LEVELS.findIndex((L) => L.bonus)); break;
      case 'menu': g.goMenu(); break;
    }
  }

  onKey(e) {
    this.kb = true;
    this.game.audio.unlock();
    if (document.body.classList.contains('playing') || !this.current) return;
    const list = this.buttons();
    if (!list.length) return;
    const i = list.indexOf(document.activeElement);
    if (e.code === 'ArrowDown' || e.code === 'ArrowRight') {
      list[(i + 1) % list.length].focus();
      e.preventDefault();
    } else if (e.code === 'ArrowUp' || e.code === 'ArrowLeft') {
      list[(i - 1 + list.length) % list.length].focus();
      e.preventDefault();
    } else if (e.code === 'Enter' && i < 0) {
      this.focusFirst();
      if (document.activeElement && document.activeElement.click) document.activeElement.click();
      e.preventDefault();
    }
  }

  // Tecla Esc: pausa durante o jogo; "voltar" nos menus.
  escape() {
    const scene = this.game.scene;
    if (document.body.classList.contains('playing') || this.current === 'pause') {
      if (scene.togglePause) scene.togglePause();
      return;
    }
    const s = this.active();
    const back = s && s.querySelector('[data-back]');
    if (back && !back.hidden) back.click();
  }
}
