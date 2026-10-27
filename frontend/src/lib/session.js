const KEY = 'omnigene-session';
let cached = null;

export function sessionId() {
  if (cached) return cached;
  try { cached = localStorage.getItem(KEY); } catch { /* storage blocked */ }
  if (!cached) {
    cached = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
    try { localStorage.setItem(KEY, cached); } catch { /* storage blocked */ }
  }
  return cached;
}
