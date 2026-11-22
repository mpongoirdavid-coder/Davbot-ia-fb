// Fonctions utilitaires partagées par les commandes
function call(fn, ...args) {
  return new Promise((resolve, reject) => {
    fn(...args, (err, data) => (err ? reject(err) : resolve(data)));
  });
}

function chunk(text, size = 1900) {
  const parts = [];
  let rest = String(text || '');
  while (rest.length > size) {
    let cut = rest.lastIndexOf('\n', size);
    if (cut < size * 0.5) cut = rest.lastIndexOf(' ', size);
    if (cut < size * 0.5) cut = size;
    parts.push(rest.slice(0, cut));
    rest = rest.slice(cut).trimStart();
  }
  if (rest) parts.push(rest);
  return parts;
}

function formatDuration(totalSeconds) {
  let s = Math.floor(totalSeconds);
  const d = Math.floor(s / 86400); s %= 86400;
  const h = Math.floor(s / 3600); s %= 3600;
  const m = Math.floor(s / 60); s %= 60;
  return [d && `${d}j`, (d || h) && `${h}h`, (d || h || m) && `${m}m`, `${s}s`].filter(Boolean).join(' ');
}

// IDs ciblés : mentions + auteur du message cité + IDs numériques écrits dans la commande
function getTargets(event, args = []) {
  const ids = new Set(Object.keys(event.mentions || {}));
  if (event.messageReply && event.messageReply.senderID) ids.add(String(event.messageReply.senderID));
  for (const a of args) if (/^\d{6,}$/.test(a)) ids.add(a);
  return [...ids];
}

// Texte de la commande sans les N premiers mots, sans mentions ni IDs
function textAfter(event, skip, { removeMentions = true } = {}) {
  let text = String(event.body || '').trim();
  for (let i = 0; i < skip; i++) text = text.replace(/^\S+\s*/, '');
  if (removeMentions) {
    for (const name of Object.values(event.mentions || {})) text = text.split(name).join('');
  }
  return text.replace(/\s+/g, ' ').trim();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = { call, chunk, formatDuration, getTargets, textAfter, sleep };
