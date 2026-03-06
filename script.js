// 1. KONFIGURÁCIA - TU DAJ SVOJU URL (nezabudni na / na konci)
const DB_URL = "https://vk-pirane-e3953-default-rtdb.europe-west1.firebasedatabase.app/";

// Pomocná funkcia pre komunikáciu s Firebase
async function api(path, method = 'GET', body = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${DB_URL}${path}.json`, options);
    return await res.json();
}

// --- PREPÍNANIE STRÁNOK ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    const target = document.getElementById(pageId);
    if (target) target.style.display = 'block';
    render(); // Pri každom prepnutí obnovíme dáta
    window.scrollTo(0,0);
}

// --- ADMIN FUNKCIE (Zápasy, Hráčky, Produkty) ---
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
    if (id === "-1") await api('matches', 'POST', obj);
    else await api(`matches/${id}`, 'PATCH', obj);
    location.reload();
}

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

// --- RENDEROVANIE (Hlavný mozog stránky) ---
async function render() {
    const matchesData = await api('matches') || {};
    const rosterData = await api('roster') || {};
    const productsData = await api('products') || {};

    const matches = Object.keys(matchesData).map(key => ({ id: key, ...matchesData[key] }));
    const roster = Object.keys(rosterData).map(key => ({ id: key, ...rosterData[key] }));
    const products = Object.keys(productsData).map(key => ({ id: key, ...productsData[key] }));

    // 1. RÝCHLY PREHĽAD NA DOMOVSKEJ STRÁNKE
    const nextCont = document.getElementById('next-match-summary');
    const lastCont = document.getElementById('last-match-summary');
    
    if (nextCont && lastCont && matches.length > 0) {
        matches.sort((a, b) => new Date(a.date) - new Date(b.date));
        const now = new Date();
        const next = matches.find(m => new Date(m.date) >= now);
        const past = [...matches].reverse().find(m => new Date(m.date) < now);

        nextCont.innerHTML = next ? `<div class="match-card" style="${next.alertText ? 'border:2px solid #ff6600;' : ''}">${next.alertText ? `<div style="background:#ff6600;color:white;padding:3px;font-size:0.7em;">${next.alertText}</div>` : ''}<strong>${next.team1} vs ${next.team2}</strong><br>${next.date.split('-').reverse().join('. ')}</div>` : "TBA";
        lastCont.innerHTML = past ? `<div class="match-card"><strong>${past.team1} ${past.score || 'vs'} ${past.team2}</strong><br>${past.date.split('-').reverse().join('. ')}</div>` : "Žiadne výsledky";
    }

    // 2. SÚPISKA (S fotkami a číslami)
    const rCont = document.getElementById('roster-container');
    if (rCont) {
        rCont.innerHTML = roster.map(it => `
            <div class="product-card">
                <div style="font-size:1.8em; font-weight:bold; color:#ff6600;">#${it.number}</div>
                <img src="${it.img}" style="width:100%;height:180px;object-fit:cover;border-radius:5px;" onerror="this.src='https://via.placeholder.com'">
                <h3>${it.name}</h3>
                <p style="font-size:0.9em;color:#666;">${it.pos}</p>
            </div>`).join('');
    }

    // 3. FANSHOP (S fotkami a tlačidlom Kúpiť)
    const pCont = document.getElementById('products-container');
    if (pCont) {
        pCont.innerHTML = products.map((it) => `
            <div class="product-card">
                <img src="${it.img.split(',')[0]}" style="width:100%;border-radius:5px;height:180px;object-fit:cover;" onerror="this.src='https://via.placeholder.com'">
                <h3>${it.name}</h3>
                <p class="price">${it.price}</p>
                <button class="btn" onclick="openOrder('${it.id}')">Kúpiť</button>
            </div>`).join('');
    }

    // 4. ADMIN ZOZNAMY (S tlačidlom Edit 'E')
    const mList = document.getElementById('admin-matches-list');
    if (mList) {
        mList.innerHTML = matches.map(it => `<div class="list-item"><span>${it.team1} vs ${it.team2}</span><div><button onclick="editMatch('${it.id}')" style="background:green;color:white;padding:2px 8px;cursor:pointer;">E</button><button onclick="deleteItem('matches', '${it.id}')" style="background:red;color:white;padding:2px 8px;cursor:pointer;">X</button></div></div>`).join('');
    }
    const rList = document.getElementById('admin-roster-list');
    if (rList) {
        rList.innerHTML = roster.map(it => `<div class="list-item"><span>#${it.number} ${it.name}</span><div><button onclick="editPlayer('${it.id}')" style="background:green;color:white;padding:2px 8px;cursor:pointer;">E</button><button onclick="deleteItem('roster', '${it.id}')" style="background:red;color:white;padding:2px 8px;cursor:pointer;">X</button></div></div>`).join('');
    }
    const pList = document.getElementById('admin-products-list');
    if (pList) {
        pList.innerHTML = products.map(it => `<div class="list-item"><span>${it.name}</span><div><button onclick="editProduct('${it.id}')" style="background:green;color:white;padding:2px 8px;cursor:pointer;">E</button><button onclick="deleteItem('products', '${it.id}')" style="background:red;color:white;padding:2px 8px;cursor:pointer;">X</button></div></div>`).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    render();
    if(document.getElementById('uvod')) showPage('uvod');
});
