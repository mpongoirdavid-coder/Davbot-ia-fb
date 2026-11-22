const os = require('os');
const { formatDuration } = require('../lib/helpers');

module.exports.config = {
  name: 'ping',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  aliases: ['uptime'],
  description: 'Affiche la latence du bot et son temps de fonctionnement',
  usage: 'ping | uptime',
  credits: 'Davbot',
  cooldown: 5,
};

module.exports.run = async function ({ api, event, Utils }) {
  const latency = Math.max(0, Date.now() - Number(event.timestamp || Date.now()));
  const account = Utils && Utils.account.get(String(api.getCurrentUserID()));
  const mem = process.memoryUsage();
  const msg =
    `🏓 𝗣𝗼𝗻𝗴 !\n━━━━━━━━━━\n` +
    `⚡ Latence : ${latency} ms\n` +
    `⏱️ Uptime processus : ${formatDuration(process.uptime())}\n` +
    (account ? `🤖 Uptime du bot : ${formatDuration(account.time)}\n` : '') +
    `💾 RAM : ${(mem.rss / 1048576).toFixed(0)} Mo / ${(os.totalmem() / 1073741824).toFixed(1)} Go\n` +
    `🖥️ Node ${process.version}`;
  api.sendMessage(msg, event.threadID, event.messageID);
};
