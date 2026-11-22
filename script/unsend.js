module.exports.config = {
  name: 'unsend',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  aliases: ['supprimer', 'unsent'],
  description: "Supprime un message envoyé par le bot (réponds au message du bot)",
  usage: 'unsend (en répondant à un message du bot)',
  credits: 'Davbot',
  cooldown: 3,
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, messageReply } = event;
  if (!messageReply) return api.sendMessage('❌ Réponds à un message du bot avec : unsend', threadID, messageID);
  if (String(messageReply.senderID) !== String(api.getCurrentUserID())) {
    return api.sendMessage('⚠️ Je ne peux supprimer que mes propres messages.', threadID, messageID);
  }
  api.unsendMessage(messageReply.messageID);
};
