const { call, sleep } = require('../lib/helpers');

module.exports.config = {
  name: 'accept',
  version: '1.0.0',
  role: 1,
  hasPrefix: true,
  aliases: ['accepter', 'invitation', 'invitations'],
  description: "Accepte les invitations de groupe en attente (et les demandes de messages)",
  usage: 'accept [groupes|messages|tout|<threadID>]',
  credits: 'Davbot',
  cooldown: 10,
};

const WELCOME = "👋 Merci pour l'invitation ! Je suis Davbot.\nÉcris « ai » suivi de ta question pour me parler, ou utilise la commande help pour voir tout ce que je sais faire.";

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const reply = (m) => api.sendMessage(m, threadID, messageID);
  const mode = (args[0] || 'groupes').toLowerCase();

  try {
    let pending = [];

    if (/^\d{6,}$/.test(mode)) {
      pending = [{ threadID: mode, threadName: `Conversation ${mode}`, isGroup: true }];
    } else {
      const seen = new Set();
      for (const tag of ['PENDING', 'OTHER']) {
        let list = [];
        try { list = await call(api.getThreadList, 50, null, [tag]); } catch (e) { /* on continue avec l'autre boîte */ }
        for (const t of list || []) {
          if (seen.has(t.threadID)) continue;
          seen.add(t.threadID);
          if (mode === 'tout' || mode === 'all') pending.push(t);
          else if (mode === 'messages' && !t.isGroup) pending.push(t);
          else if (mode !== 'messages' && t.isGroup) pending.push(t);
        }
      }
    }

    if (!pending.length) return reply('📭 Aucune invitation en attente.');

    await call(api.handleMessageRequest, pending.map((t) => t.threadID), true);

    for (const t of pending) {
      try { await api.sendMessage(WELCOME, t.threadID); } catch (e) {}
      await sleep(1500);
    }

    const names = pending.map((t, i) => `${i + 1}. ${t.threadName || 'Sans nom'} (${t.threadID})`).join('\n');
    return reply(`✅ ${pending.length} invitation(s) acceptée(s) :\n${names}`.slice(0, 19000));
  } catch (error) {
    console.error('Erreur accept :', error);
    return reply("⚠️ Impossible d'accepter les invitations pour le moment.");
  }
};
