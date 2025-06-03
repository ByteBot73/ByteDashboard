// dashboard.js - Handles dashboard server list and add-to-server

document.addEventListener('DOMContentLoaded', async () => {
  const userAvatar = document.getElementById('userAvatar');
  const userMenu = document.getElementById('userMenu');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const logoutBtn = document.getElementById('logoutBtn');
  const guildList = document.getElementById('guildList');

  // Fetch user info
  const userRes = await fetch('https://your-backend-url.onrender.com/api/user', { credentials: 'include' });
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
    window.location.href = 'https://your-backend-url.onrender.com/logout';
  });

  // Fetch user guilds (only owner)
  const res = await fetch('https://your-backend-url.onrender.com/api/guilds', { credentials: 'include' });
  const data = await res.json();
  guildList.innerHTML = '';
  if (data.guilds && data.guilds.length) {
    data.guilds.filter(guild => guild.owner).forEach(guild => {
      const card = document.createElement('div');
      card.className = 'guild-card';
      card.innerHTML = `
        <img src="${guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : '/default-avatar.png'}" alt="icon">
        <div class="guild-name">${guild.name}</div>
        <button class="btn guild-btn">${guild.botInGuild ? 'Configure Server' : 'Add to Server'}</button>
      `;
      const btn = card.querySelector('.guild-btn');
      btn.onclick = null;
      if (guild.botInGuild) {
        btn.textContent = 'Configure Server';
        btn.onclick = () => window.location.href = `/server.html?guild=${guild.id}`;
      } else {
        btn.textContent = 'Add to Server';
        btn.onclick = async () => {
          fetch('https://your-backend-url.onrender.com/api/invite').then(r => r.json()).then(invite => {
            window.open(invite.invite + `&guild_id=${guild.id}&disable_guild_select=true`, '_blank');
            // Poll for bot presence and update button
            const poll = setInterval(async () => {
              const guildsRes = await fetch('https://your-backend-url.onrender.com/api/guilds', { credentials: 'include' });
              const guildsData = await guildsRes.json();
              const updated = guildsData.guilds.find(g => g.id === guild.id);
              if (updated && updated.botInGuild) {
                clearInterval(poll);
                btn.textContent = 'Configure Server';
                btn.onclick = () => window.location.href = `/server.html?guild=${guild.id}`;
              }
            }, 2000);
          });
        };
      }
      guildList.appendChild(card);
    });
  } else {
    guildList.innerHTML = '<p>No servers found.</p>';
  }
});
