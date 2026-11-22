const { formatDuration } = require('../lib/helpers');

module.exports.config = {
  name: 'botinfo',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  aliases: ['about', 'apropos'],
  description: 'Informations sur le bot (version, commandes, comptes connectés, uptime)',
  usage: 'botinfo',
  credits: 'Davbot',
  cooldown: 5,
};

module.exports.run = async function ({ api, event, Utils, prefix }) {
  const names = new Set([...Utils.commands.values()].map((c) => c.name));
  api.sendMessage(
    `🤖 𝗗𝗔𝗩𝗕𝗢𝗧 𝗜𝗔\n━━━━━━━━━━\n` +
    `📦 Version : ${require('../package.json').version}\n` +
    `🔤 Préfixe : ${prefix || 'aucun'} (ai, ia, bot, davbot : sans préfixe)\n` +
    `🧩 Commandes : ${names.size}\n` +
    `👤 Comptes connectés : ${Utils.account.size}\n` +
    `⏱️ Uptime : ${formatDuration(process.uptime())}\n` +
    `🧠 IA : davbot.pages.dev`,
    event.threadID, event.messageID
  );
};
