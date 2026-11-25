module.exports.config = {
  name: 'help',
  version: '2.0.0',
  role: 0,
  hasPrefix: false,
  aliases: ['aide', 'menu', 'commandes'],
  description: 'Menu des commandes ou détails sur une commande',
  usage: 'help | menu | help <commande>',
  credits: 'Davbot',
  cooldown: 3,
};

const ROLES = ['Tout le monde', 'Admin du bot', 'Admin du groupe', 'Super admin'];

// Catégories du menu (une commande absente de la liste va dans « Autres »)
const CATEGORIES = [
  ['🤖 𝗜𝗔 & 𝗦𝗔𝗟𝗢𝗡', ['ai', 'emoji', 'prefix', 'help']],
  ['👥 𝗚𝗘𝗦𝗧𝗜𝗢𝗡 𝗗𝗨 𝗚𝗥𝗢𝗨𝗣𝗘', ['groupe', 'kick', 'welcome', 'tid', 'uid', 'alluser']],
  ['📊 𝗜𝗡𝗙𝗢𝗦', ['ping', 'botinfo']],
  ['🔐 𝗔𝗗𝗠𝗜𝗡 𝗗𝗨 𝗕𝗢𝗧', ['accept', 'listbox', 'out', 'sendnoti', 'autoseen', 'unsend']],
];

module.exports.run = async function ({ api, event, args, enableCommands, Utils, prefix }) {
  const { threadID, messageID } = event;
  const enabled = (enableCommands && enableCommands[0] && enableCommands[0].commands) || [];
  const seen = new Set();
  const all = [...Utils.commands.values()].filter((c) => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return !enabled.length || enabled.includes(c.name);
  });
  const input = (args[0] || '').toLowerCase();
  const P = (c) => (c.hasPrefix === false ? '' : prefix || '');

  if (input) {
    const cmd = all.find((c) => c.name === input || (c.aliases || []).includes(input));
    if (!cmd) return api.sendMessage(`❌ Commande « ${input} » introuvable. Tape help pour la liste.`, threadID, messageID);
    const aliases = (cmd.aliases || []).filter((a) => a !== cmd.name);
    return api.sendMessage(
      `📖 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗘 : ${cmd.name}\n━━━━━━━━━━\n` +
      `📝 ${cmd.description}\n` +
      `🧭 Utilisation : ${P(cmd)}${cmd.usage}\n` +
      (aliases.length ? `🔁 Alias : ${aliases.join(', ')}\n` : '') +
      `🔐 Permission : ${ROLES[Number(cmd.role)] || ROLES[0]}\n` +
      `⏳ Délai : ${cmd.cooldown}s\n` +
      `🔤 Préfixe : ${cmd.hasPrefix === false ? 'non requis' : 'requis'}`,
      threadID, messageID
    );
  }

  const used = new Set();
  let out = `❤️❤️‍🩹)(❤️❤️‍🩹)(❤️❤️‍🩹)(\n/|  🤖 𝗠𝗘𝗡𝗨 𝗗𝗔𝗩𝗕𝗢𝗧  |\\\n)(❤️‍🩹❤️)(❤️‍🩹❤️)(❤️‍🩹❤️\n`;
  for (const [title, names] of CATEGORIES) {
    const list = all.filter((c) => names.includes(c.name));
    if (!list.length) continue;
    list.forEach((c) => used.add(c.name));
    out += `\n${title}\n` + list.map((c) => `  ${P(c)}${c.name} — ${String(c.description).split('.')[0].slice(0, 50)}`).join('\n') + '\n';
  }
  const others = all.filter((c) => !used.has(c.name));
  if (others.length) out += `\n📦 𝗔𝗨𝗧𝗥𝗘𝗦\n` + others.map((c) => `  ${P(c)}${c.name} — ${String(c.description).split('.')[0].slice(0, 50)}`).join('\n') + '\n';
  out += `\n━━━━━━━━━━\n📌 ${all.length} commandes\n💡 ai / ia / bot / davbot : sans préfixe\n🔎 Détails : ${prefix || ''}help <commande>`;
  api.sendMessage(out, threadID, messageID);
};
