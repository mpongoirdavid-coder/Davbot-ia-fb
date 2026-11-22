const { call } = require('../lib/helpers');

module.exports.config = {
  name: 'listbox',
  version: '1.0.0',
  role: 1,
  hasPrefix: true,
  aliases: ['allbox', 'groupes'],
  description: 'Liste les groupes où le bot est présent (nom, ID, membres)',
  usage: 'listbox',
  credits: 'Davbot',
  cooldown: 10,
};

module.exports.run = async function ({ api, event }) {
  try {
    const list = await call(api.getThreadList, 100, null, ['INBOX']);
    const groups = (list || []).filter((t) => t.isGroup && t.isSubscribed);
    if (!groups.length) return api.sendMessage('📭 Aucun groupe trouvé.', event.threadID, event.messageID);
    const lines = groups.map((g, i) => `${i + 1}. ${g.threadName || 'Sans nom'}\n   🆔 ${g.threadID} — 👥 ${(g.participantIDs || []).length}`);
    api.sendMessage(`📂 𝗚𝗥𝗢𝗨𝗣𝗘𝗦 (${groups.length})\n━━━━━━━━━━\n${lines.join('\n')}`.slice(0, 19000), event.threadID, event.messageID);
  } catch (e) {
    api.sendMessage('⚠️ Impossible de récupérer la liste des groupes.', event.threadID, event.messageID);
  }
};
