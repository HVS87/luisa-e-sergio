// Progresso guardado no próprio dispositivo (localStorage).
import { SAVE_KEY } from './config.js';

const defaults = () => ({ character: 'luisa', muted: false, done: {} });

export const save = {
  data: defaults(),

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) this.data = Object.assign(defaults(), JSON.parse(raw));
    } catch (err) { /* modo privado ou armazenamento bloqueado */ }
    if (this.data.character !== 'sergio') this.data.character = 'luisa';
    if (!this.data.done || typeof this.data.done !== 'object') this.data.done = {};
  },

  write() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (err) { /* ignora */ }
  },

  // Regista um nível concluído, mantendo o melhor resultado de corações.
  complete(id, hearts, total) {
    const prev = this.data.done[id];
    this.data.done[id] = { hearts: Math.max(hearts, prev ? prev.hearts : 0), total };
    this.write();
  },

  isDone(id) { return !!this.data.done[id]; },
};
