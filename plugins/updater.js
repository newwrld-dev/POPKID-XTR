import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import AdmZip from "adm-zip";
import config from '../config.cjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_OWNER = "newwrld-dev";
const REPO_NAME = "POPKID-XTR";
const BRANCH = "main";

const update = async (m, Matrix) => {
    const prefix = config.PREFIX || '.';
    const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(" ")[0].toLowerCase() : "";

    if (cmd === "update") {
        // Owner Check
        const botNumber = await Matrix.decodeJid(Matrix.user.id);
        if (m.sender !== botNumber && !config.OWNER_NAME.includes(m.pushName)) {
            return m.reply("❌ *Owner Only Command!*");
        }

        await m.React("🆕");

        try {
            const { key } = await Matrix.sendMessage(m.from, { text: "🔍 Checking for updates..." }, { quoted: m });

            // GitHub API Endpoints
            const apiCommitUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits/${BRANCH}`;
            const zipUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/archive/${BRANCH}.zip`;

            // Fetch latest commit info
            const { data: commitData } = await axios.get(apiCommitUrl, { headers: { "User-Agent": "node.js" } });
            const latestCommitHash = commitData.sha;

            // Commit Hash Persistence (Fallback File)
            const commitFile = path.join(process.cwd(), ".last_update_commit");
            const getCurrentHash = () => {
                try { return fs.existsSync(commitFile) ? fs.readFileSync(commitFile, "utf8").trim() : "unknown"; } catch { return "unknown"; }
            };

            if (getCurrentHash() === latestCommitHash) {
                await m.React("✅");
                return Matrix.sendMessage(m.from, { text: "✅ *Bot is already on the latest version!*", edit: key });
            }

            // Update details (as requested: popkid style)
            const authorName = "popkid";
            const authorEmail = "popkid@gmail.com";
            const commitDate = new Date(commitData.commit.author.date).toLocaleString();
            const commitMessage = commitData.commit.message || "No message provided";

            await Matrix.sendMessage(m.from, {
                text: `🧨 *Updating bot to latest commit*\n\n*Details:*\n👤 *Author:* ${authorName}\n📧 *Email:* ${authorEmail}\n📅 *Date:* ${commitDate}\n💬 *Message:* ${commitMessage}`,
                edit: key
            });

            // Download ZIP
            const zipPath = path.join(process.cwd(), `${REPO_NAME}-${BRANCH}.zip`);
            const tmpExtract = path.join(process.cwd(), "latest_update_tmp");

            const zipRes = await axios.get(zipUrl, { responseType: "arraybuffer", headers: { "User-Agent": "node.js" } });
            fs.writeFileSync(zipPath, zipRes.data);

            // Extract
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(tmpExtract, true);

            const sourcePath = path.join(tmpExtract, `${REPO_NAME}-${BRANCH}`);
            const destinationPath = process.cwd();

            // Copy Files while skipping sensitive/local data
            copyFolderSync(sourcePath, destinationPath, [
                "config.cjs",
                "config.js",
                "app.json",
                ".env",
                "session",
                "session.json",
                "node_modules",
                ".git"
            ]);

            // Save new hash
            fs.writeFileSync(commitFile, latestCommitHash, "utf8");

            // Cleanup
            fs.unlinkSync(zipPath);
            fs.rmSync(tmpExtract, { recursive: true, force: true });

            await Matrix.sendMessage(m.from, { text: "✅ *Update complete! Restarting to apply changes...*" });
            await m.React("🚀");

            setTimeout(() => process.exit(0), 2000);

        } catch (error) {
            console.error("Update error:", error);
            m.reply(`❌ *Update Failed:* ${error.message}`);
        }
    }
};

// Reusable Copy Helper
function copyFolderSync(source, target, skipList = []) {
    if (!fs.existsSync(source)) return;
    if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });

    for (const item of fs.readdirSync(source)) {
        if (skipList.includes(item)) continue;

        const src = path.join(source, item);
        const dest = path.join(target, item);
        const stat = fs.lstatSync(src);

        if (stat.isDirectory()) {
            copyFolderSync(src, dest, skipList);
        } else {
            fs.copyFileSync(src, dest);
        }
    }
}

export default update;
