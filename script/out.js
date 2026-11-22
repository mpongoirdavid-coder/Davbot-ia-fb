module.exports.config = {
  name: 'out',
  version: '1.0.0',
  role: 1,
  hasPrefix: true,
  aliases: ['quitter', 'leave'],
  description: 'Le bot quitte le groupe actuel (ou celui dont tu donnes l\'ID)',
  usage: 'out [threadID]',
  credits: 'Davbot',
  cooldown: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const target = /^\d{6,}$/.test(args[0] || '') ? args[0] : event.threadID;
  const botID = String(api.getCurrentUserID());
  try {
    await api.sendMessage('👋 Je quitte ce groupe. À bientôt !', target);
    api.removeUserFromGroup(botID, target, (err) => {
      if (err) api.sendMessage('⚠️ Impossible de quitter ce groupe.', event.threadID, event.messageID);
    });
  } catch (e) {
    api.sendMessage('⚠️ Impossible de quitter ce groupe.', event.threadID, event.messageID);
  }
};
