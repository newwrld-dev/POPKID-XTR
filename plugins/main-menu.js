const config = require('../config')
const { cmd, commands } = require('../command');
const path = require('path');
const os = require("os")
const fs = require('fs');
const {runtime} = require('../lib/functions')
const axios = require('axios')

cmd({
pattern: "menu2",
alias: ["allmenu","fullmenu"],
use: '.menu2',
desc: "Show all bot commands",
category: "menu",
react: "📜",
filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
try {
let totalCommands = Object.keys(commands).length;
let dec = `**┏────〘 ᴘᴏᴘᴋɪᴅ 〙───⊷** 
*┃ 🤖 Owner:* ${config.OWNER_NAME}
*┃ 📜 Commands:* ${totalCommands}
*┃ ⏱️ Runtime:* ${runtime(process.uptime())}
*┃ 📡 Baileys:* Multi Device
*┃ ☁️ Platform:* Heroku
*┃ 📦 Prefix:* ${config.PREFIX}
*┃ ⚙️ Mode:* ${config.MODE}
*┃ 🏷️ Version:* 1.0.0 Bᴇᴛᴀ
*┗──────────────⊷*

*┏────〘 ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ〙───⊷*
*┃ facebook*
*┃ mediafire*
*┃ tiktok*
*┃ twitter*
*┃ insta*
*┃ apk*
*┃ img*
*┃ tt2*
*┃ pins*
*┃ apk2*
*┃ fb2*
*┃ pinterest*
*┃ spotify*
*┃ play*
*┃ play2*
*┃ audio*
*┃ video*
*┃ video2*
*┃ ytmp3*
*┃ ytmp4*
*┃ song*
*┃ darama*
*┃ gdrive*
*┃ ssweb*
*┃ tiks*
*┗──────────────⊷*

*┏────〘 ɢʀᴏᴜᴘ ᴍᴇɴᴜ 〙───⊷*
*┃ grouplink*
*┃ kickall*
*┃ kickall2*
*┃ kickall3*
*┃ add*
*┃ remove*
*┃ kick*
*┃ promote*
*┃ demote*
*┃ dismiss*
*┃ revoke*
*┃ setgoodbye*
*┃ setwelcome*
*┃ delete*
*┃ getpic*
*┃ ginfo*
*┃ disappear on*
*┃ disappear off*
*┃ disappear 7D,24H*
*┃ allreq*
*┃ updategname*
*┃ updategdesc*
*┃ joinrequests*
*┃ senddm*
*┃ nikal*
*┃ mute*
*┃ unmute*
*┃ lockgc*
*┃ unlockgc*
*┃ invite*
*┃ tag*
*┃ hidetag*
*┃ tagall*
*┃ tagadmins*
*┗──────────────⊷*

*┏────〘 sᴇᴛᴛɪɴɢ ᴍᴇɴᴜ 〙───⊷*
*┃ .prefix new prefix*  
*┃ .botname name*   
*┃ .ownername name*
*┃ .botimage reply to image*
*┃ .mode [public/private]* 
*┃ .autoreact [on/off]* 
*┃ .autoreply [on/off]*
*┃ .autosticker [on/off]*
*┃ .autotyping [on/off]*   
*┃ .autostatusview [on/off]*  
*┃ .autostatusreact [on/off]* 
*┃ .autostatusreply [on/off]*  
*┃ .autorecoding [on/off]* 
*┃ .alwaysonline [on/off]*
*┃ .welcome [on/off]*   
*┃ .goodbye [on/off]*   
*┃ .antilink [on/off]* 
*┃ .antilinkkick [on/off]*  
*┃ .deletelink [on/off]*
*┃ .antibad [on/off]*   
*┃ .antibot [on/off]* 
*┃ .read-message [on/off]*  
*┃ .mention-reply [on/off]*  
*┃ .admin-action [on/off]* 
*┃ .creact [on/off]*
*┃ .cemojis [❤️,🧡,💛]* 
*┗──────────────⊷*

*┏────〘 ᴀᴜᴅɪᴏᴇɴᴜ〙───⊷*
*┃ .bass*
*┃ .slow* 
*┃ .fast*
*┃ .reverse*
*┃ .baby* 
*┃ .demon*
*┃ .earrape*  
*┃ .nightcore*
*┃ .robot* 
*┃ .chipmunk* 
*┃ .radio* 
*┃ .blown* 
*┃ .tupai*   
*┃ .fat* 
*┃ .smooth*
*┃ .deep*
*┗──────────────⊷*

*┏────〘 ʀᴇᴀᴄᴛɪᴏɴ ᴍᴇɴᴜ 〙───⊷*
*┃ bully @tag*
*┃ cuddle @tag*
*┃ cry @tag*
*┃ hug @tag*
*┃ awoo @tag*
*┃ kiss @tag*
*┃ lick @tag*
*┃ pat @tag*
*┃ smug @tag*
*┃ bonk @tag*
*┃ yeet @tag*
*┃ blush @tag*
*┃ smile @tag*
*┃ wave @tag*
*┃ highfive @tag*
*┃ handhold @tag*
*┃ nom @tag*
*┃ bite @tag*
*┃ glomp @tag*
*┃ slap @tag*
*┃ kill @tag*
*┃ happy @tag*
*┃ wink @tag*
*┃ poke @tag*
*┃ dance @tag*
*┃ cringe @tag*
*┗──────────────⊷*

*┏────〘 ʟᴏɢᴏ ᴍᴇɴᴜ 〙───⊷*
*┃ neonlight*
*┃ blackpink*
*┃ dragonball*
*┃ 3dcomic*
*┃ america*
*┃ naruto*
*┃ sadgirl*
*┃ clouds*
*┃ futuristic*
*┃ 3dpaper*
*┃ eraser*
*┃ sunset*
*┃ leaf*
*┃ galaxy*
*┃ sans*
*┃ boom*
*┃ hacker*
*┃ devilwings*
*┃ nigeria*
*┃ bulb*
*┃ angelwings*
*┃ zodiac*
*┃ luxury*
*┃ paint*
*┃ frozen*
*┃ castle*
*┃ tatoo*
*┃ valorant*
*┃ bear*
*┃ typography*
*┃ birthday*
*┗──────────────⊷*

*┏────〘 ᴏᴡɴᴇʀ ᴍᴇɴᴜ 〙───⊷*
*┃ owner*
*┃ menu*
*┃ menu2*
*┃ vv*
*┃ listcmd*
*┃ allmenu*
*┃ repo*
*┃ block*
*┃ unblock*
*┃ fullpp*
*┃ setpp*
*┃ restart*
*┃ shutdown*
*┃ updatecmd*
*┃ alive*
*┃ ping*
*┃ gjid*
*┃ jid*
*┗──────────────⊷*

*┏────〘 ғᴜɴ ᴍᴇɴᴜ 〙───⊷*
*┃ shapar*
*┃ rate*
*┃ insult*
*┃ hack*
*┃ ship*
*┃ character*
*┃ pickup*
*┃ joke*
*┃ hrt*
*┃ hpy*
*┃ syd*
*┃ anger*
*┃ shy*
*┃ kiss*
*┃ mon*
*┃ cunfuzed*
*┃ setpp*
*┃ hand*
*┃ nikal*
*┃ hold*
*┃ hug*
*┃ nikal*
*┃ hifi*
*┃ poke*
*┗──────────────⊷*

*┏────〘 ᴄᴏɴᴠᴇʀᴛᴇʀ ᴍᴇɴᴜ 〙───⊷*
*┃ sticker*
*┃ sticker2*
*┃ emojimix*
*┃ fancy*
*┃ take*
*┃ tomp3*
*┃ tts*
*┃ trt*
*┃ base64*
*┃ unbase64*
*┃ binary*
*┃ dbinary*
*┃ tinyurl*
*┃ urldecode*
*┃ urlencode*
*┃ url*
*┃ repeat*
*┃ ask*
*┃ readmore*
*┗──────────────⊷*

*┏────〘 ᴀɪ ᴍᴇɴᴜ 〙───⊷*
*┃ ai*
*┃ gpt3*
*┃ gpt2*
*┃ gptmini*
*┃ gpt*
*┃ meta*
*┃ blackbox*
*┃ luma*
*┃ dj*
*┃ immu*
*┃ askimad*
*┃ gpt4*
*┃ bing*
*┃ imagine*
*┃ imagine2*
*┃ copilot*
*┗──────────────⊷*

*┏────〘 ᴍᴀɪɴ ᴍᴇɴᴜ 〙───⊷*
*┃ ping*
*┃ ping2*
*┃ speed*
*┃ live*
*┃ alive*
*┃ runtime*
*┃ uptime*
*┃ repo*
*┃ owner*
*┃ menu*
*┃ menu2*
*┃ restart*
*┗──────────────⊷*

**┏────〘 ᴀɴɪᴍᴇ ᴍᴇɴᴜ 〙───⊷* 
*┃ fack*
*┃ truth*
*┃ dare*
*┃ dog*
*┃ awoo*
*┃ garl*
*┃ waifu*
*┃ neko*
*┃ megnumin*
*┃ neko*
*┃ maid*
*┃ loli*
*┃ animegirl*
*┃ animegirl1*
*┃ animegirl2*
*┃ animegirl3*
*┃ animegirl4*
*┃ animegirl5*
*┃ anime1*
*┃ anime2*
*┃ anime3*
*┃ anime4*
*┃ anime5*
*┃ animenews*
*┃ foxgirl*
*┃ naruto*
*┗──────────────⊷*

*┏────〘 ᴏᴛʜᴇʀ ᴍᴇɴᴜ 〙───⊷**
*┃ timenow*
*┃ date*
*┃ count*
*┃ calculate*
*┃ countx*
*┃ flip*
*┃ coinflip*
*┃ rcolor*
*┃ roll*
*┃ fact*
*┃ cpp*
*┃ rw*
*┃ pair*
*┃ pair2*
*┃ pair3*
*┃ fancy*
*┃ logo*
*┃ define*
*┃ news*
*┃ movie*
*┃ weather*
*┃ srepo*
*┃ insult*
*┃ save*
*┃ wikipedia*
*┃ gpass*
*┃ githubstalk*
*┃ yts*
*┃ ytv*
*┗──────────────⊷*

${config.DESCRIPTION}`;

await conn.sendMessage(from, { 
    image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/kiy0hl.jpg' }, 
    caption: dec, 
    contextInfo: { 
        mentionedJid: [m.sender], 
        forwardingScore: 999, 
        isForwarded: true, 
        forwardedNewsletterMessageInfo: { 
            newsletterJid: '120363289379419860@newsletter', 
            newsletterName: config.BOT_NAME, 
            serverMessageId: 143 
        } 
    } 
}, { quoted: mek });

} catch (e) { 
    console.log(e); 
    reply(`Error: ${e}`); 
} 
});
