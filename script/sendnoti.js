const { call, sleep, textAfter } = require('../lib/helpers');

module.exports.config = {
  name: 'sendnoti',
  version: '1.0.0',
  role: 1,
  hasPrefix: true,
  aliases: ['annonce', 'broadcast'],
  description: 'Envoie une annonce à tous les groupes où le bot est présent',
  usage: 'sendnoti <message>',
  credits: 'Davbot',
  cooldown: 60,
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;
  const text = textAfter(event, 1, { removeMentions: false });
  if (!text) return api.sendMessage('❌ Utilisation : sendnoti <message>', threadID, messageID);

  try {
    const list = await call(api.getThreadList, 100, null, ['INBOX']);
    const groups = (list || []).filter((t) => t.isGroup && t.isSubscribed);
    api.sendMessage(`📤 Envoi de l'annonce à ${groups.length} groupe(s)...`, threadID, messageID);
    let ok = 0;
    for (const g of groups) {
      try { await api.sendMessage(`📢 𝗔𝗡𝗡𝗢𝗡𝗖𝗘\n━━━━━━━━━━\n${text}`, g.threadID); ok++; } catch (e) {}
      await sleep(2000); // pause pour éviter le blocage anti-spam
    }
    api.sendMessage(`✅ Annonce envoyée à ${ok}/${groups.length} groupe(s).`, threadID);
  } catch (e) {
    api.sendMessage("⚠️ Impossible d'envoyer l'annonce.", threadID, messageID);
  }
};
