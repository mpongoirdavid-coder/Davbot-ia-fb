const axios = require('axios');
const { chunk } = require('../lib/helpers');

// ====== CONFIGURATION ======
const API_URL = 'https://davbot.pages.dev/api/intelligence-artificielle/ask';
const KNOWLEDGE = "Tu t'appelles Davbot, un assistant IA qui répond aux messages sur Messenger.";
const RULES = "Réponds clairement et poliment, dans la langue de l'utilisateur (français par défaut). Reste concis.";
const MAX_HISTORY = 10;            // nombre de messages gardés en mémoire par conversation
const HISTORY_TTL = 30 * 60 * 1000; // la mémoire est oubliée après 30 min d'inactivité
// ===========================

const histories = new Map();
const lastCall = new Map();
const TRIGGER = /^\s*(ai|ia|bot|davbot|chatgpt|gpt|gemini|copilot|claude|deepseek|grok|meta)\s*[,:;!?.]+\s*([\s\S]*)$/i; // ex : "Davbot, salut"

module.exports.config = {
  name: 'ai',
  version: '1.0.0',
  role: 0,
  hasPrefix: false,
  aliases: ['ia', 'bot', 'davbot', 'chatgpt', 'gpt', 'gemini', 'copilot', 'claude', 'deepseek', 'grok'],
  description: "Pose une question à l'IA Davbot (répond aussi aux images). Sans préfixe : ai / ia / bot / davbot / chatgpt / gemini...",
  usage: 'ai <question> | ai reset (efface la mémoire) | répondre à une photo avec : ai <question>',
  credits: 'Davbot',
  cooldown: 3,
};

function getHistory(key) {
  const h = histories.get(key);
  if (!h || Date.now() - h.time > HISTORY_TTL) return [];
  return h.messages;
}

function saveHistory(key, user, assistant) {
  const messages = [...getHistory(key), { role: 'user', content: user }, { role: 'assistant', content: assistant }];
  histories.set(key, { time: Date.now(), messages: messages.slice(-MAX_HISTORY) });
}

function findPhoto(event) {
  const list = [...(event.attachments || []), ...((event.messageReply && event.messageReply.attachments) || [])];
  return list.find((a) => a && (a.type === 'photo' || a.type === 'animated_image' || a.type === 'sticker') && (a.url || a.largePreviewUrl || a.previewUrl));
}

async function toDataUri(att) {
  const url = att.url || att.largePreviewUrl || att.previewUrl;
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000, maxContentLength: 8 * 1024 * 1024 });
  const mime = String(res.headers['content-type'] || 'image/jpeg').split(';')[0];
  return `data:${mime};base64,${Buffer.from(res.data).toString('base64')}`;
}

function extractText(data) {
  if (data == null) return null;
  if (typeof data === 'string') return data.trim() || null;
  for (const key of ['response', 'reply', 'answer', 'message', 'result', 'text', 'content', 'output']) {
    if (typeof data[key] === 'string' && data[key].trim()) return data[key].trim();
  }
  if (data.data) return extractText(data.data);
  if (data.choices && data.choices[0] && data.choices[0].message) return extractText(data.choices[0].message.content);
  return null;
}

async function handle(api, event, rawText) {
  const { threadID, messageID, senderID } = event;
  const text = String(rawText || '').trim();
  const key = `${threadID}_${senderID}`;

  if (/^(reset|clear|nouveau|effacer)$/i.test(text)) {
    histories.delete(key);
    return api.sendMessage('🧹 Conversation réinitialisée.', threadID, messageID);
  }

  const photo = findPhoto(event);
  if (!text && !photo) {
    return api.sendMessage("🤖 Pose-moi une question ! Exemple : ai c'est quoi la photosynthèse ?\nTu peux aussi répondre à une photo avec : ai décris cette image", threadID, messageID);
  }

  let message = text || 'Analyse cette image.';
  const quoted = event.messageReply && event.messageReply.body;
  if (quoted && !photo) message += `\n\n[Message cité : ${quoted}]`;

  try { api.sendTypingIndicator(threadID); } catch (e) {}

  const payload = {
    message,
    knowledge: KNOWLEDGE,
    rules: RULES,
    history: getHistory(key),
  };

  try {
    if (photo) payload.image = await toDataUri(photo);
    const res = await axios.post(API_URL, payload, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      timeout: 60000,
      validateStatus: () => true,
    });
    const answer = extractText(res.data);
    if (res.status >= 400 || !answer) {
      console.error('Erreur API IA :', res.status, JSON.stringify(res.data).slice(0, 300));
      return api.sendMessage(`⚠️ L'IA n'a pas pu répondre (code ${res.status}). Réessaie dans un instant.`, threadID, messageID);
    }
    saveHistory(key, message, answer);
    const parts = chunk(answer);
    for (let i = 0; i < parts.length; i++) {
      const body = i === 0 ? `🤖 𝗗𝗮𝘃𝗯𝗼𝘁\n━━━━━━━━━━\n${parts[i]}` : parts[i];
      await api.sendMessage(body, threadID, i === 0 ? messageID : undefined);
    }
  } catch (error) {
    console.error('Erreur commande ai :', error.message);
    api.sendMessage("⚠️ Impossible de joindre l'IA pour le moment. Réessaie plus tard.", threadID, messageID);
  }
}

module.exports.run = async function ({ api, event }) {
  // texte original (casse et retours à la ligne conservés) sans le 1er mot
  const text = String(event.body || '').replace(/^\s*\S+\s*/, '');
  await handle(api, event, text);
};

// Gère les formes avec ponctuation : "Davbot, ...", "ia: ...", "bot ? ..."
module.exports.handleEvent = async function ({ api, event, blacklist = [] }) {
  if (!['message', 'message_reply'].includes(event.type) || !event.body) return;
  if (String(event.senderID) === String(api.getCurrentUserID())) return;
  const m = event.body.match(TRIGGER);
  if (!m || blacklist.includes(event.senderID)) return;
  const now = Date.now();
  if (now - (lastCall.get(event.senderID) || 0) < 3000) return;
  lastCall.set(event.senderID, now);
  await handle(api, event, m[2]);
};
