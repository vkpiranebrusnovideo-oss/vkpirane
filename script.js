// 1. KONFIGURÁCIA - TU DAJ SVOJU URL (nezabudni na / na konci)
const DB_URL = "https://vk-pirane-e3953-default-rtdb.europe-west1.firebasedatabase.app";

// Pomocná funkcia pre komunikáciu s Firebase
async function api(path, method = 'GET', body = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${DB_URL}${path}.json`, options);
    return await res.json();
}

// --- GLOBÁLNE PREMENNÉ ---
let cart = JSON.parse(localStorage.getItem('piraneCart')) || [];

// --- PREPÍNANIE STRÁNOK ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    const target = document.getElementById(pageId);
    if (target) target.style.display = 'block';
    if (pageId === 'uvod') render(); 
    window.scrollTo(0,0);
}

// --- ZÁPASY (Pridanie & Úprava) ---
async function addMatch() {
    const id = document.getElementById('editMatchIndex').value;
    const obj = {
        team1: document.getElementById('team1').value,
        team2: document.getElementById('team2').value,
        score: document.getElementById('score').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        alertText: document.getElementById('alertText').value
    };
    if (!obj.team1 || !obj.date) return alert("Meno a dátum!");

    if (id === "-1") await api('matches', 'POST', obj);
    else await api(`matches/${id}`, 'PATCH', obj);
    
    location.reload();
}

async function editMatch(id) {
    const m = await api(`matches/${id}`);
    document.getElementById('team1').value = m.team1;
    document.getElementById('team2').value = m.team2;
    document.getElementById('score').value = m.score || '';
    document.getElementById('date').value = m.date;
    document.getElementById('time').value = m.time;
    document.getElementById('alertText').value = m.alertText || '';
    document.getElementById('editMatchIndex').value = id;
    document.getElementById('saveMatchBtn').innerText = "AKTUALIZOVAŤ ZÁPAS";
    window.scrollTo(0,0);
}

// --- SÚPISKA (Pridanie & Úprava) ---
async function addPlayer() {
    const id = document.getElementById('editPlayerIndex').value;
    const obj = {
        name: document.getElementById('playerName').value,
        number: document.getElementById('playerNumber').value,
        pos: document.getElementById('playerPosition').value,
        img: document.getElementById('playerImg').value || 'https://via.placeholder.com'
    };
    if (id === "-1") await api('roster', 'POST', obj);
    else await api(`roster/${id}`, 'PATCH', obj);
    location.reload();
}

async function editPlayer(id) {
    const p = await api(`roster/${id}`);
    document.getElementById('playerName').value = p.name;
    document.getElementById('playerNumber').value = p.number;
    document.getElementById('playerPosition').value = p.pos;
    document.getElementById('playerImg').value = p.img;
    document.getElementById('editPlayerIndex').value = id;
    document.getElementById('savePlayerBtn').innerText = "AKTUALIZOVAŤ HRÁČKU";
    window.scrollTo(0,0);
}

// --- FANSHOP (Pridanie & Úprava) ---
async function addProduct() {
    const id = document.getElementById('editIndex').value;
    const sizes = []; document.querySelectorAll('.size-check:checked').forEach(cb => sizes.push(cb.value));
    const obj = {
        name: document.getElementById('prodName').value,
        price: document.getElementById('prodPrice').value,
        color: document.getElementById('prodColor').value,
        img: document.getElementById('prodImg').value,
        sizes: sizes
    };
    if (id === "-1") await api('products', 'POST', obj);
    else await api(`products/${id}`, 'PATCH', obj);
    location.reload();
}

async function editProduct(id) {
    const p = await api(`products/${id}`);
    document.getElementById('prodName').value = p.name;
    document.getElementById('prodPrice').value = p.price;
    document.getElementById('prodColor').value = p.color || '';
    document.getElementById('prodImg').value = p.img || '';
    document.getElementById('editIndex').value = id;
    document.querySelectorAll('.size-check').forEach(cb => cb.checked = p.sizes ? p.sizes.includes(cb.value) : false);
    document.getElementById('saveBtn').innerText = "AKTUALIZOVAŤ PRODUKT";
    window.scrollTo(0,0);
}

// --- MAZANIE ---
async function deleteItem(path, id) {
    if (confirm("Naozaj zmazať?")) {
        await api(`${path}/${id}`, 'DELETE');
        location.reload();
    }
}

// --- RENDEROVANIE ---
async function render() {
    const matches = await api('matches') || {};
    const roster = await api('roster') || {};
    const products = await api('products') || {};
    const orders = await api('orders') || {};

    // 1. HLAVNÝ WEB
    const mCont = document.getElementById('matches-container');
    if (mCont) {
        mCont.innerHTML = Object.keys(matches).map(id => {
            const it = matches[id];
            return `<div class="match-card"><h3>${it.team1} ${it.score || 'vs'} ${it.team2}</h3><p>${it.date}</p></div>`;
        }).join('');
    }

    const rCont = document.getElementById('roster-container');
    if (rCont) {
        rCont.innerHTML = Object.keys(roster).map(id => {
            const it = roster[id];
            return `<div class="product-card"><h3>#${it.number} ${it.name}</h3><p>${it.pos}</p></div>`;
        }).join('');
    }

    // 2. ADMIN ZOZNAMY (Tlačidlá Edit a Delete)
    const mList = document.getElementById('admin-matches-list');
    if (mList) {
        mList.innerHTML = Object.keys(matches).map(id => `
            <div class="list-item">
                <span>${matches[id].team1} vs ${matches[id].team2}</span>
                <div>
                    <button onclick="editMatch('${id}')" style="background:green;color:white;padding:5px;">E</button>
                    <button onclick="deleteItem('matches', '${id}')" style="background:red;color:white;padding:5px;">X</button>
                </div>
            </div>`).join('');
    }

    const rList = document.getElementById('admin-roster-list');
    if (rList) {
        rList.innerHTML = Object.keys(roster).map(id => `
            <div class="list-item">
                <span>#${roster[id].number} ${roster[id].name}</span>
                <div>
                    <button onclick="editPlayer('${id}')" style="background:green;color:white;padding:5px;">E</button>
                    <button onclick="deleteItem('roster', '${id}')" style="background:red;color:white;padding:5px;">X</button>
                </div>
            </div>`).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    render();
    if(document.getElementById('uvod')) showPage('uvod');
});
