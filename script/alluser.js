module.exports.config = {
  name: 'alluser',
  version: '1.0.0',
  role: 2,
  hasPrefix: true,
  aliases: ['tagall', 'everyone'],
  description: 'Mentionne tous les membres du groupe',
  usage: 'alluser [message]',
  credits: 'Davbot',
  cooldown: 30,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  try {
    const info = await api.getThreadInfo(threadID);
    const ids = (info.participantIDs || []).filter((id) => String(id) !== String(api.getCurrentUserID())).slice(0, 250);
    const users = await api.getUserInfo(ids);
    let body = (args.length ? args.join(' ') : '📢 Attention tout le monde !') + '\n';
    const mentions = [];
    for (const id of ids) {
      const tag = `@${(users[id] && users[id].name) || 'membre'}`;
      mentions.push({ tag, id, fromIndex: body.length });
      body += tag + ' ';
    }
    api.sendMessage({ body, mentions }, threadID, messageID);
  } catch (e) {
    console.error('Erreur alluser :', e);
    api.sendMessage('⚠️ Impossible de mentionner les membres.', threadID, messageID);
  }
};
