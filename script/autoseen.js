const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'data', 'autoseen.json');

function isOn() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')).enabled !== false; } catch (e) { return true; }
}
function setOn(enabled) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify({ enabled }));
}

module.exports.config = {
  name: 'autoseen',
  version: '1.0.0',
  role: 1,
  hasPrefix: true,
  aliases: ['seen', 'vu'],
  description: 'Active ou désactive le marquage automatique des messages comme « vus »',
  usage: 'autoseen on | off',
  credits: 'Davbot',
  cooldown: 3,
};

module.exports.handleEvent = async function ({ api, event }) {
  if (event.type !== 'message' && event.type !== 'message_reply') return;
  if (isOn()) api.markAsReadAll(() => {});
};

module.exports.run = async function ({ api, event, args }) {
  const a = (args[0] || '').toLowerCase();
  if (a === 'on') { setOn(true); return api.sendMessage('👁️ Autoseen activé.', event.threadID, event.messageID); }
  if (a === 'off') { setOn(false); return api.sendMessage('🙈 Autoseen désactivé.', event.threadID, event.messageID); }
  api.sendMessage(`👁️ Autoseen est actuellement ${isOn() ? 'activé' : 'désactivé'}.\nUtilisation : autoseen on | off`, event.threadID, event.messageID);
};
