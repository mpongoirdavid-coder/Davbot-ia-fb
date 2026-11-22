const { getTargets } = require('../lib/helpers');

module.exports.config = {
  name: 'uid',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  aliases: ['id'],
  description: "Affiche l'ID Facebook de toi, d'une personne mentionnée ou de l'auteur du message cité",
  usage: 'uid [@mention] (ou en répondant à un message)',
  credits: 'Davbot',
  cooldown: 3,
};

module.exports.run = async function ({ api, event }) {
  const targets = getTargets(event);
  const ids = targets.length ? targets : [String(event.senderID)];
  const users = await api.getUserInfo(ids).catch(() => ({}));
  const lines = ids.map((id) => `${(users[id] && users[id].name) || 'Utilisateur'} : ${id}`);
  api.sendMessage(`🆔 ${lines.join('\n🆔 ')}`, event.threadID, event.messageID);
};
