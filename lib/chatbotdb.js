const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "chatbot_state.json");

// Load current state
function loadState() {
    try {
        if (!fs.existsSync(filePath)) return { IB: "false", GC: "false" };
        const data = fs.readFileSync(filePath);
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading chatbot state:", err);
        return { IB: "false", GC: "false" };
    }
}

// Save state
function saveState(state) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
    } catch (err) {
        console.error("Error saving chatbot state:", err);
    }
}

module.exports = { loadState, saveState };
