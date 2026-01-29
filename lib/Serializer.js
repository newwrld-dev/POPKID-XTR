import pkg from "@whiskeysockets/baileys";
// Hardened import for ES Modules to ensure functions are found
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

/** * CPU OPTIMIZATION: 
 * We only initialize the store if makeInMemoryStore is valid. 
 * Using a level 'error' logger reduces CPU cycles spent on logging.
 */
let store = null;
try {
    if (typeof makeInMemoryStore === 'function') {
        store = makeInMemoryStore({ 
            logger: pino({ level: 'error' }).child({ stream: 'store' }) 
        });
    }
} catch (e) {
    console.error("Store initialization failed, continuing without it to save CPU.");
}

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
    // Lightweight implementations of helper functions
    m.reply = text => sock.sendMessage(m.from, { text }, { quoted: m });
    m.React = (emoji) => sock.sendMessage(m.from, { react: { text: emoji, key: m.key } });
    
    sock.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return decode.user && decode.server && decode.user + '@' + decode.server || jid;
        }
        return jid;
    };

    // Only listen for updates if store exists to save memory/CPU
    if (store) {
        sock.ev.on('contacts.update', update => {
            for (let contact of update) {
                let id = sock.decodeJid(contact.id);
                if (store.contacts) store.contacts[id] = { id, name: contact.notify };
            }
        });
    }

    if (m.key) {
        m.id = m.key.id;
        m.isSelf = m.key.fromMe;
        m.from = decodeJid(m.key.remoteJid);
        m.isGroup = m.from.endsWith("@g.us");
        m.sender = m.isGroup ? decodeJid(m.key.participant) : m.isSelf ? decodeJid(sock.user.id) : m.from;
    }

    if (m.message) {
        m.type = getContentType(m.message);
        // Handle View Once and Ephemeral simply
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
                m.quoted.mtype = Object.keys(m.quoted.message).find(v => v.includes("Message") || v.includes("conversation"));
                m.quoted.text = m.quoted.message[m.quoted.mtype]?.text || m.quoted.message[m.quoted.mtype]?.caption || "";
                m.quoted.key = { id: m.quoted.stanzaId, fromMe: m.quoted.participant === decodeJid(sock.user.id), remoteJid: m.from };
            }
        } catch {
            m.quoted = null;
        }

        m.body = m.message?.conversation || m.message?.[m.type]?.text || m.message?.[m.type]?.caption || "";
        m.mentions = m?.message?.[m.type]?.contextInfo?.mentionedJid || [];
    }

    return m;
}

export { decodeJid, serialize };
