module.exports.config = {
  name: 'prefix',
  version: '1.0.0',
  role: 0,
  hasPrefix: false,
  aliases: ['prefixe', 'préfixe'],
  description: 'Affiche le préfixe du bot avec un joli dessin',
  usage: 'prefix',
  credits: 'Davbot',
  cooldown: 3,
};

module.exports.run = async function ({ api, event, prefix }) {
  const p = prefix || 'aucun';
  const msg =
    `❤️❤️‍🩹)(❤️❤️‍🩹)(❤️❤️‍🩹)(❤️❤️‍🩹)(\n` +
    `/|  𝗣𝗥𝗘́𝗙𝗜𝗫𝗘 𝗗𝗨 𝗕𝗢𝗧  |\\\n` +
    `)(  ❤️  ${p}  ❤️‍🩹  )(\n` +
    `/|  ${prefix ? `${prefix}help` : 'help'} = menu  |\\\n` +
    `❤️‍🩹)(❤️)(❤️‍🩹)(❤️)(❤️‍🩹)(❤️\n` +
    `💡 ai, ia, bot, davbot : sans préfixe`;
  api.sendMessage(msg, event.threadID, event.messageID);
};
