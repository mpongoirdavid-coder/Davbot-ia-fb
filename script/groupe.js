const axios = require('axios');
const { call, getTargets, textAfter } = require('../lib/helpers');

module.exports.config = {
  name: 'groupe',
  version: '1.0.0',
  role: 2,
  hasPrefix: true,
  aliases: ['group', 'gc', 'gerer'],
  description: 'Gérer le groupe : infos, membres, nom, emoji, couleur, surnoms, admins, ajout, photo',
  usage: 'groupe <info|membres|nom|emoji|couleur|surnom|admin|unadmin|ajouter|photo>',
  credits: 'Davbot',
  cooldown: 3,
};

const AIDE =
  `⚙️ 𝗚𝗘𝗦𝗧𝗜𝗢𝗡 𝗗𝗨 𝗚𝗥𝗢𝗨𝗣𝗘\n━━━━━━━━━━\n` +
  `• groupe info\n• groupe membres\n• groupe nom <nouveau nom>\n• groupe emoji <emoji>\n` +
  `• groupe couleur <#hex> (ex : #0084ff)\n• groupe surnom [@membre] <surnom> (vide = effacer)\n` +
  `• groupe admin @membre (ou réponse)\n• groupe unadmin @membre\n• groupe ajouter <uid> [uid...]\n` +
  `• groupe photo (en répondant à une image)`;

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const reply = (m) => api.sendMessage(m, threadID, messageID);
  const sub = (args[0] || '').toLowerCase();
  const botID = String(api.getCurrentUserID());

  if (!sub || sub === 'aide' || sub === 'help') return reply(AIDE);

  try {
    const info = await api.getThreadInfo(threadID);
    const isBotAdmin = (info.adminIDs || []).some((a) => String(a.id) === botID);

    switch (sub) {
      case 'info': {
        return reply(
          `📋 𝗜𝗡𝗙𝗢𝗦 𝗗𝗨 𝗚𝗥𝗢𝗨𝗣𝗘\n━━━━━━━━━━\n` +
          `📛 Nom : ${info.threadName || 'Sans nom'}\n🆔 ID : ${threadID}\n` +
          `👥 Membres : ${(info.participantIDs || []).length}\n👑 Admins : ${(info.adminIDs || []).length}\n` +
          `😀 Emoji : ${info.emoji || 'par défaut'}\n🎨 Couleur : ${info.color ? '#' + info.color : 'par défaut'}\n` +
          `🔒 Approbation des membres : ${info.approvalMode ? 'oui' : 'non'}\n` +
          `🤖 Bot admin : ${isBotAdmin ? 'oui' : 'non'}`
        );
      }

      case 'membres': {
        const ids = info.participantIDs || [];
        const users = await api.getUserInfo(ids);
        const admins = new Set((info.adminIDs || []).map((a) => String(a.id)));
        const lines = ids.map((id, i) => `${i + 1}. ${admins.has(String(id)) ? '👑 ' : ''}${(users[id] && users[id].name) || id}`);
        return reply(`👥 𝗠𝗘𝗠𝗕𝗥𝗘𝗦 (${ids.length})\n━━━━━━━━━━\n${lines.join('\n')}`.slice(0, 19000));
      }

      case 'nom':
      case 'name': {
        const name = textAfter(event, 2, { removeMentions: false });
        if (!name) return reply('❌ Utilisation : groupe nom <nouveau nom>');
        await call(api.setTitle, name, threadID);
        return reply(`✅ Nom du groupe changé en : ${name}`);
      }

      case 'emoji': {
        const emoji = args[1];
        if (!emoji) return reply('❌ Utilisation : groupe emoji <emoji>');
        await call(api.changeThreadEmoji, emoji, threadID);
        return reply(`✅ Emoji du groupe changé : ${emoji}`);
      }

      case 'couleur':
      case 'color': {
        const color = args[1];
        if (!color) return reply('❌ Utilisation : groupe couleur <#hex> (ex : #0084ff)');
        await call(api.changeThreadColor, color.replace('#', ''), threadID);
        return reply(`✅ Couleur du groupe changée : ${color}`);
      }

      case 'surnom':
      case 'nickname': {
        const targets = getTargets(event, args.slice(1));
        const id = targets[0] || String(senderID);
        const nick = textAfter(event, 2).replace(/\b\d{6,}\b/g, '').trim();
        await call(api.changeNickname, nick, threadID, id);
        return reply(nick ? `✅ Surnom défini : ${nick}` : '✅ Surnom effacé.');
      }

      case 'admin':
      case 'unadmin': {
        if (!isBotAdmin) return reply('⚠️ Je dois être admin du groupe pour modifier les admins.');
        const targets = getTargets(event, args.slice(1));
        if (!targets.length) return reply(`❌ Utilisation : groupe ${sub} @membre (ou en répondant à son message)`);
        await call(api.changeAdminStatus, threadID, targets, sub === 'admin');
        return reply(sub === 'admin' ? `✅ ${targets.length} membre(s) promu(s) admin.` : `✅ ${targets.length} admin(s) rétrogradé(s).`);
      }

      case 'ajouter':
      case 'add': {
        const ids = args.slice(1).filter((a) => /^\d{6,}$/.test(a));
        if (!ids.length) return reply('❌ Utilisation : groupe ajouter <uid> [uid...]');
        let ok = 0, ko = 0;
        for (const id of ids) {
          try { await call(api.addUserToGroup, id, threadID); ok++; } catch (e) { ko++; }
        }
        return reply(`➕ Ajout terminé : ${ok} réussi(s), ${ko} échec(s).`);
      }

      case 'photo':
      case 'image': {
        if (!isBotAdmin && info.approvalMode) return reply('⚠️ Je dois être admin pour changer la photo.');
        const atts = (event.messageReply && event.messageReply.attachments) || event.attachments || [];
        const photo = atts.find((a) => a.type === 'photo' && (a.url || a.largePreviewUrl));
        if (!photo) return reply('❌ Réponds à une image avec : groupe photo');
        const res = await axios.get(photo.url || photo.largePreviewUrl, { responseType: 'stream', timeout: 20000 });
        await call(api.changeGroupImage, res.data, threadID);
        return reply('✅ Photo du groupe changée.');
      }

      default:
        return reply(AIDE);
    }
  } catch (error) {
    console.error('Erreur groupe :', error);
    return reply(`⚠️ Action impossible : ${(error && (error.errorDescription || error.message || error.error)) || 'erreur inconnue'}.\nVérifie que je suis admin du groupe si nécessaire.`);
  }
};
