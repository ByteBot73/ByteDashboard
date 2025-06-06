// main.js - Handles homepage login, user info, and invite

document.addEventListener('DOMContentLoaded', async () => {
  const userAvatar = document.getElementById('userAvatar');
  const userMenu = document.getElementById('headerButtons');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const inviteBtn = document.getElementById('inviteBtn');

  // Fetch user info
  const res = await fetch('https://bytedashboard.onrender.com/api/user', { credentials: 'include' });
  const data = await res.json();
  if (data.user) {
    loginBtn.style.display = 'none';
    userAvatar.src = data.user.avatar ? `https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}.png` : '/default-avatar.png';
    userAvatar.style.display = 'inline-block';
  } else {
    loginBtn.style.display = 'inline-block';
    userAvatar.style.display = 'none';
  }

  // Avatar dropdown
  userAvatar.addEventListener('click', () => {
    dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
  });
  document.addEventListener('click', (e) => {
    if (!userMenu.contains(e.target)) dropdownMenu.style.display = 'none';
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    window.location.href = 'https://bytedashboard.onrender.com/logout';
  });

  // Invite button
  inviteBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const res = await fetch('https://bytedashboard.onrender.com/api/invite');
    const data = await res.json();
    window.open(data.invite, '_blank');
  });
});
