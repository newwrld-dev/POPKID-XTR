import pkg, { prepareWAMessageMedia } from '@whiskeysockets/baileys';
const { generateWAMessageFromContent, proto } = pkg;

import getFBInfo from '@xaviabot/fb-downloader';
import config from '../config.cjs'; // ✅ FIXED PATH

const fbResults = new Map();
let fbIndex = 1;

const facebookCommand = async (m, Matrix) => {
  try {
    let selectedId;

    // Button / interactive reply handler
    if (m?.message?.interactiveResponseMessage) {
      const paramsJson =
        m.message.interactiveResponseMessage.nativeFlowResponseMessage?.paramsJson;
      if (paramsJson) {
        selectedId = JSON.parse(paramsJson).id;
      }
    }

    const body = m.body || '';
    const prefix = config.PREFIX || '.';
    const isCmd = body.startsWith(prefix);
    const cmd = isCmd
      ? body.slice(prefix.length).split(' ')[0].toLowerCase()
      : '';
    const text = isCmd
      ? body.slice(prefix.length + cmd.length).trim()
      : '';

    const commands = ['facebook', 'fb', 'fbdl'];

    /* ===================== COMMAND ===================== */
    if (commands.includes(cmd)) {
      if (!text) return m.reply('❌ Please provide a Facebook video URL');

      await m.React('🕘');

      const fbData = await getFBInfo(text);
      if (!fbData) {
        await m.React('❌');
        return m.reply('No video found');
      }

      fbResults.set(fbIndex, fbData);

      const qualities = [];
      if (fbData.sd) qualities.push({ q: 'SD', url: fbData.sd });
      if (fbData.hd) qualities.push({ q: 'HD', url: fbData.hd });

      if (!qualities.length) {
        await m.React('❌');
        return m.reply('No downloadable quality available');
      }

      const buttons = qualities.map((v, i) => ({
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
          display_text: `📥 Download ${v.q}`,
          id: `fb_${fbIndex}_${i}`, // ✅ FIXED ID
        }),
      }));

      const msg = generateWAMessageFromContent(
        m.from,
        {
          viewOnceMessage: {
            message: {
              interactiveMessage: proto.Message.InteractiveMessage.create({
                body: {
                  text: `*ᴘᴏᴘᴋɪᴅ ᴍᴅ*\n\n*TITLE:* ${fbData.title || 'Facebook Video'}`,
                },
                footer: { text: '© ᴘᴏᴘᴋɪᴅ ᴍᴅ' },
                header: proto.Message.InteractiveMessage.Header.create({
                  ...(await prepareWAMessageMedia(
                    { image: { url: fbData.thumbnail } },
                    { upload: Matrix.waUploadToServer }
                  )),
                  hasMediaAttachment: true,
                }),
                nativeFlowMessage: { buttons },
              }),
            },
          },
        },
        {}
      );

      await Matrix.relayMessage(m.from, msg.message, {
        messageId: msg.key.id,
      });

      fbIndex++;
      return m.React('✅');
    }

    /* ===================== BUTTON CLICK ===================== */
    if (selectedId && selectedId.startsWith('fb_')) {
      const [, key, index] = selectedId.split('_');
      const fbData = fbResults.get(Number(key));
      if (!fbData) return;

      const links = [];
      if (fbData.sd) links.push(fbData.sd);
      if (fbData.hd) links.push(fbData.hd);

      const videoUrl = links[Number(index)];
      if (!videoUrl) return m.reply('Invalid selection');

      await m.React('🕘');

      const buffer = await getStreamBuffer(videoUrl);
      const sizeMB = buffer.length / (1024 * 1024);

      if (sizeMB > 300)
        return m.reply('❌ Video exceeds 300MB WhatsApp limit');

      await Matrix.sendMessage(
        m.from,
        {
          video: buffer,
          mimetype: 'video/mp4',
          caption: '> © ᴘᴏᴘᴋɪᴅ ᴍᴅ',
        },
        { quoted: m }
      );

      return m.React('✅');
    }
  } catch (err) {
    console.error(err);
    await m.React('❌');
    return m.reply('Error processing request');
  }
};

/* ===================== STREAM BUFFER ===================== */
const getStreamBuffer = async (url) => {
  const res = await fetch(url);
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
};

export default facebookCommand;
