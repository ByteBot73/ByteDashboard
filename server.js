// server.js - Handles server config page (test bot)

document.addEventListener('DOMContentLoaded', async () => {
  const userAvatar = document.getElementById('userAvatar');
  const userMenu = document.getElementById('headerButtons');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const logoutBtn = document.getElementById('logoutBtn');
  const channelSelect = document.getElementById('channelSelect');
  const testForm = document.getElementById('testForm');
  const notification = document.getElementById('notification');
  const testBtn = document.getElementById('testBtn');
  const welcomeBtn = document.getElementById('welcomeBtn');
  const leaveBtn = document.getElementById('leaveBtn');
  const testSection = document.getElementById('testSection');
  const welcomeSection = document.getElementById('welcomeSection');
  const leaveSection = document.getElementById('leaveSection');
  const welcomeChannelSelect = document.getElementById('welcomeChannelSelect');
  const leaveChannelSelect = document.getElementById('leaveChannelSelect');
  const configForm = document.getElementById('configForm');
  const leaveForm = document.getElementById('leaveForm');

  // User info
  const userRes = await fetch('api/user');
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
    window.location.href = 'logout';
  });

  // Get guild id from URL
  const urlParams = new URLSearchParams(window.location.search);
  const guildId = urlParams.get('guild');
  if (!guildId) {
    channelSelect.innerHTML = '<option>No guild selected</option>';
    testForm.querySelector('button').disabled = true;
    return;
  }

  // Fetch channels for this guild (real API call)
  const resChannels = await fetch(`api/guild/${guildId}/channels`);
  const dataChannels = await resChannels.json();
  const channels = (dataChannels.channels || []).filter(c => c.type === 0); // Only text channels
  // Populate both dropdowns with the same channels
  channelSelect.innerHTML = channels.length
    ? '<option selected disabled>Select channel</option>' + channels.map(c => `<option value="${c.id}">${c.name}</option>`).join('')
    : '<option>No text channels found</option>';
  welcomeChannelSelect.innerHTML = channels.length
    ? '<option selected disabled>Select channel</option>' + channels.map(c => `<option value="${c.id}">${c.name}</option>`).join('')
    : '<option>No text channels found</option>';

  // Sidebar navigation
  testBtn.addEventListener('click', () => {
    testBtn.classList.add('active');
    welcomeBtn.classList.remove('active');
    leaveBtn.classList.remove('active');
    testSection.style.display = '';
    welcomeSection.style.display = 'none';
    leaveSection.style.display = 'none';
  });
  welcomeBtn.addEventListener('click', () => {
    testBtn.classList.remove('active');
    welcomeBtn.classList.add('active');
    leaveBtn.classList.remove('active');
    testSection.style.display = 'none';
    welcomeSection.style.display = '';
    leaveSection.style.display = 'none';
  });
  leaveBtn.addEventListener('click', () => {
    testBtn.classList.remove('active');
    welcomeBtn.classList.remove('active');
    leaveBtn.classList.add('active');
    testSection.style.display = 'none';
    welcomeSection.style.display = 'none';
    leaveSection.style.display = '';
  });

  // Handle form submit
  testForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const channelId = channelSelect.value;
    const message = document.getElementById('testMessage').value;
    const res = await fetch('api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guildId, channelId, message })
    });
    const data = await res.json();
    if (data.success) {
      notification.textContent = 'Message sent successfully!';
      notification.style.display = 'block';
      setTimeout(() => { notification.style.display = 'none'; }, 2500);
      testForm.reset();
      // Reset dropdown to default option
      channelSelect.selectedIndex = -1;
      channelSelect.innerHTML = '<option selected disabled>Select channel</option>' +
        channels.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    } else {
      notification.textContent = 'Failed to send message.';
      notification.style.display = 'block';
      notification.style.background = '#f04747';
      setTimeout(() => { notification.style.display = 'none'; notification.style.background = '#43b581'; }, 2500);
    }
  });

  // Handle welcome config form submit
  configForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const channelId = welcomeChannelSelect.value;
    const message = document.getElementById('welcomeMessage').value;
    const res = await fetch('api/welcome-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guildId, channelId, message })
    });
    const data = await res.json();
    if (data.success) {
      notification.textContent = 'Welcome configuration saved!';
      notification.style.display = 'block';
      setTimeout(() => { notification.style.display = 'none'; }, 2500);
      configForm.reset();
      welcomeChannelSelect.selectedIndex = -1;
      welcomeChannelSelect.innerHTML = '<option selected disabled>Select channel</option>' +
        channels.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    } else {
      notification.textContent = 'Failed to save configuration.';
      notification.style.display = 'block';
      notification.style.background = '#f04747';
      setTimeout(() => { notification.style.display = 'none'; notification.style.background = '#43b581'; }, 2500);
    }
  });

  // Populate leave channel dropdown
  leaveChannelSelect.innerHTML = channels.length
    ? '<option selected disabled>Select channel</option>' + channels.map(c => `<option value="${c.id}">${c.name}</option>`).join('')
    : '<option>No text channels found</option>';

  // Handle leave config form submit
  leaveForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const channelId = leaveChannelSelect.value;
    const message = document.getElementById('leaveMessage').value;
    const res = await fetch('api/leave-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guildId, channelId, message })
    });
    const data = await res.json();
    if (data.success) {
      notification.textContent = 'Leave configuration saved!';
      notification.style.display = 'block';
      setTimeout(() => { notification.style.display = 'none'; }, 2500);
      leaveForm.reset();
      leaveChannelSelect.selectedIndex = -1;
      leaveChannelSelect.innerHTML = '<option selected disabled>Select channel</option>' +
        channels.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    } else {
      notification.textContent = 'Failed to save configuration.';
      notification.style.display = 'block';
      notification.style.background = '#f04747';
      setTimeout(() => { notification.style.display = 'none'; notification.style.background = '#43b581'; }, 2500);
    }
  });
});
