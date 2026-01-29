import pkg from "@whiskeysockets/baileys";
// Robustly handle the default export which often contains the functions
const baileys = pkg.default || pkg;

const { 
    getContentType, 
    jidDecode, 
    downloadMediaMessage, 
    downloadContentFromMessage, 
    generateWAMessage, 
    generateWAMessageFromContent,
    areJidsSameUser, 
    generateForwardMessageContent, 
    makeInMemoryStore 
} = baileys;

import { fileTypeFromBuffer } from 'file-type';
import fs from 'fs';
import pino from 'pino';
import path from 'path';
import PhoneNumber from 'awesome-phonenumber';
import config from '../config.cjs';
import { imageToWebp, videoToWebp, writeExifImg, writeExifVid } from '../lib/exif.cjs';
import { getBuffer, getSizeMedia } from '../lib/myfunc.cjs';

const proto = baileys.proto;
// Ensure makeInMemoryStore is available before calling it
const store = typeof makeInMemoryStore === 'function' 
    ? makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) }) 
    : null;

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

function decodeJid(jid) {
    const { user, server } = jidDecode(jid) || {};
    return user && server ? `${user}@${server}`.trim() : jid;
}

const downloadMedia = async message => {
    let type = Object.keys(message)[0];
    let m = message[type];
    if (type === "buttonsMessage" || type === "viewOnceMessageV2") {
        if (type === "viewOnceMessageV2") {
            m = message.viewOnceMessageV2?.message;
            type = Object.keys(m || {})[0];
        } else type = Object.keys(m || {})[1];
        m = m[type];
    }
    const stream = await downloadContentFromMessage(m, type.replace("Message", ""));
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
};

function serialize(m, sock, logger) {
    async function downloadFile(m) {
        try {
            return await downloadMediaMessage(m, "buffer", {}, { logger, reuploadRequest: sock.updateMediaMessage });
        } catch (error) {
            console.error('Error downloading media:', error);
            return null;
        }
    }

    async function React(emoji) {
        await sock.sendMessage(m.from, { react: { text: emoji, key: m.key } });
    }

    sock.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return decode.user && decode.server && decode.user + '@' + decode.server || jid;
        }
        return jid;
    };

    sock.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = sock.decodeJid(contact.id);
            if (store && store.contacts) {
                store.contacts[id] = { id, name: contact.notify };
            }
        }
    });

    sock.getName = (jid, withoutContact = false) => {
        jid = sock.decodeJid(jid);
        let v;
        if (jid.endsWith("@g.us")) {
            return new Promise(async (resolve) => {
                v = store?.contacts[jid] || {};
                if (!(v.name || v.subject)) v = await sock.groupMetadata(jid).catch(() => ({}));
                resolve(v.name || v.subject || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international'));
            });
        } else {
            v = jid === '0@s.whatsapp.net' ? { id: jid, name: 'WhatsApp' } : jid === sock.decodeJid(sock.user.id) ? sock.user : (store?.contacts[jid] || {});
            return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international');
        }
    };

    sock.sendContact = async (jid, kon, quoted = '', opts = {}) => {
        let list = [];
        for (let i of kon) {
            let name = config.OWNER_NAME;
            list.push({
                displayName: name,
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await sock.getName(i + "@s.whatsapp.net")}\nFN:${name}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Click here\nEND:VCARD`
            });
        }
        sock.sendMessage(jid, { contacts: { displayName: `${list.length} Kontak`, contacts: list }, ...opts }, { quoted });
    };

    sock.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^https?:\/\//.test(path) ? await getBuffer(path) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        let buffer = (options.packname || options.author) ? await writeExifImg(buff, options) : await imageToWebp(buff);
        await sock.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
        return buffer;
    };

    sock.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^https?:\/\//.test(path) ? await getBuffer(path) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        let buffer = (options.packname || options.author) ? await writeExifVid(buff, options) : await videoToWebp(buff);
        await sock.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
        return buffer;
    };

    sock.copyNForward = async (jid, message, forceForward = false, options = {}) => {
        let content = await generateForwardMessageContent(message, forceForward);
        let ctype = Object.keys(content)[0];
        const waMessage = await generateWAMessageFromContent(jid, content, {
            ...content[ctype],
            ...options,
            ...(options.contextInfo ? { contextInfo: { ...content[ctype].contextInfo, ...options.contextInfo } } : {})
        });
        await sock.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id });
        return waMessage;
    };

    if (m.key) {
        m.id = m.key.id;
        m.isSelf = m.key.fromMe;
        m.from = decodeJid(m.key.remoteJid);
        m.isGroup = m.from.endsWith("@g.us");
        m.sender = m.isGroup ? decodeJid(m.key.participant) : m.isSelf ? decodeJid(sock.user.id) : m.from;
    }

    if (m.message) {
        m.type = getContentType(m.message);
        if (["ephemeralMessage", "viewOnceMessageV2"].includes(m.type)) {
            m.message = m.message[m.type].message;
            m.type = getContentType(m.message);
        }

        try {
            const quoted = m.message[m.type]?.contextInfo;
            if (quoted?.quotedMessage) {
                let qmsg = quoted.quotedMessage;
                if (qmsg.ephemeralMessage) qmsg = qmsg.ephemeralMessage.message;
                if (qmsg.viewOnceMessageV2) qmsg = qmsg.viewOnceMessageV2.message;

                m.quoted = {
                    stanzaId: quoted.stanzaId,
                    participant: decodeJid(quoted.participant),
                    message: qmsg
                };
                m.quoted.isSelf = m.quoted.participant === decodeJid(sock.user.id);
                m.quoted.mtype = Object.keys(m.quoted.message).find(v => v.includes("Message") || v.includes("conversation"));
                m.quoted.text = m.quoted.message[m.quoted.mtype]?.text || m.quoted.message[m.quoted.mtype]?.caption || m.quoted.message[m.quoted.mtype] || "";
                m.quoted.key = { id: m.quoted.stanzaId, fromMe: m.quoted.isSelf, remoteJid: m.from };
                m.quoted.download = () => downloadMedia(m.quoted.message);
            }
        } catch {
            m.quoted = null;
        }

        m.body = m.message?.conversation || m.message?.[m.type]?.text || m.message?.[m.type]?.caption || "";
        m.reply = text => sock.sendMessage(m.from, { text }, { quoted: m });
        m.mentions = m?.message?.[m.type]?.contextInfo?.mentionedJid || [];
        m.download = () => downloadMedia(m.message);
        m.downloadFile = () => downloadFile(m);
        m.React = (emoji) => React(emoji);
    }

    return m;
}

export { decodeJid, serialize };
