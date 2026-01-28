import config from '../../config.cjs';
import moment from 'moment-timezone';

const LogoCmd = async (message, socket) => {
    const prefix = config.PREFIX;
    const userName = message.pushName || "User";
    const body = message.body || '';
    
    // Determine the command used
    const command = body.startsWith(prefix) 
        ? body.slice(prefix.length).split(" ")[0].toLowerCase() 
        : '';

    // Invisible character padding for message styling
    const readMore = String.fromCharCode(8206).repeat(4001);

    // Helper: Format uptime from seconds to h m s
    const formatUptime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor(seconds % 3600 / 60);
        const s = Math.floor(seconds % 60);
        return `${h}h ${m}m ${s}s`;
    };

    // Helper: Get greeting based on time of day
    const getGreeting = () => {
        const hour = moment().tz("Africa/Dar_es_Salaam").hour();
        if (hour < 12) return "🌄 Good Morning";
        if (hour < 17) return "☀️ Good Afternoon";
        if (hour < 20) return "🌇 Good Evening";
        return "🌙 Good Night";
    };

    const uptime = formatUptime(process.uptime());
    const greeting = getGreeting();

    // Helper: Error messaging with ad-reply context
    const sendError = async (text) => {
        const adContext = {
            text: text,
            contextInfo: {
                isForwarded: true,
                forwardingScore: 999,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: "120363289379419860@newsletter",
                    newsletterName: "popkidxmd",
                    serverMessageId: -1
                },
                externalAdReply: {
                    title: "popkid",
                    body: "popkidxmd",
                    thumbnailUrl: "https://files.catbox.moe/yr339d.jpg",
                    sourceUrl: "https://whatsapp.com/channel/0029VacgxK96hENmSRMRxx1r",
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        };
        await socket.sendMessage(message.from, adContext, { quoted: message });
    };

    if (command === "menu") {
        try {
            // Reaction: Loading
            await socket.sendMessage(message.from, {
                react: { text: '⏳', key: message.key }
            });

            // Build Menu String
            const menuText = `
╭──❍「POPKID XMD BOT」❍
│ Hi! 👋
│ Name : ${userName}
│ ${greeting} 
╰─┬────❍
╭─┴❍「BOT STATUS」❍
│ mode: ${config.MODE}
│ prefix: ${prefix}
│ uptime: ${uptime}
│ theme: joelXtech
╰─┬────❍${readMore}
╭─┴❍「 ɢᴇɴᴇʀᴀʟ 」❍
│${prefix} ping
│${prefix} alive
│${prefix} owner
│${prefix} sudo
│${prefix} infobot
│${prefix} menu
╰─┬────❍
╭─┴❍「 ᴀɪ ᴄʜᴀᴛ 」❍
│${prefix} ai
│${prefix} gpt
│${prefix} bot
│${prefix} chatbot
│${prefix} lydea
│${prefix} lydia
│${prefix} autoreply
│${prefix} chat
│${prefix} remini
│${prefix} voicechat
╰─┬────❍
╭─┴❍「 ᴛᴏᴏʟs 」❍
│${prefix} calculator
│${prefix} tempfile
│${prefix} checkmail
│${prefix} trt
│${prefix} tts
│${prefix} ss
│${prefix} qr
│${prefix} readqr
│${prefix} shortenerurl
│${prefix} profile
│${prefix} sapk
│${prefix} url
│${prefix} url2
│${prefix} tourl
│${prefix} support
│${prefix} inc
│${prefix} i
│${prefix} app
│${prefix} appsearch
│${prefix} playstore
╰─┬────❍
╭─┴❍「 ᴄᴏɴᴠᴇʀᴛᴇʀꜱ 」❍
│${prefix} attp
│${prefix} binary
│${prefix} ebinary
│${prefix} emomix
╰─┬────❍
╭─┴❍「 ɢᴀᴍᴇꜱ+ꜰᴜɴ 」❍
│${prefix} ttt
│${prefix} resetttt
│${prefix} wcg
│${prefix} resetwcg
│${prefix} connect4
│${prefix} resetc4
│${prefix} score
│${prefix} joke
│${prefix} advice
│${prefix} meme
│${prefix} rank
│${prefix} roast
│${prefix} quote
╰─┬────❍
╭─┴❍「 ᴅᴏᴡɴʟᴏᴀᴅꜱ 」❍
│${prefix} apk
│${prefix} facebook
│${prefix} insta
│${prefix} tiktok
│${prefix} mediafire
│${prefix} pinterestdl
│${prefix} gdrive
│${prefix} play
│${prefix} song
│${prefix} video
│${prefix} smedia
│${prefix} movie
│${prefix} image
│${prefix} yts
│${prefix} lyrics
│${prefix} twitter
╰─┬────❍
╭─┴❍「 ʀᴇʟɪɢɪᴏɴ 」❍
│${prefix} bible
│${prefix} biblebooks
│${prefix} surahmenu
│${prefix} quranvid
│${prefix} qvid
│${prefix} qimg
│${prefix} surahaudio
│${prefix} surahurdu
│${prefix} asmaulhusna
│${prefix} prophetname
╰─┬────❍
╭─┴❍「 ɢʀᴏᴜᴘ 」❍
│${prefix} linkgroup
│${prefix} setppg
│${prefix} setname
│${prefix} setdesc
│${prefix} group
│${prefix} groupinfo
│${prefix} welcome
│${prefix} kick
│${prefix} kickall
│${prefix} add
│${prefix} promote
│${prefix} demote
│${prefix} pick
│${prefix} tagall
│${prefix} tagadmin
│${prefix} tagnotadmin
│${prefix} hidetag
│${prefix} antilink
│${prefix} antisticker
│${prefix} antibot
│${prefix} antileft
│${prefix} gcsetting
│${prefix} vcf
│${prefix} poll
│${prefix} getbio
╰─┬────❍
╭─┴❍「 ꜱᴛᴀʟᴋᴇʀ ᴛᴏᴏʟꜱ 」❍
│${prefix} truecaller
│${prefix} instastalk
│${prefix} tiktokstalk
│${prefix} githubstalk
│${prefix} npmstalk
╰─┬────❍
╭─┴❍「 ᴡᴀʟʟᴘᴀᴘᴇʀꜱ 」❍
│${prefix} anime
│${prefix} uchicha
│${prefix} naruto
│${prefix} sasuke
│${prefix} abstract
│${prefix} random
╰─┬────❍
╭─┴❍「 ʜᴇɴᴛᴀɪ 」❍
│${prefix} hwaifu
│${prefix} trap
│${prefix} blowjob
│${prefix} neko
│${prefix} hneko
╰─┬────❍
╭─┴❍「 ᴡᴀɪғᴜ 」❍
│${prefix} neko
│${prefix} couplepp
│${prefix} cosplay
│${prefix} megumin
│${prefix} shinobu
╰─┬────❍
╭─┴❍「 ʀᴇᴀᴄᴛɪᴏɴꜱ 」❍
│${prefix} highfive
│${prefix} glomp
│${prefix} handhold
│${prefix} shinobu
│${prefix} cuddle
│${prefix} cringe
│${prefix} sad
│${prefix} happy
│${prefix} dance
│${prefix} smug
│${prefix} blush
│${prefix} awo
│${prefix} wave
│${prefix} smile
╰─┬────❍
╭─┴❍「 ᴘᴏᴋᴇɴᴏᴍ 」❍
│${prefix} pokemon
│${prefix} wallet
│${prefix} buy
│${prefix} winmoney
╰─┬────❍
╭─┴❍「 ᴀᴜᴅɪᴏ ᴇᴅɪᴛ 」❍
│${prefix} say
│${prefix} tts
│${prefix} bass
│${prefix} blowin
│${prefix} deep
│${prefix} earrape
│${prefix} fast
│${prefix} fat
│${prefix} nighttime
│${prefix} reverse
│${prefix} robot
│${prefix} slow
│${prefix} smooth
│${prefix} typai
╰─┬────❍
╭─┴❍「 ʟᴏɢᴏ ᴍᴀᴋᴇʀ 」❍
│${prefix} logo
│${prefix} logo1
│${prefix} logo2
│${prefix} logo3
│${prefix} logo4
│${prefix} logo5
│${prefix} logo6
│${prefix} logo7
│${prefix} logo8
│${prefix} logo9
│${prefix} logo10
│${prefix} logo11
│${prefix} logo12
│${prefix} logo13
│${prefix} logo14
│${prefix} logo15
│${prefix} logo16
│${prefix} logo17
│${prefix} logo18
│${prefix} logo19
╰─┬────❍
╭─┴❍「 ᴏᴡɴᴇʀ ᴘᴀɴᴇʟ 」❍
│${prefix} send
│${prefix} vv
│${prefix} vv1
│${prefix} vv2
│${prefix} vv3
│${prefix} restart
│${prefix} update
│${prefix} pair
│${prefix} forward
│${prefix} getall
│${prefix} jid
│${prefix} join
│${prefix} leave
│${prefix} block
│${prefix} unblock
│${prefix} allcmds
│${prefix} anticall
│${prefix} setstatus
│${prefix} autobio
│${prefix} autotyping
│${prefix} alwaysonline
│${prefix} autoread
│${prefix} autosview
│${prefix} allvar
│${prefix} antidelete
│${prefix} addpremium
╰─┬────❍
╭─┴❍「 ᴘʀᴇᴍɪᴜᴍ ᴜꜱᴇʀꜱ 」❍
│${prefix} hentaivid
│${prefix} xnx
│${prefix} xxvideo
╰─┬────❍
╭─┴❍「 ᴇᴄᴏɴᴏᴍʏ 」❍
│${prefix} economy
│${prefix} balance
│${prefix} daily
│${prefix} leaderboard
│${prefix} earn
│${prefix} spend
│${prefix} deposit
│${prefix} withdraw
│${prefix} transfer
╰─┬────❍
╭─┴❍「 ᴘʀᴇᴍɪᴜᴍ ʙᴜɢꜱ 」❍
│${prefix} bugmenu
│${prefix} docbug
│${prefix} lockcrash
│${prefix} amountbug
│${prefix} pmbug
│${prefix} delbug
│${prefix} trollbug
│${prefix} docubug
│${prefix} unlimitedbug
│${prefix} bombbug
│${prefix} lagbug
│${prefix} gcbug
│${prefix} delgcbug
│${prefix} trollgcbug
│${prefix} labug
│${prefix} bombgcbug
│${prefix} unlimitedgcbug
│${prefix} docugcbug
╰─┬────❍
╭─┴❍「 ᴀɴɪᴍᴇ 」❍
│${prefix} neko
│${prefix} husbu
│${prefix} lol
│${prefix} shota
│${prefix} waifu
╰─┬────❍
╭─┴❍「 ɴꜱꜰᴡ 」❍
│${prefix} blowjob
│${prefix} cuckold
│${prefix} eba
│${prefix} foot
│${prefix} milf
│${prefix} pussy
│${prefix} yuri
│${prefix} zettai
╰─┬────❍
╭─┴❍「 ᴛɪᴋᴛᴏᴋ ᴘɪᴄꜱ 」❍
│${prefix} china
│${prefix} hijabu
│${prefix} indonesia
│${prefix} japan
│${prefix} korea
│${prefix} malaysia
│${prefix} thailand
│${prefix} vietnam
╰─┬────❍
╭─┴──❍「 ᴛɪᴋᴛᴏᴋ ᴠɪᴅᴇᴏ 」❍
│${prefix} bocil
│${prefix} gheayub
│${prefix} kayes
│${prefix} notnot
│${prefix} panrika
│${prefix} santuy
│${prefix} tiktokgirl
│${prefix} ukihty
╰─┬────❍
╭─┴❍「 ʀᴀɴᴅᴏᴍ ᴘɪᴄ 」❍
│${prefix} aesthetic
│${prefix} antiwork
│${prefix} bike
│${prefix} blackpink
│${prefix} boneka
│${prefix} car
│${prefix} cat
│${prefix} cosplay
│${prefix} dogo
│${prefix} justina
│${prefix} kayes
│${prefix} kpop
│${prefix} notnot
│${prefix} ppcouple
│${prefix} profile
│${prefix} pubg
│${prefix} rose
│${prefix} ryujin
│${prefix} wallhp
│${prefix} wallml
│${prefix} ulzzangboy
│${prefix} ulizzanggirl
╰─┬────❍
╭─┴❍「 ɪᴍᴀɢᴇ ᴇꜰꜰᴇᴄᴛꜱ 」❍
│${prefix} wanted
│${prefix} ad
│${prefix} beautiful
│${prefix} blur
│${prefix} rip
│${prefix} jail
│${prefix} crown
╰─┬────❍
╭─┴❍「 ɢғx ᴍᴀᴋᴇʀ 」❍
│${prefix} carbon
│${prefix} gfx
│${prefix} gfx1
│${prefix} gfx2
│${prefix} gfx3
│${prefix} gfx4
│${prefix} gfx5
│${prefix} gfx6
│${prefix} gfx7
│${prefix} gfx8
│${prefix} gfx9
│${prefix} gfx10
│${prefix} gfx11
╰─────────────❍
ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʟᴏʀᴅ ᴊᴏᴇʟ
`;

            // Message Configuration
            const menuMessage = {
                image: { url: "https://files.catbox.moe/yr339d.jpg" },
                caption: menuText,
                contextInfo: {
                    isForwarded: true,
                    forwardingScore: 999,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363289379419860@newsletter",
                        newsletterName: "popkidxmd",
                        serverMessageId: -1
                    },
                    externalAdReply: {
                        title: "popkid",
                        body: "popkidxmd",
                        thumbnailUrl: "https://files.catbox.moe/yr339d.jpg",
                        sourceUrl: "https://whatsapp.com/channel/0029VacgxK96hENmSRMRxx1r",
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            };

            await socket.sendMessage(message.from, menuMessage, { quoted: message });

            // Reaction: Success
            await socket.sendMessage(message.from, {
                react: { text: '✅', key: message.key }
            });

        } catch (err) {
            console.error(err);
            await sendError("⚠️ An error occurred while sending the menu. Please try again later!");
        }
    }
};

export default LogoCmd;
