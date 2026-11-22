module.exports.config = {
  name: 'tid',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  aliases: ['threadid'],
  description: "Affiche l'ID de la conversation (groupe) actuelle",
  usage: 'tid',
  credits: 'Davbot',
  cooldown: 3,
};

module.exports.run = async function ({ api, event }) {
  api.sendMessage(`🆔 ID de la conversation : ${event.threadID}`, event.threadID, event.messageID);
};
