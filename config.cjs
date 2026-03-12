const fs = require("fs");
require("dotenv").config();

const config = {
  SESSION_ID: process.env.SESSION_ID || "POPKID~;;;H4sIAAAAAAAAA5VUXa+iSBD9K5t+1YwioEhykwUUREVAxK/NPLTQYAs2CA0IE//EPm+yf3F/wgbvvXMnm+zsXZ6a6krVqTrn9DdAEpyjBaqB+A2kGS4hRe2R1ikCIpCLIEAZ6AIfUghEcLN8FC7XkmJzaRWgIiXB7hAcZnK6VxzWzY5aPyPsFM8Z9wU8uiAtTjH2flLQmyYr3gigd1JUaI0lt6ELemY358XNsOuBykrHQuBXauNwL+DRVoQ4wyScpmd0RRmMF6i2IM4+B3+4MMaE05DbmXcOo1XdZ7VJkXseCVR+Ll9itucUhcOal1j6HPyJM1F6jpqX7GkSW/WlNzedcqBvrxZX37YKTKwJp1yamb6rXuHnOCTI131EKKb1p/cumCV/UGdsMRc2bK3xF9vaLw+Krgc+mqvVUb30TjY5T+8u9zngGKFqtfcgnwYDSNZqfl3WfjLPhTtKz5KeHnBhL5EzMcLwR+BW9q6V6P/sPdJvobXSFmZ5UoZyVBVGHNTS2DGZzbjD2SwXeiW2J/5km38Ofq1opT7UuDqqmPBIPT7fuVBjtYFwYYSE1aUwn4/6tT1m3Q/4kBbZz1BylDvvcOp2NgxZO4WhSMG4OGxvaoed1kGMC6IuRwe0Od420arn6lcNrcJhc4zwNV3KnlmVldtxm751GRkRiYvh3jAm4ctzogjVug9E5tEFGQpxTjNIcULamNAF0C8d5GWIPpcLmuPML5e6W2zseXUVtt5C5+5HRZjVQgB7pjRiep5xg53B1HgBXZBmiYfyHPkznNMkqw2U5zBEORB/+9oFBN3pK21tM5bpggBnOXVJkcYJ9N85fb+EnpcUhDo18ZT2gDIg9j/CiFJMwrzdYkFg5p1xiZQzpDkQAxjn6Pt8KEM+EGlWoO+eVRK/Xftw6agzc70DXXB90oF9IIIBzzEMwwr8iBuJXP/X/EvVloVp+oUgCrogfqaxY14YjAfMeMAJzKBNbONdQGBbC6RJGmH/lwj99efvf7R7f8PdtvERhTjOgQgUa98UN0mbrjSlyvuaJlWhpIQS+JjzXS6vhESlWd632swwhku77w53p+ttPTJk2eivlYNqYk+Kz6OpakyehPyzCBBBPrzfN55KKiMaD2Vu7Dm2FJBqORve+UxRLGl/LdbjGC+Pg3kmKw6Doyo2k+3WjI7buzoItPEyDE2LU4tTGq7deN1fSNJL281HJfbQj8348H7ZsD25coKaSTwyCtbbg9ZhY/kwtwR2j1l2txOgLC1mS6ZAqYxvdlkv7IYsGtukTf+0Udwq5kiq9JTwiAVXF6TqVchPI8VvDxh+iqxlsP0NMHq+B29c/Cejr8Bb4fUf3R9qvL0w/+JS+bhsMmG7PjcTE/dXqhlf+VuEGsnerKb2Vd4kRJof0F3eSA14PL52QRpDGiTZFYgAEj9LnoLJkqJVsk6C5CfNFKmvT8NQbyePYU6lD3ds8BXlFF5TIDKjEcuMeKb1T5tlZUk6g/kZiMDaRbzcKr2W0tShkL57DUjtZyosePwNdhkGgIUHAAA=",
  PREFIX: process.env.PREFIX || '.',
  BOT_NAME: process.env.BOT_NAME || "POPKID-XMD",
  BOT: process.env.BOT || "hello 👋",
  NEW_CMD: process.env.NEW_CMD || "ᴀᴅᴅᴠᴀʀ\n│ sᴜᴅᴏ\n| popkid",
  CAPTION: process.env.CAPTION || "ᴘᴏᴡᴇʀᴇᴅ ʙʏ popkid",
  AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN !== undefined ? process.env.AUTO_STATUS_SEEN === 'true' : true,
  AUTO_BIO: process.env.AUTO_BIO !== undefined ? process.env.AUTO_BIO === 'true' : true,
  AUTO_STATUS_REACT: process.env.AUTO_STATUS_REACT !== undefined ? process.env.AUTO_STATUS_REACT === 'true' : true,
  ANTI_LEFT: process.env.ANTI_LEFT !== undefined ? process.env.ANTI_LEFT === 'true' : true,
  AUTOLIKE_EMOJI: process.env.AUTOLIKE_EMOJI || '💙',
  AUTO_REPLY_STATUS: process.env.AUTO_REPLY_STATUS !== undefined ? process.env.AUTO_REPLY_STATUS === 'true' : false,
  STATUS_READ_MSG: process.env.STATUS_READ_MSG || 'Status Viewed by popkid',
  VOICE_CHAT_BOT: process.env.VOICE_CHAT_BOT !== undefined ? process.env.VOICE_CHAT_BOT === 'true' : false,
  ANTILINK: process.env.ANTILINK !== undefined ? process.env.ANTILINK === 'true' : false,
  AUTO_STICKER: process.env.AUTO_STICKER !== undefined ? process.env.AUTO_STICKER === 'true' : false,
  AUTO_READ: process.env.AUTO_READ !== undefined ? process.env.AUTO_READ === 'true' : false,
  AUTO_TYPING: process.env.AUTO_TYPING !== undefined ? process.env.AUTO_TYPING === 'true' : false,
  AUTO_RECORDING: process.env.AUTO_RECORDING !== undefined ? process.env.AUTO_RECORDING === 'true' : false,
  ALWAYS_ONLINE: process.env.ALWAYS_ONLINE !== undefined ? process.env.ALWAYS_ONLINE === 'true' : false,
  AUTO_REACT: process.env.AUTO_REACT !== undefined ? process.env.AUTO_REACT === 'true' : false,
  AUTO_BLOCK: process.env.AUTO_BLOCK !== undefined ? process.env.AUTO_BLOCK === 'true' : true,
  ANTI_DELETE: process.env.ANTI_DELETE !== undefined ? process.env.ANTI_DELETE === 'true' : false,
  CHAT_BOT: process.env.CHAT_BOT !== undefined ? process.env.CHAT_BOT === 'true' : false,
  AUTO_STATUS_MSG: process.env.AUTO_STATUS_MSG || "hello",
  LYDEA: process.env.LYDEA !== undefined ? process.env.LYDEA === 'true' : false,
  REJECT_CALL: process.env.REJECT_CALL !== undefined ? process.env.REJECT_CALL === 'true' : false,
  NOT_ALLOW: process.env.NOT_ALLOW !== undefined ? process.env.NOT_ALLOW === 'true' : true,
  MODE: process.env.MODE || "public",
  DELETED_MESSAGES_CHAT_ID: process.env.DELETED_MESSAGES_CHAT_ID || "254732297194@s.whatsapp.net",
  OWNER_NAME: process.env.OWNER_NAME || "popkid",
  OWNER_NUMBER: process.env.OWNER_NUMBER || "254732297194",
  SUDO_NUMBER: process.env.SUDO_NUMBER || "254732297194",
  GEMINI_KEY: process.env.GEMINI_KEY || "AIzaSyCUPaxfIdZawsKZKqCqJcC-GWiQPCXKTDc",
  WELCOME: process.env.WELCOME !== undefined ? process.env.WELCOME === 'true' : false,

  // ✅ Nouveau : antibot
  ANTIBOT: process.env.ANTIBOT !== undefined ? process.env.ANTIBOT === 'true' : false,
  ANTIBOT_WARNINGS: parseInt(process.env.ANTIBOT_WARNINGS) || 3
};

module.exports = config;
