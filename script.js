// 1. TU VLOŽ SVOJU URL Z FIREBASE (nezabudni na .json na konci v dopytoch)
const DB_URL = "https://vk-pirane-e3953-default-rtdb.europe-west1.firebasedatabase.app";

// Pomocná funkcia pre komunikáciu s databázou
async function api(path, method = 'GET', body = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${DB_URL}${path}.json`, options);
    return await res.json();
}

// --- FUNKCIE PRE ADMINA (Zápasy, Hráčky, Produkty) ---
async function addMatch() {
    const obj = {
        team1: document.getElementById('team1').value,
        team2: document.getElementById('team2').value,
        score: document.getElementById('score').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        alertText: document.getElementById('alertText').value
    };
    await api('matches', 'POST', obj);
    alert("Zápas uložený na internet!");
    location.reload();
}

async function addPlayer() {
    const obj = {
        name: document.getElementById('playerName').value,
        number: document.getElementById('playerNumber').value,
        pos: document.getElementById('playerPosition').value,
        img: document.getElementById('playerImg').value
    };
    await api('roster', 'POST', obj);
    alert("Hráčka uložená!");
    location.reload();
}

// --- ZOBRAZOVANIE (Pre fanúšikov) ---
async function render() {
    const matches = await api('matches') || {};
    const roster = await api('roster') || {};
    
    // Zobrazenie zápasov na hlavnej stránke
    const mCont = document.getElementById('matches-container');
    if (mCont) {
        mCont.innerHTML = Object.keys(matches).map(id => `
            <div class="match-card">
                <h3>${matches[id].team1} vs ${matches[id].team2}</h3>
                <p>${matches[id].date}</p>
            </div>
        `).join('');
    }
    
    // Zobrazenie v adminovi pre mazanie
    const mList = document.getElementById('admin-matches-list');
    if (mList) {
        mList.innerHTML = Object.keys(matches).map(id => `
            <div class="list-item">${matches[id].team1} <button onclick="deleteItem('matches', '${id}')">Zmazať</button></div>
        `).join('');
    }
}

async function deleteItem(path, id) {
    if (confirm("Naozaj zmazať?")) {
        await api(`${path}/${id}`, 'DELETE');
        location.reload();
    }
}

document.addEventListener('DOMContentLoaded', render);
