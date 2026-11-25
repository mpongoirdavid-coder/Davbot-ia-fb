const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'data', 'welcome.json');

module.exports.config = {
  name: 'welcome',
  version: '1.0.0',
  role: 2,
  hasPrefix: true,
  aliases: ['bienvenue'],
  description: 'Message de bienvenue / au revoir automatique dans le groupe (on/off)',
  usage: 'welcome on | off',
  credits: 'Davbot',
  cooldown: 3,
};

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
    if (event.type !== 'event' || !isOn(event.threadID)) return;
    const botID = String(api.getCurrentUserID());

    if (event.logMessageType === 'log:subscribe') {
      const added = ((event.logMessageData && event.logMessageData.addedParticipants) || [])
        .filter((p) => String(p.userFbId) !== botID);
      if (!added.length) return;
      let body = '🎉 Bienvenue ';
      const mentions = [];
      added.forEach((p, i) => {
        const name = p.fullName || 'nouveau membre';
        mentions.push({ tag: name, id: String(p.userFbId), fromIndex: body.length });
        body += name + (i < added.length - 1 ? ', ' : '');
      });
      body += ' dans le groupe ! 🤗\nTape help pour voir ce que je sais faire.';
      api.sendMessage({ body, mentions }, event.threadID);
    }

    if (event.logMessageType === 'log:unsubscribe') {
      const id = String(event.logMessageData && event.logMessageData.leftParticipantFbId);
      if (!id || id === botID) return;
      let name = 'Un membre';
      try { const u = await api.getUserInfo(id); name = (u[id] && u[id].name) || name; } catch (e) {}
      api.sendMessage(`👋 ${name} a quitté le groupe. À bientôt !`, event.threadID);
    }
  } catch (e) {
    console.error('Erreur welcome :', e.message);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const a = (args[0] || '').toLowerCase();
  const { threadID, messageID } = event;
  if (a === 'on') { setOn(threadID, true); return api.sendMessage('🎉 Messages de bienvenue activés.', threadID, messageID); }
  if (a === 'off') { setOn(threadID, false); return api.sendMessage('🔕 Messages de bienvenue désactivés.', threadID, messageID); }
  api.sendMessage(`🎉 Bienvenue automatique : ${isOn(threadID) ? 'activé' : 'désactivé'}.\nUtilisation : welcome on | off`, threadID, messageID);
};
