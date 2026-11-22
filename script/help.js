module.exports.config = {
  name: 'help',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  aliases: ['aide', 'menu'],
  description: 'Liste des commandes ou détails sur une commande',
  usage: 'help | help <commande>',
  credits: 'Davbot',
  cooldown: 3,
};

const ROLES = ['Tout le monde', 'Admin du bot', 'Admin du groupe', 'Super admin'];

module.exports.run = async function ({ api, event, args, enableCommands, Utils, prefix }) {
  const { threadID, messageID } = event;
  const enabled = (enableCommands && enableCommands[0] && enableCommands[0].commands) || [];
  const all = [...Utils.commands.values()].filter((c) => !enabled.length || enabled.includes(c.name));
  const input = (args[0] || '').toLowerCase();

  if (input) {
    const cmd = all.find((c) => c.name === input || (c.aliases || []).includes(input));
    if (!cmd) return api.sendMessage(`❌ Commande « ${input} » introuvable.`, threadID, messageID);
    const p = cmd.hasPrefix === false ? '' : prefix || '';
    const aliases = (cmd.aliases || []).filter((a) => a !== cmd.name);
    return api.sendMessage(
      `📖 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗘 : ${cmd.name}\n━━━━━━━━━━\n` +
      `📝 ${cmd.description}\n` +
      `🧭 Utilisation : ${p}${cmd.usage}\n` +
      (aliases.length ? `🔁 Alias : ${aliases.join(', ')}\n` : '') +
      `🔐 Permission : ${ROLES[Number(cmd.role)] || ROLES[0]}\n` +
      `⏳ Délai : ${cmd.cooldown}s\n` +
      `🔤 Préfixe : ${cmd.hasPrefix === false ? 'non requis' : 'requis'}`,
      threadID, messageID
    );
  }

  const lines = all.map((c, i) => `${String(i + 1).padStart(2, ' ')}. ${c.hasPrefix === false ? '' : prefix || ''}${c.name} — ${c.description.split('.')[0].slice(0, 60)}`);
  api.sendMessage(
    `🤖 𝗗𝗔𝗩𝗕𝗢𝗧 — ${all.length} commandes\n━━━━━━━━━━\n${lines.join('\n')}\n━━━━━━━━━━\n` +
    `💡 « ai <question> » fonctionne sans préfixe (aussi : ia, bot, davbot).\n` +
    `Détails : ${prefix || ''}help <commande>`,
    threadID, messageID
  );
};
