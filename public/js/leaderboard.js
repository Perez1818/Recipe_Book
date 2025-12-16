async function loadUsers() {
    const res = await fetch('/api/users');
    if (!res.ok) return;
    const { users } = await res.json();
    const ol = document.getElementById('leaderboard-list');
    if (!ol) return;
    ol.innerHTML = '';
    users.forEach((u, i) => {
        const li = document.createElement('li');
        li.className = 'leaderboard-entry';

        if (i === 0) li.classList.add('first');
        else if (i === 1) li.classList.add('second');
        else if (i === 2) li.classList.add('third');

        const img = document.createElement('img');
        img.src = 'img/Profile_icon.svg';
        img.className = 'profile-pic';
        img.alt = `${u.username} profile`;

        const username = document.createElement('span');
        username.className = 'username';
        username.textContent = `${u.username}`;

        const points = document.createElement('span');
        points.className = 'points';
        points.textContent = ` ${u.points ?? 0} pts`;

        li.appendChild(img);
        li.appendChild(username);
        li.appendChild(points);

        ol.appendChild(li);
    });

    if (users.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'leaderboard-entry';
        empty.textContent = 'No users found';
        ol.appendChild(empty);
    }
}
document.addEventListener('DOMContentLoaded', loadUsers);