import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import AdmZip from "adm-zip";
import config from '../config.cjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants for your Repository
const REPO_OWNER = "newwrld-dev";
const REPO_NAME = "POPKID-XTR";
const GITHUB_API = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits/main`;
const ZIP_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}/archive/refs/heads/main.zip`;

const update = async (m, Matrix) => {
    const prefix = config.PREFIX || '.';
    const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(" ")[0].toLowerCase() : "";

    if (cmd === "update") {
        // Validation: Only Owner or Bot itself
        const botNumber = await Matrix.decodeJid(Matrix.user.id);
        if (m.sender !== botNumber && !config.OWNER_NAME.includes(m.pushName)) {
            return m.reply("❌ *This command is restricted to the Bot Owner.*");
        }

        await m.React("⏳");

        try {
            const { key } = await Matrix.sendMessage(m.from, { text: "```🔍 Checking for updates...```" }, { quoted: m });

            const editMessage = async (newText) => {
                await Matrix.sendMessage(m.from, { text: newText, edit: key });
            };

            // 1. Check for updates
            const { data: commitData } = await axios.get(GITHUB_API);
            const latestCommitHash = commitData.sha;

            const packageJsonPath = path.join(process.cwd(), "package.json");
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
            const currentHash = packageJson.commitHash || "unknown";

            if (latestCommitHash === currentHash) {
                await m.React("✅");
                return editMessage("```✅ Your bot is already on the latest version!```");
            }

            await editMessage("```🚀 New update detected! Downloading...```");

            // 2. Download ZIP
            const zipPath = path.join(process.cwd(), "temp_update.zip");
            const response = await axios({
                method: 'get',
                url: ZIP_URL,
                responseType: 'arraybuffer'
            });
            fs.writeFileSync(zipPath, response.data);

            await editMessage("```📦 Extracting files...```");

            // 3. Extracting
            const zip = new AdmZip(zipPath);
            const extractPath = path.join(process.cwd(), "temp_extract");
            zip.extractAllTo(extractPath, true);

            await editMessage("```🔄 Applying changes...```");

            // The folder inside GitHub ZIPs is usually "REPO_NAME-main"
            const sourcePath = path.join(extractPath, `${REPO_NAME}-main`);
            
            // 4. Copy Files (Skips config and sensitive data)
            await copyFolderSync(sourcePath, process.cwd(), ['package.json', 'config.cjs', '.env', 'node_modules', '.git']);

            // 5. Update local hash in package.json
            packageJson.commitHash = latestCommitHash;
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

            // Cleanup
            fs.unlinkSync(zipPath);
            fs.rmSync(extractPath, { recursive: true, force: true });

            await editMessage("```✅ Update successful! Restarting to apply changes...```");
            await m.React("✅");

            setTimeout(() => process.exit(0), 3000);

        } catch (error) {
            console.error(error);
            await m.React("❌");
            m.reply(`❌ *Update Failed:* ${error.message}`);
        }
    }
};

// Recursive function to copy updated files
async function copyFolderSync(source, target, filesToSkip = []) {
    if (!fs.existsSync(source)) return;
    if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });

    const items = fs.readdirSync(source);
    for (const item of items) {
        const srcPath = path.join(source, item);
        const destPath = path.join(target, item);

        if (filesToSkip.includes(item)) continue;

        if (fs.lstatSync(srcPath).isDirectory()) {
            await copyFolderSync(srcPath, destPath, filesToSkip);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

export default update;
