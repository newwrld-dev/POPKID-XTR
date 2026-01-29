import pkg from "@whiskeysockets/baileys";
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
} = pkg;

import { fileTypeFromBuffer } from 'file-type';
import fs from 'fs';
import pino from 'pino';
import path from 'path';
import PhoneNumber from 'awesome-phonenumber';
import config from '../config.cjs';
import { imageToWebp, videoToWebp, writeExifImg, writeExifVid } from '../lib/exif.cjs';
import { getBuffer, getSizeMedia } from '../lib/myfunc.cjs';

const proto = pkg.proto;
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

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
    const stream = await downloadContentFromMessage(
        m,
        type.replace("Message", "")
    );
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
};

function serialize(m, sock, logger) {
    // downloadFile function
    async function downloadFile(m) {
        try {
            const buffer = await downloadMediaMessage(
                m,
                "buffer",
                {},
                { logger, reuploadRequest: sock.updateMediaMessage }
            );
            return buffer;
        } catch (error) {
            console.error('Error downloading media:', error);
            return null;
        }
    }

    // React function
    async function React(emoji) {
        let reactm = {
            react: {
                text: emoji,
                key: m.key,
            },
        };
        await sock.sendMessage(m.from, reactm);
    }

    sock.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return decode.user && decode.server && decode.user + '@' + decode.server || jid;
        } else {
            return jid;
        }
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
        withoutContact = sock.withoutContact || withoutContact;
        let v;
        if (jid.endsWith("@g.us")) {
            return new Promise(async (resolve) => {
                v = store.contacts[jid] || {};
                if (!(v.name || v.subject)) v = await sock.groupMetadata(jid) || {};
                resolve(v.name || v.subject || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international'));
            });
        } else {
            v = jid === '0@s.whatsapp.net' ? {
                id: jid,
                name: 'WhatsApp'
            } : jid === sock.decodeJid(sock.user.id) ?
                sock.user :
                (store.contacts[jid] || {});
            return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international');
        }
    };

    sock.sendContact = async (jid, kon, quoted = '', opts = {}) => {
        let list = [];
        for (let i of kon) {
            let name = config.OWNER_NAME;
            list.push({
                displayName: name,
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await sock.getName(i + "@s.whatsapp.net")}\nFN:${name}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Click here to chat\nEND:VCARD`
            });
        }
        sock.sendMessage(jid, { contacts: { displayName: `${list.length} Kontak`, contacts: list }, ...opts }, { quoted });
    };

    sock.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        let buffer;
        if (options && (options.packname || options.author)) {
            buffer = await writeExifImg(buff, options);
        } else {
            buffer = await imageToWebp(buff);
        }
        await sock.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
        return buffer;
    };

    sock.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        let buffer;
        if (options && (options.packname || options.author)) {
            buffer = await writeExifVid(buff, options);
        } else {
            buffer = await videoToWebp(buff);
        }
        await sock.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
        return buffer;
    };

    sock.sendPoll = (jid, name = '', values = [], selectableCount = 1) => { 
        return sock.sendMessage(jid, { poll: { name, values, selectableCount } });
    };

    sock.getFile = async (PATH, save) => {
        let res, filename;
        let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0);
        if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer');
        let type = await fileTypeFromBuffer(data) || { mime: 'application/octet-stream', ext: '.bin' };
        if (data && save && !filename) (filename = path.join(__dirname, './' + new Date * 1 + '.' + type.ext), await fs.promises.writeFile(filename, data));
        return { res, filename, size: await getSizeMedia(data), ...type, data };
    };

    sock.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        let quoted = message.msg ? message.msg : message;
        let mime = (message.msg || message).mimetype || '';
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
        const stream = await downloadContentFromMessage(quoted, messageType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        const type = await fileTypeFromBuffer(buffer);
        const trueFileName = attachExtension ? `${filename}.${type.ext}` : filename;
        await fs.promises.writeFile(trueFileName, buffer);
        return trueFileName;
    };

    sock.copyNForward = async (jid, message, forceForward = false, options = {}) => {
        let vtype;
        if (options.readViewOnce) {
            message.message = message.message?.ephemeralMessage?.message || message.message || undefined;
            vtype = Object.keys(message.message.viewOnceMessage.message)[0];
            delete (message.message?.ignore || message.message || undefined);
            delete message.message.viewOnceMessage.message[vtype].viewOnce;
            message.message = { ...message.message.viewOnceMessage.message };
        }

        let mtype = Object.keys(message.message)[0];
        let content = await generateForwardMessageContent(message, forceForward);
        let ctype = Object.keys(content)[0];
        let context = {};
        if (mtype != "conversation") context = message.message[mtype].contextInfo;
        content[ctype].contextInfo = { ...context, ...content[ctype].contextInfo };
        
        const waMessage = await generateWAMessageFromContent(jid, content, options ? {
            ...content[ctype],
            ...options,
            ...(options.contextInfo ? {
                contextInfo: { ...content[ctype].contextInfo, ...options.contextInfo }
            } : {})
        } : {});
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
        if (m.type === "ephemeralMessage") {
            m.message = m.message[m.type].message;
            m.type = getContentType(m.message);
        }
        if (m.type === "viewOnceMessageV2") {
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
                m.quoted.mtype = Object.keys(m.quoted.message).filter(v => v.includes("Message") || v.includes("conversation"))[0];
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
