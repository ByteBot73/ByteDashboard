// index.js - Express backend for Discord bot dashboard
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const axios = require('axios');
const mongoose = require('mongoose');
const cors = require('cors');
// Use the correct schema path for WelcomeConfig and LeaveConfig
const WelcomeConfig = require('./schemas/welcomeConfig');
const LeaveConfig = require('./schemas/leaveConfig');

const app = express();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(express.json());

// Trust proxy for correct secure cookies on Render/Heroku
app.set('trust proxy', 1);

app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true in production (HTTPS)
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));
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

// CORS middleware
app.use(cors({
  origin: [
    'https://bytedashboard.onrender.com',
    'http://localhost:3000'
  ],
  credentials: true
}));

// Auth routes
app.get('/login', passport.authenticate('discord'));
app.get('/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => {
  console.log('Callback route hit!');
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

// API: Send message to channel (requires bot in server)
app.post('/api/send', async (req, res) => {
  const { guildId, channelId, message } = req.body;
  try {
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

// API: Get channels for a guild
app.get('/api/guild/:guildId/channels', async (req, res) => {
  try {
    const { guildId } = req.params;
    const response = await axios.get(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` }
    });
    res.json({ channels: response.data });
  } catch (err) {
    console.error('Error fetching channels:', err.response ? err.response.data : err.message);
    res.status(500).json({ channels: [], error: err.response ? err.response.data : err.message });
  }
});

// API: Save welcome config
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

// API: Save leave config
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

// API: Get welcome config for a guild
app.get('/api/welcome-config/:guildId', async (req, res) => {
  try {
    const config = await WelcomeConfig.findOne({ guildId: req.params.guildId });
    res.json({ config });
  } catch (err) {
    res.json({ config: null });
  }
});

// API: Get leave config for a guild
app.get('/api/leave-config/:guildId', async (req, res) => {
  try {
    const config = await LeaveConfig.findOne({ guildId: req.params.guildId });
    res.json({ config });
  } catch (err) {
    res.json({ config: null });
  }
});

// Serve static files (only for frontend assets, must be last)
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Dashboard running on http://localhost:${PORT}`));
