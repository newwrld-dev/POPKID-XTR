import pkg from "@whiskeysockets/baileys";
// FIX: Detects the correct export format to prevent "not a function" errors
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
 * Using level: 'error' to stop the bot from wasting CPU on logs.
 */
let store = null;
if (typeof makeInMemoryStore === 'function') {
    store = makeInMemoryStore({ logger: pino({ level: 'error' }) });
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
    if (!m) return m;

    // Direct helper assignments to save CPU cycles
    m.reply = (text) => sock.sendMessage(m.from, { text }, { quoted: m });
    m.React = (emoji) => sock.sendMessage(m.from, { react: { text: emoji, key: m.key } });

    sock.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return decode.user && decode.server && decode.user + '@' + decode.server || jid;
        }
        return jid;
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
        // Fail-safe for ephemeral/view-once
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
                    message: qmsg,
                    key: { id: quoted.stanzaId, fromMe: decodeJid(quoted.participant) === decodeJid(sock.user.id), remoteJid: m.from }
                };
                m.quoted.mtype = Object.keys(m.quoted.message).find(v => v.includes("Message") || v.includes("conversation"));
                m.quoted.text = m.quoted.message[m.quoted.mtype]?.text || m.quoted.message[m.quoted.mtype]?.caption || "";
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
