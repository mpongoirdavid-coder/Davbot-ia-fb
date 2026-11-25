const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'data', 'emoji.json');

module.exports.config = {
  name: 'emoji',
  version: '1.0.0',
  role: 2,
  hasPrefix: true,
  aliases: ['emojis', 'reaction'],
  description: 'Le bot répond aux messages composés uniquement d\'emojis (on/off par groupe)',
  usage: 'emoji on | off',
  credits: 'Davbot',
  cooldown: 3,
};

// Chaque groupe : emojis déclencheurs + réponses (une au hasard)
const GROUPS = [
  { e: '😀😃😄😁😊☺️😌🙂😇', r: ['Quelle bonne humeur, ça fait plaisir à voir !', 'Ton sourire est contagieux, continue comme ça !', 'Content de te voir aussi joyeux(se) !'] },
  { e: '😆😂🤣', r: ['Haha, tu me fais rire aussi !', 'Raconte-moi, qu\'est-ce qui est si drôle ?', 'Je suis mort(e) de rire avec toi !'] },
  { e: '🙂‍↕️', r: ['Oui, on est d\'accord !', 'Ça se confirme : c\'est un grand oui !'] },
  { e: '🙂‍↔️', r: ['Non ? D\'accord, je note.', 'Un petit non bien net, reçu !'] },
  { e: '😗😙😚😘🥰😍🤩', r: ['Oh, que d\'amour ! Je t\'envoie des câlins aussi.', 'Tu me fais fondre, merci !', 'Tant de tendresse, c\'est adorable !'] },
  { e: '😉😏', r: ['Un petit clin d\'œil... Je vois ce que tu fais !', 'Hmm, tu prépares quelque chose, toi.', 'Je te vois venir !'] },
  { e: '🥳', r: ['C\'est la fête ! On célèbre quoi ?', 'Confettis pour tout le monde !'] },
  { e: '😎🤓🥸🤠🤑', r: ['Quel style, respect !', 'Trop classe, vraiment.', 'On dirait quelqu\'un qui a tout compris !'] },
  { e: '🫠🙃🤪🥴😛😝😜🤤😋', r: ['Tu es dans une ambiance bien déjantée, j\'adore !', 'Ça sent la bonne rigolade par ici.', 'Un peu de folie, ça fait du bien !'] },
  { e: '😭😢😥😞😔☹️🙁😟', r: ['Oh non... Je suis là si tu veux en parler.', 'Courage, ça va aller. Je suis avec toi.', 'Prends un moment pour toi, tout passe.'] },
  { e: '🥲🥹🥺', r: ['Aww, c\'est touchant...', 'Je sens l\'émotion d\'ici, viens, câlin virtuel.', 'Tu as le cœur tendre, c\'est beau.'] },
  { e: '🫤😕😖😣😩😫', r: ['Journée compliquée ? Respire un grand coup.', 'Je comprends, c\'est pas toujours facile.', 'Dis-moi ce qui ne va pas, je t\'écoute.'] },
  { e: '😑😐😶🫥🤐🫡', r: ['Tu es bien silencieux(se)... tout va bien ?', 'Le silence en dit long, parfois.', 'À vos ordres !'] },
  { e: '🤫🤭', r: ['Chut, ça reste entre nous !', 'Hihi, un petit secret ?'] },
  { e: '🥱🙄😒😮‍💨', r: ['Un peu d\'ennui ? Pose-moi une question avec « ai » !', 'Je sens la lassitude... une pause ?', 'Courage, ça va passer !'] },
  { e: '🤨🧐', r: ['Tu as des doutes ? Explique-moi.', 'Hmm, un air suspicieux... je note tout !'] },
  { e: '🤗', r: ['Câlin collectif ! 🤗', 'Viens là, un gros câlin pour toi !'] },
  { e: '😤😠😡🤬', r: ['Respire, ça va aller. Qu\'est-ce qui se passe ?', 'Calme-toi un peu, ça ne vaut pas la peine de s\'énerver.', 'Je sens la colère... un verre d\'eau peut-être ?'] },
  { e: '😬😳🫣', r: ['Oups, situation un peu gênante !', 'Pas de panique, ça arrive à tout le monde.', 'Haha, la gêne... on fait semblant de rien !'] },
  { e: '😰😨😧😱🫨😵', r: ['N\'aie pas peur, je suis là !', 'Respire, tout va bien se passer.', 'Wow, quelle frayeur ! Que s\'est-il passé ?'] },
  { e: '😮😯🤯', r: ['Ça t\'a surpris, hein ?', 'Wow, je suis bouche bée moi aussi !', 'Incroyable, non ?'] },
  { e: '🥶', r: ['Brrr, il fait froid ! Couvre-toi bien.', 'Un petit thé chaud, ça te dirait ?'] },
  { e: '🥵', r: ['Il fait chaud ! Pense à boire de l\'eau.', 'Ouf, quelle chaleur... un peu d\'ombre ?'] },
];

// Liste complète fournie : sert de garde-fou (tout y est couvert par un groupe)
const norm = (s) => String(s).replace(/\uFE0F/g, '');
const seg = (s) => (typeof Intl !== 'undefined' && Intl.Segmenter
  ? [...new Intl.Segmenter('fr', { granularity: 'grapheme' }).segment(s)].map((x) => x.segment)
  : Array.from(s));

const MAP = new Map();
for (const g of GROUPS) for (const e of seg(g.e)) MAP.set(norm(e), g.r);

const lastReply = new Map();

function isOn(threadID) {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8'))[threadID] !== false; } catch (e) { return true; }
}
function setOn(threadID, value) {
  let data = {};
  try { data = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) {}
  data[threadID] = value;
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(data));
}

module.exports.handleEvent = async function ({ api, event }) {
  try {
    if (!['message', 'message_reply'].includes(event.type) || !event.body) return;
    if (String(event.senderID) === String(api.getCurrentUserID())) return; // selfListen est actif
    const body = event.body.trim();
    if (!body || body.length > 40) return;
    const parts = seg(body.replace(/\s+/g, ''));
    if (!parts.length || parts.length > 8) return;
    const keys = parts.map((p) => norm(p));
    if (!keys.every((k) => MAP.has(k))) return; // uniquement des emojis de la liste
    if (!isOn(event.threadID)) return;
    const now = Date.now();
    if (now - (lastReply.get(event.threadID) || 0) < 4000) return; // anti-spam
    lastReply.set(event.threadID, now);
    const replies = MAP.get(keys[0]);
    const text = replies[Math.floor(Math.random() * replies.length)];
    api.sendMessage(`${parts[0]} ${text}`, event.threadID, event.messageID);
  } catch (e) {
    console.error('Erreur emoji :', e.message);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const a = (args[0] || '').toLowerCase();
  const { threadID, messageID } = event;
  if (a === 'on') { setOn(threadID, true); return api.sendMessage('😀 Réponses aux emojis activées dans ce groupe.', threadID, messageID); }
  if (a === 'off') { setOn(threadID, false); return api.sendMessage('😶 Réponses aux emojis désactivées dans ce groupe.', threadID, messageID); }
  api.sendMessage(`😀 Réponses aux emojis : ${isOn(threadID) ? 'activées' : 'désactivées'}.\nUtilisation : emoji on | off`, threadID, messageID);
};
