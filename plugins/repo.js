import config from '../config.cjs';
import axios from 'axios';

const repo = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';

  if (cmd === "repo") {
    const args = m.body.slice(prefix.length + cmd.length).trim().split(' ');
    const repoInput = args[0] || 'popkidmd/POPKID-MD';
    
    // GitHub API token (optional, add to config for better rate limits)
    const GITHUB_TOKEN = config.GITHUB_TOKEN || '';
    
    // Repository emoji sets
    const repoEmojis = ['📦', '💻', '⚡', '🚀', '🔧', '🎯', '🌟', '📚'];
    const statusEmojis = ['🟢', '🟡', '🔵', '🟣', '⚫'];
    
    const repoEmoji = repoEmojis[Math.floor(Math.random() * repoEmojis.length)];

    // Parse repository input
    let repoName, owner;
    try {
      // Check if input is a URL
      if (repoInput.includes('github.com')) {
        const urlMatch = repoInput.match(/github\.com\/([^\/]+)\/([^\/\s]+)/);
        if (urlMatch) {
          owner = urlMatch[1];
          repoName = urlMatch[2].replace('.git', '');
        } else {
          throw new Error('Invalid GitHub URL format');
        }
      } else if (repoInput.includes('/')) {
        // Input is in format "owner/repo"
        const parts = repoInput.split('/');
        owner = parts[0];
        repoName = parts[1].replace('.git', '');
      } else {
        // Invalid format, use default
        throw new Error('Invalid format');
      }
    } catch (e) {
      // Default repository
      owner = 'popkidmd';
      repoName = 'POPKID-MD';
    }

    // Add initial reaction
    try {
      await m.React(repoEmoji);
    } catch (reactError) {
      console.log('Reaction failed, continuing...');
    }

    // Create loading message
    let loadingMessage;
    try {
      loadingMessage = await Matrix.sendMessage(m.from, {
        text: `*${repoEmoji} Fetching repository data...*\n\n` +
              `🔍 *Repository:* \`${owner}/${repoName}\`\n` +
              `📡 *Status:* Connecting to GitHub API...\n\n` +
              `_Please wait a moment..._`,
        contextInfo: {
          mentionedJid: [m.sender]
        }
      }, { quoted: m });
    } catch (sendError) {
      console.error('Failed to send loading message:', sendError);
      return;
    }

    try {
      // Fetch real data from GitHub API
      const headers = {
        'User-Agent': 'POPKIDSPEED-Bot'
      };
      
      if (GITHUB_TOKEN) {
        headers['Authorization'] = `token ${GITHUB_TOKEN}`;
      }

      // Update loading message
      try {
        await Matrix.sendMessage(m.from, {
          text: `*${repoEmoji} Fetching repository data...*\n\n` +
                `🔍 *Repository:* \`${owner}/${repoName}\`\n` +
                `📡 *Status:* Fetching repository info...\n` +
                `⏳ *Progress:* ▰▰▰▱▱▱ 50%\n\n` +
                `_Fetching real-time data from GitHub..._`,
          edit: loadingMessage.key
        });
      } catch (updateError) {
        console.log('Failed to update loading message:', updateError);
      }

      // Fetch repository data
      const repoResponse = await axios.get(
        `https://api.github.com/repos/${owner}/${repoName}`,
        { 
          headers, 
          timeout: 15000,
          validateStatus: function (status) {
            return status < 500; // Resolve only if status code is less than 500
          }
        }
      );

      // Check if request was successful
      if (repoResponse.status !== 200) {
        throw new Error(`GitHub API returned status ${repoResponse.status}: ${repoResponse.statusText}`);
      }

      const repoData = repoResponse.data;

      // Fetch languages (optional, to show main language)
      let mainLanguage = 'Not specified';
      try {
        const langResponse = await axios.get(
          `https://api.github.com/repos/${owner}/${repoName}/languages`,
          { 
            headers, 
            timeout: 5000,
            validateStatus: function (status) {
              return status < 500;
            }
          }
        );
        
        if (langResponse.status === 200) {
          const languages = Object.keys(langResponse.data);
          if (languages.length > 0) {
            // Get the language with the most bytes
            const sortedLanguages = Object.entries(langResponse.data)
              .sort(([,a], [,b]) => b - a);
            mainLanguage = sortedLanguages[0][0];
          }
        }
      } catch (langError) {
        console.log('Language fetch failed, using default');
      }

      // Get repository status emoji based on activity
      const lastUpdated = new Date(repoData.updated_at);
      const now = new Date();
      const daysSinceUpdate = Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24));
      
      let statusEmoji = statusEmojis[0]; // 🟢
      if (daysSinceUpdate > 180) statusEmoji = statusEmojis[4]; // ⚫ Archived
      else if (daysSinceUpdate > 90) statusEmoji = statusEmojis[3]; // 🟣 Stale
      else if (daysSinceUpdate > 30) statusEmoji = statusEmojis[2]; // 🔵 Moderate
      else if (daysSinceUpdate > 7) statusEmoji = statusEmojis[1]; // 🟡 Recent

      // Format numbers
      const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toString();
      };

      // Calculate repository age
      const createdDate = new Date(repoData.created_at);
      const repoAgeDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
      const repoAgeYears = Math.floor(repoAgeDays / 365);
      const repoAgeMonths = Math.floor((repoAgeDays % 365) / 30);

      // Prepare repository age text
      let repoAgeText = '';
      if (repoAgeYears > 0) {
        repoAgeText = `${repoAgeYears}y ${repoAgeMonths}m`;
      } else {
        repoAgeText = `${repoAgeMonths}m`;
      }

      // Prepare final message
      const finalMessage = {
        text: `*${repoEmoji} ${repoData.name}* ${repoEmoji}\n\n` +
              `📖 *Description:* ${repoData.description || 'No description'}\n` +
              `👤 *Owner:* ${repoData.owner.login}\n` +
              `🌐 *URL:* ${repoData.html_url}\n\n` +
              
              `📊 *Statistics:*\n` +
              `⭐ Stars: *${formatNumber(repoData.stargazers_count)}*\n` +
              `🔀 Forks: *${formatNumber(repoData.forks_count)}*\n` +
              `👁️ Watchers: *${formatNumber(repoData.watchers_count)}*\n` +
              `📦 Size: *${Math.round(repoData.size / 1024 * 10) / 10} MB*\n\n` +
              
              `⚙️ *Details:*\n` +
              `💻 Language: *${mainLanguage}*\n` +
              `📜 License: *${repoData.license?.name || 'Not specified'}*\n` +
              `${statusEmoji} Status: *${repoData.archived ? 'Archived' : 'Active'}*\n` +
              `📅 Created: *${repoAgeText} ago*\n` +
              `🔄 Updated: *${daysSinceUpdate === 0 ? 'Today' : daysSinceUpdate === 1 ? 'Yesterday' : `${daysSinceUpdate} days ago`}*\n\n` +
              
              `🔗 *Quick Actions:*\n` +
              `▸ View on GitHub: ${repoData.html_url}\n` +
              `▸ Clone: git clone ${repoData.clone_url}\n` +
              `▸ Issues: ${repoData.html_url}/issues\n\n` +
              
              `_Data fetched in real-time from GitHub API • ${new Date().toLocaleTimeString()}_`,
        edit: loadingMessage.key,
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363289379419860@newsletter',
            newsletterName: "popkid Updates",
            serverMessageId: Math.floor(Math.random() * 1000) + 1000
          },
          externalAdReply: {
            title: `${owner}/${repoName}`,
            body: `Repository Statistics • Forwarded many times`,
            mediaType: 1,
            thumbnailUrl: repoData.owner.avatar_url,
            sourceUrl: repoData.html_url,
            renderLargerThumbnail: true
          }
        }
      };

      // Send final message
      await Matrix.sendMessage(m.from, finalMessage);

      // Add success reaction
      try {
        await m.React('✅');
      } catch (reactError) {
        console.log('Success reaction failed');
      }

    } catch (error) {
      console.error('GitHub API Error:', error.message);
      
      // Error handling
      let errorMessage = `*❌ Error fetching repository data*\n\n`;
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage += `Repository \`${owner}/${repoName}\` not found.\n`;
          errorMessage += `Please check the repository name and try again.`;
        } else if (error.response.status === 403) {
          errorMessage += `GitHub API rate limit exceeded.\n`;
          errorMessage += `Try again in a few minutes.`;
          if (!GITHUB_TOKEN) {
            errorMessage += `\nAdd a GitHub token to config for higher limits.`;
          }
        } else {
          errorMessage += `GitHub API error: ${error.response.status} ${error.response.statusText}`;
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage += `Request timeout.\n`;
        errorMessage += `GitHub API is taking too long to respond.`;
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        errorMessage += `Cannot connect to GitHub API.\n`;
        errorMessage += `Check your internet connection.`;
      } else {
        errorMessage += `Error: ${error.message}`;
      }
      
      errorMessage += `\n\nDefaulting to: *popkidmd/POPKID-MD*`;
      
      // Send error message with forwarding context
      try {
        await Matrix.sendMessage(m.from, {
          text: errorMessage,
          edit: loadingMessage.key,
          contextInfo: {
            mentionedJid: [m.sender],
            forwardingScore: 999999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363289379419860@newsletter',
              newsletterName: "Reports",
              serverMessageId: 999
            }
          }
        });
      } catch (sendError) {
        console.error('Failed to send error message:', sendError);
      }
      
      try {
        await m.React('❌');
      } catch (reactError) {
        console.log('Error reaction failed');
      }
    }
  }
};

export default repo;
