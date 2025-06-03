// test.js - Handles Test page for sending messages

document.addEventListener('DOMContentLoaded', async () => {
  const userAvatar = document.getElementById('userAvatar');
  const userMenu = document.getElementById('userMenu');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const logoutBtn = document.getElementById('logoutBtn');
  const channelSelect = document.getElementById('channelSelect');
  const testForm = document.getElementById('testForm');
  const notification = document.getElementById('notification');

  // User info
  const userRes = await fetch('https://the-new-dashboard-backend.onrender.com/api/user', { credentials: 'include' });
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
    window.location.href = 'https://the-new-dashboard-backend.onrender.com/logout';
  });

  // Get guild id from URL
  const urlParams = new URLSearchParams(window.location.search);
  const guildId = urlParams.get('guild');
  if (!guildId) {
    channelSelect.innerHTML = '<option>No guild selected</option>';
    testForm.querySelector('button').disabled = true;
    return;
  }

  // Fetch channels for this guild
  const resChannels = await fetch(`https://the-new-dashboard-backend.onrender.com/api/guild/${guildId}/channels`);
  const dataChannels = await resChannels.json();
  const channels = (dataChannels.channels || []).filter(c => c.type === 0); // Only text channels
  channelSelect.innerHTML = channels.length
    ? '<option selected disabled>Select channel</option>' + channels.map(c => `<option value="${c.id}">${c.name}</option>`).join('')
    : '<option>No text channels found</option>';

  // Handle form submit
  testForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const channelId = channelSelect.value;
    const message = document.getElementById('testMessage').value;
    const res = await fetch('https://the-new-dashboard-backend.onrender.com/api/send', {
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
    } else {
      notification.textContent = 'Failed to send message.';
      notification.style.display = 'block';
      notification.style.background = '#f04747';
      setTimeout(() => { notification.style.display = 'none'; notification.style.background = '#43b581'; }, 2500);
    }
  });
});
