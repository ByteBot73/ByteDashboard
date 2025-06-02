require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const axios = require('axios');
const path = require('path');
const mongoose = require('mongoose');
const WelcomeConfig = require('./schemas/welcomeConfig');
const LeaveConfig = require('./schemas/leaveConfig');

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb+srv://ByteDatabase:VNlc3bn9PaHg0dRp@bytedatabase.86e4oyx.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: process.env.DISCORD_CALLBACK_URL,
  scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
  process.nextTick(() => done(null, profile));
}));

// Static files
app.use(express.static(__dirname));

// Auth routes
app.get('/login', passport.authenticate('discord'));
app.get('/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => {
  res.redirect('/dashboard.html');
});
app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

// API: Get user info
app.get('/api/user', (req, res) => {
  if (!req.isAuthenticated()) return res.json({ user: null });
  res.json({ user: req.user });
});

// API: Get user guilds
app.get('/api/guilds', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not logged in' });
  try {
    // Get bot's guilds from Discord API
    const botGuildsRes = await axios.get('https://discord.com/api/v10/users/@me/guilds', {
      headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` }
    });
    const botGuildIds = botGuildsRes.data.map(g => g.id);
    const guilds = req.user.guilds
      .filter(g => g.owner)
      .map(g => ({
        ...g,
        botInGuild: botGuildIds.includes(g.id)
      }));
    res.json({ guilds });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bot guilds' });
  }
});

// API: Invite link
app.get('/api/invite', (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const permissions = '8'; // Admin
  const invite = `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot+applications.commands&permissions=${permissions}`;
  res.json({ invite });
});

// API: Send message to channel (dummy, to be implemented with bot token)
app.use(express.json());
app.post('/api/send', async (req, res) => {
  const { guildId, channelId, message } = req.body;
  try {
    // Use discord.js to send the message
    const { Client, GatewayIntentBits } = require('discord.js');
    if (!global._dashboardBotClient) {
      const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
      await client.login(process.env.BOT_TOKEN);
      global._dashboardBotClient = client;
    }
    const client = global._dashboardBotClient;
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) throw new Error('Channel not found or not text-based');
    await channel.send(message);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// API: Get channels for a guild (real Discord API)
app.get('/api/guild/:guildId/channels', async (req, res) => {
  try {
    const { guildId } = req.params;
    const response = await axios.get(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` }
    });
    res.json({ channels: response.data });
  } catch (err) {
    res.status(500).json({ channels: [] });
  }
});

// API: Save welcome channel configuration
app.post('/api/welcome-config', async (req, res) => {
  const { guildId, channelId, message } = req.body;
  try {
    await WelcomeConfig.findOneAndUpdate(
      { guildId },
      { channelId, message },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// API: Save leave channel configuration
app.post('/api/leave-config', async (req, res) => {
  const { guildId, channelId, message } = req.body;
  try {
    await LeaveConfig.findOneAndUpdate(
      { guildId },
      { channelId, message },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Dashboard running on http://localhost:${PORT}`));
