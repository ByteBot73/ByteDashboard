// schemas/welcomeConfig.js
const mongoose = require('mongoose');

const welcomeConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  channelId: { type: String, required: true },
  message: { type: String, required: true }
});

module.exports = mongoose.model('WelcomeConfig', welcomeConfigSchema);
