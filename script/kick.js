const { call, getTargets } = require('../lib/helpers');

module.exports.config = {
  name: 'kick',
  version: '1.0.0',
  role: 2,
  hasPrefix: true,
  aliases: ['expulser'],
  description: 'Retire un ou plusieurs membres du groupe',
  usage: 'kick @membre [@membre...] (ou en répondant à son message)',
  credits: 'Davbot',
  cooldown: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const botID = String(api.getCurrentUserID());
  const info = await api.getThreadInfo(threadID);

  if (!(info.adminIDs || []).some((a) => String(a.id) === botID)) {
    return api.sendMessage('⚠️ Je dois être admin du groupe pour retirer des membres.', threadID, messageID);
  }
  const targets = getTargets(event, args).filter((id) => id !== botID && id !== String(senderID));
  if (!targets.length) {
    return api.sendMessage('❌ Mentionne la personne à retirer (ou réponds à son message).', threadID, messageID);
  }

  let ok = 0, ko = 0;
  for (const id of targets) {
    try { await call(api.removeUserFromGroup, id, threadID); ok++; } catch (e) { ko++; }
  }
  api.sendMessage(`👢 Terminé : ${ok} membre(s) retiré(s)${ko ? `, ${ko} échec(s) (admin ou déjà parti ?)` : ''}.`, threadID, messageID);
};
