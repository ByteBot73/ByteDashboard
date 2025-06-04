// server.js - Handles server config page (test, welcome, leave)

document.addEventListener('DOMContentLoaded', async () => {
  const userAvatar = document.getElementById('userAvatar');
  const userMenu = document.getElementById('userMenu');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const logoutBtn = document.getElementById('logoutBtn');
  const testBtn = document.getElementById('testBtn');
  const welcomeBtn = document.getElementById('welcomeBtn');
  const leaveBtn = document.getElementById('leaveBtn');
  const testSection = document.getElementById('testSection');
  const welcomeSection = document.getElementById('welcomeSection');
  const leaveSection = document.getElementById('leaveSection');
  const notification = document.getElementById('notification');

  // User info
  const userRes = await fetch('https://thenewdashboard.onrender.com/api/user', { credentials: 'include' });
  const userData = await userRes.json();
  if (userData.user) {
    userAvatar.src = userData.user.avatar ? `https://cdn.discordapp.com/avatars/${userData.user.id}/${userData.user.avatar}.png` : '/default-avatar.png';
    userAvatar.style.display = 'inline-block';
  } else {
    window.location.href = '/';
    return;
  }

  // Avatar dropdown
  userAvatar.addEventListener('click', () => {
    dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
  });
  document.addEventListener('click', (e) => {
    if (!userMenu.contains(e.target)) dropdownMenu.style.display = 'none';
  });
  logoutBtn.addEventListener('click', () => {
    window.location.href = 'https://thennewdashboard.onrender.com/logout';
  });

  // Sidebar navigation
  testBtn.addEventListener('click', () => {
    testSection.style.display = 'block';
    welcomeSection.style.display = 'none';
    leaveSection.style.display = 'none';
    testBtn.classList.add('active');
    welcomeBtn.classList.remove('active');
    leaveBtn.classList.remove('active');
  });
  welcomeBtn.addEventListener('click', () => {
    testSection.style.display = 'none';
    welcomeSection.style.display = 'block';
    leaveSection.style.display = 'none';
    testBtn.classList.remove('active');
    welcomeBtn.classList.add('active');
    leaveBtn.classList.remove('active');
    loadWelcomeConfig();
  });
  leaveBtn.addEventListener('click', () => {
    testSection.style.display = 'none';
    welcomeSection.style.display = 'none';
    leaveSection.style.display = 'block';
    testBtn.classList.remove('active');
    welcomeBtn.classList.remove('active');
    leaveBtn.classList.add('active');
    loadLeaveConfig();
  });

  // Get guild id from URL
  const urlParams = new URLSearchParams(window.location.search);
  const guildId = urlParams.get('guild');
  if (!guildId) {
    showNotification('No guild selected.', true);
    return;
  }

  // Fetch channels for this guild
  const resChannels = await fetch(`https://thenewdashboard.onrender.com/api/guild/${guildId}/channels`);
  const dataChannels = await resChannels.json();
  const channels = (dataChannels.channels || []).filter(c => c.type === 0); // Only text channels

  // Populate channel selects
  const channelSelect = document.getElementById('channelSelect');
  const welcomeChannelSelect = document.getElementById('welcomeChannelSelect');
  const leaveChannelSelect = document.getElementById('leaveChannelSelect');
  if (channelSelect) channelSelect.innerHTML = channels.length ? '<option selected disabled>Select channel</option>' + channels.map(c => `<option value="${c.id}">${c.name}</option>`).join('') : '<option>No text channels found</option>';
  if (welcomeChannelSelect) welcomeChannelSelect.innerHTML = channels.length ? '<option selected disabled>Select channel</option>' + channels.map(c => `<option value="${c.id}">${c.name}</option>`).join('') : '<option>No text channels found</option>';
  if (leaveChannelSelect) leaveChannelSelect.innerHTML = channels.length ? '<option selected disabled>Select channel</option>' + channels.map(c => `<option value="${c.id}">${c.name}</option>`).join('') : '<option>No text channels found</option>';

  // Test the Bot form
  const testForm = document.getElementById('testForm');
  // Add cooldown for test message
  let lastTestSent = 0;
  const COOLDOWN_MS = 5000;
  if (testForm) {
    testForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastTestSent < COOLDOWN_MS) {
        showNotification('Sending too fast', true);
        return;
      }
      lastTestSent = now;
      const channelId = channelSelect.value;
      const message = document.getElementById('testMessage').value;
      const res = await fetch('https://thennewdashboard.onrender.com/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId, channelId, message })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Message sent successfully!');
        testForm.reset();
      } else {
        showNotification('Failed to send message: ' + (data.error || ''), true);
      }
    });
  }

  // Welcome config
  const configForm = document.getElementById('configForm');
  function loadWelcomeConfig() {
    fetch(`https://thennewdashboard.onrender.com/api/welcome-config/${guildId}`)
      .then(r => r.json())
      .then(data => {
        const current = document.getElementById('currentWelcomeConfig');
        if (data.config) {
          current.style.display = 'block';
          current.innerHTML = `<b>Current Channel:</b> ${channels.find(c => c.id === data.config.channelId)?.name || 'Unknown'}<br><b>Message:</b> ${data.config.message}`;
        } else {
          current.style.display = 'none';
        }
      });
  }
  if (configForm) {
    configForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const channelId = welcomeChannelSelect.value;
      const message = document.getElementById('welcomeMessage').value;
      const res = await fetch('https://thennewdashboard.onrender.com/api/welcome-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId, channelId, message })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Welcome config saved!');
        loadWelcomeConfig();
        configForm.reset();
      } else {
        showNotification('Failed to save config: ' + (data.error || ''), true);
      }
    });
    loadWelcomeConfig();
  }

  // Leave config
  const leaveForm = document.getElementById('leaveForm');
  function loadLeaveConfig() {
    fetch(`https://thennewdashboard.onrender.com/api/leave-config/${guildId}`)
      .then(r => r.json())
      .then(data => {
        const current = document.getElementById('currentLeaveConfig');
        if (data.config) {
          current.style.display = 'block';
          current.innerHTML = `<b>Current Channel:</b> ${channels.find(c => c.id === data.config.channelId)?.name || 'Unknown'}<br><b>Message:</b> ${data.config.message}`;
        } else {
          current.style.display = 'none';
        }
      });
  }
  if (leaveForm) {
    leaveForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const channelId = leaveChannelSelect.value;
      const message = document.getElementById('leaveMessage').value;
      const res = await fetch('https://thennewdashboard.onrender.com/api/leave-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId, channelId, message })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Leave config saved!');
        loadLeaveConfig();
        leaveForm.reset();
      } else {
        showNotification('Failed to save config: ' + (data.error || ''), true);
      }
    });
    loadLeaveConfig();
  }

  function showNotification(msg, error) {
    notification.textContent = msg;
    notification.style.display = 'block';
    notification.style.background = error ? '#f04747' : '#43b581';
    setTimeout(() => { notification.style.display = 'none'; notification.style.background = '#43b581'; }, 2500);
  }
});
