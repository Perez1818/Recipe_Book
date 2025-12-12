document.addEventListener('DOMContentLoaded', async () => { // wait for things to load
  const btn = document.getElementById('follow-btn');
  if (!btn) return;
  const profileId = Number(btn.dataset.userId);
  if (!Number.isFinite(profileId)) return; // safety

  async function getCurrent() { // get current user
    try {
      const resp = await fetch(`/userDetails/me`, { credentials: 'same-origin' });
      if (!resp.ok) return null;
      const data = await resp.json();
      if (data && data.id !== undefined) data.id = Number(data.id);
      return data;
    } catch {
      return null;
    }
  }

  async function updateCounts() { // update followers and following counts
    try {
      const fResp = await fetch(`/users/${profileId}/followers`);
      if (fResp.ok) {
        const data = await fResp.json();
        document.getElementById('followers-count').textContent = (data.items || []).length;
      }
      const ffResp = await fetch(`/users/${profileId}/following`);
      if (ffResp.ok) {
        const data = await ffResp.json();
        document.getElementById('following-count').textContent = (data.items || []).length;
      }
    } catch (e) {
      console.error('updateCounts error', e);
    }
  }

  const current = await getCurrent(); // get current user
  if (!current) { // not logged in
    btn.textContent = 'Sign in to follow';
    btn.disabled = true;
    await updateCounts();
    return;
  }

  if (Number(current.id) === profileId) { // current user is viewing their own profile
    btn.textContent = "It's you";
    btn.disabled = true;
    await updateCounts();
    return;
  }

  // ask server whether current user is following profileId (session-based check)
  let isFollowing = false;
  try {
    const resp = await fetch(`/users/${profileId}/isFollowing`, { credentials: 'same-origin' });
    if (resp.ok) {
      const data = await resp.json();
      isFollowing = !!data.isFollowing;
    }
  } catch (e) {
    console.error('check isFollowing error', e);
  }

  btn.textContent = isFollowing ? 'Unfollow' : 'Follow';
  btn.disabled = false;

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const resp = await fetch(`/users/${profileId}/follow`, {
        method,
        credentials: 'same-origin'
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'unknown' }));
        alert(err.error || 'Request failed');
      } else {
        isFollowing = !isFollowing;
        btn.textContent = isFollowing ? 'Unfollow' : 'Follow';
        await updateCounts();
      }
    } catch (e) {
      console.error('follow/unfollow error', e);
    }
    btn.disabled = false;
  });

  await updateCounts();
});