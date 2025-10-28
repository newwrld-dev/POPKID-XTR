const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: 'xvideo',
    desc: 'Search and download xvideos clips by query or URL',
    category: 'media',
    react: '🔍',
    filename: __filename
}, async (conn, mek, m, { from, sender, args, reply, quoted }) => {
    try {
        if (!args || args.length === 0) {
            return await conn.sendMessage(from, {
                text: '*❌ Please provide a search query or URL
Example: .xvideo mia*'
            }, { quoted: quoted || mek });
        }

        let video = null;
        let isURL = false;

        if (!args[0].startsWith('http')) {
            await conn.sendMessage(from, { react: { text: '🔍', key: mek.key } });

            const searchResponse = await axios.get(`https://saviya-kolla-api.koyeb.app/search/xvideos?query=${encodeURIComponent(args.join(' '))}`);

            if (!searchResponse.data.status || !searchResponse.data.result || searchResponse.data.result.length === 0) {
                throw new Error('No results found');
            }

            video = searchResponse.data.result[0];
        } else {
            video = args[0];
            isURL = true;
        }

        const dlResponse = await axios.get(`https://saviya-kolla-api.koyeb.app/download/xvideos?url=${encodeURIComponent(isURL ? video : video.url)}`);

        if (!dlResponse.data.status) {
            throw new Error('Download API failed');
        }

        const dl = dlResponse.data.result;

        const caption = `*📹 ${dl.title}*

⏱️ ${isURL ? '' : `Duration: ${video.duration || ''}`}
👁️ Views: ${dl.views}
👍 Likes: ${dl.likes} | 👎 Dislikes: ${dl.dislikes}

> popkid xtr 🟢`;

        await conn.sendMessage(from, {
            video: { url: dl.url },
            caption,
            mimetype: 'video/mp4'
        }, { quoted: quoted || mek });

    } catch (error) {
        console.error('❌ XVideo error:', error);
        await conn.sendMessage(from, {
            text: '*❌ Failed to fetch video*'
        }, { quoted: quoted || mek });
    }
});
