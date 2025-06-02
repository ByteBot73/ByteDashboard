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
  const userRes = await fetch('/api/user');
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
    window.location.href = '/logout';
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
  const resChannels = await fetch(`/api/guild/${guildId}/channels`);
  const dataChannels = await resChannels.json();
  const channels = (dataChannels.channels || []).filter(c => c.type === 0); // Only text channels
  channelSelect.innerHTML = channels.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  // Handle form submit
  testForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const channelId = channelSelect.value;
    const message = document.getElementById('testMessage').value;
    const res = await fetch('/api/send', {
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
