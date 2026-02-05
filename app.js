const API_BASE = 'http://localhost:4000'; // change if your server runs elsewhere
const el = (id) => document.getElementById(id);

let currentUser = null;

// DOM elements
const usernameInput = el('username');
const btnRegister = el('btn-register');
const profilePanel = el('profile-panel');
const authPanel = el('auth-panel');
const profileUsername = el('profile-username');
const profileTrokens = el('profile-trokens');
const collectionList = el('collection-list');
const btnOpenPack = el('btn-open-pack');
const messageBox = el('message');
const lastDrop = el('last-drop');
const dropName = el('drop-name');

function showMessage(text, timeout=4000){
  messageBox.hidden = false;
  messageBox.textContent = text;
  if(timeout>0){
    setTimeout(()=> messageBox.hidden = true, timeout);
  }
}

async function registerOrLoad(){
  const username = usernameInput.value.trim();
  if(!username){ showMessage('Enter a username'); return; }
  try {
    // Try load first
    const resLoad = await fetch(`${API_BASE}/user/${encodeURIComponent(username)}`);
    if(resLoad.ok){
      currentUser = username;
      const data = await resLoad.json();
      updateProfileUI(username, data.trokens, data.collection);
      showMessage('Loaded existing user');
      return;
    }
    // else register
    const res = await fetch(`${API_BASE}/register`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({username})
    });
    if(!res.ok){
      const err = await res.json();
      showMessage('Error: ' + (err.error || res.statusText));
      return;
    }
    const payload = await res.json();
    currentUser = username;
    updateProfileUI(username, payload.trokens, {});
    showMessage('Registered new user with 1,000,000 trokens');
  } catch(err){
    showMessage('Network error: ' + err.message);
  }
}

function updateProfileUI(username, trokens, collection){
  authPanel.hidden = true;
  profilePanel.hidden = false;
  profileUsername.textContent = username;
  profileTrokens.textContent = trokens.toLocaleString();
  // populate collection
  collectionList.innerHTML = '';
  const keys = Object.keys(collection || {});
  if(keys.length === 0){
    const li = document.createElement('li');
    li.textContent = '(empty)';
    collectionList.appendChild(li);
  } else {
    keys.forEach(k=>{
      const li = document.createElement('li');
      li.textContent = `${k} × ${collection[k]}`;
      collectionList.appendChild(li);
    });
  }
}

async function openPack(){
  if(!currentUser){ showMessage('No user loaded'); return; }
  try {
    btnOpenPack.disabled = true;
    const res = await fetch(`${API_BASE}/open-pack`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username: currentUser, packId: 'starter' })
    });
    if(!res.ok){
      const err = await res.json();
      showMessage('Open pack failed: ' + (err.error || res.statusText));
      btnOpenPack.disabled = false;
      return;
    }
    const payload = await res.json();
    // update UI from response
    updateProfileUI(currentUser, payload.trokens, payload.collection);
    showDrop(payload.got);
  } catch(err){
    showMessage('Network error: ' + err.message);
  } finally {
    btnOpenPack.disabled = false;
  }
}

function showDrop(got){
  if(!got) return;
  lastDrop.hidden = false;
  dropName.textContent = `${got.name} (${got.id}) — rarity weight ${got.weight ?? 'n/a'}`;
  // small highlight animation
  lastDrop.animate([
    { transform: 'scale(0.98)', opacity: 0.6 },
    { transform: 'scale(1)', opacity: 1 }
  ], { duration: 400, easing: 'ease-out' });
}

// Event listeners
btnRegister.addEventListener('click', registerOrLoad);
btnOpenPack.addEventListener('click', openPack);

// Allow pressing Enter in username field
usernameInput.addEventListener('keydown', (e)=> {
  if(e.key === 'Enter') registerOrLoad();
});
