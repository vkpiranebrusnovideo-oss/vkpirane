// --- KONFIGURÁCIA FIREBASE ---
const DB_URL = "https://vk-pirane-e3953-default-rtdb.europe-west1.firebasedatabase.app/";

// Pomocná funkcia pre komunikáciu s databázou
async function api(path, method = 'GET', body = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${DB_URL}${path}.json`, options);
    return await res.json();
}

// --- GLOBÁLNE PREMENNÉ ---
let cart = JSON.parse(localStorage.getItem('piraneCart')) || [];
let currentProductFBId = null;

// --- PREPÍNANIE STRÁNOK (SPA) ---
function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    if (pages.length > 0) {
        pages.forEach(page => page.style.display = 'none');
        const target = document.getElementById(pageId);
        if (target) target.style.display = 'block';
        if (pageId === 'uvod') renderQuickOverview();
        window.scrollTo(0,0);
    }
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
    if (!obj.team1 || !obj.team2 || !obj.date) return alert("Tímy a dátum sú povinné!");

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
    if (!obj.name || !obj.number) return alert("Meno a číslo sú povinné!");

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
    const sz = []; document.querySelectorAll('.size-check:checked').forEach(cb => sz.push(cb.value));
    const obj = {
        name: document.getElementById('prodName').value,
        price: document.getElementById('prodPrice').value,
        color: document.getElementById('prodColor').value,
        img: document.getElementById('prodImg').value,
        sizes: sz
    };
    if (!obj.name || !obj.price) return alert("Názov a cena sú povinné!");

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

// --- KOŠÍK & OBJEDNÁVKY ---
async function openOrder(id) {
    currentProductFBId = id;
    const p = await api(`products/${id}`);
    document.getElementById('order-item-name').innerText = p.name;
    const imgList = p.img.split(',').map(img => img.trim());
    document.getElementById('order-main-img').src = imgList[0] || 'https://via.placeholder.com';
    const gallery = document.getElementById('order-gallery');
    gallery.innerHTML = imgList.length > 1 ? imgList.map(url => `<img src="${url}" onclick="document.getElementById('order-main-img').src='${url}'" style="width:50px;height:50px;object-fit:cover;cursor:pointer;border:1px solid #ccc;border-radius:3px;">`).join('') : "";
    document.getElementById('selectedColor').innerHTML = p.color ? p.color.split(',').map(c => `<option value="${c.trim()}">${c.trim()}</option>`).join('') : '<option value="Základná">Základná</option>';
    document.getElementById('selectedSize').innerHTML = p.sizes && p.sizes.length > 0 ? p.sizes.map(s => `<option value="${s}">${s}</option>`).join('') : '<option value="Uni">Univerzálna</option>';
    document.getElementById('order-modal').style.display = 'flex';
}

function closeModal() { document.getElementById('order-modal').style.display = 'none'; }
function toggleCart() { const m = document.getElementById('cart-modal'); m.style.display = m.style.display === 'none' ? 'flex' : 'none'; }

async function addToCart() {
    const p = await api(`products/${currentProductFBId}`);
    cart.push({ name: p.name, price: p.price, color: document.getElementById('selectedColor').value, size: document.getElementById('selectedSize').value, id: Date.now() });
    updateCart(); closeModal(); alert("Pridané do košíka!");
}

function updateCart() {
    localStorage.setItem('piraneCart', JSON.stringify(cart));
    const count = document.getElementById('cart-count'); if(count) count.innerText = cart.length;
    const list = document.getElementById('cart-items-list');
    if(list) list.innerHTML = cart.map((it, i) => `<div style="display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid #eee; font-size:0.9em; color:#333;"><span><strong>${it.name}</strong> (${it.size})</span><button onclick="removeFromCart(${i})" style="background:red; color:white; border:none; padding:2px 8px; cursor:pointer;">X</button></div>`).join('') || "Košík je prázdny.";
}

function removeFromCart(i) { cart.splice(i, 1); updateCart(); }

async function submitOrder() {
    const nm = document.getElementById('custName').value, em = document.getElementById('custEmail').value, ph = document.getElementById('custPhone').value, ad = document.getElementById('custAddress').value;
    if (!nm || !em || !ph || !ad || cart.length === 0) return alert("Vyplňte údaje a košík!");
    const order = { items: cart, name: nm, email: em, phone: ph, addr: ad, delivery: document.getElementById('deliveryMethod').value, status: 'Nová', date: new Date().toLocaleString() };
    await api('orders', 'POST', order);
    cart = []; updateCart(); toggleCart(); alert("Objednávka bola úspešne odoslaná!"); location.reload();
}

// --- RENDEROVANIE ---
async function render() {
    const matchesData = await api('matches') || {};
    const rosterData = await api('roster') || {};
    const productsData = await api('products') || {};
    const ordersData = await api('orders') || {};

    const matches = Object.keys(matchesData).map(key => ({ id: key, ...matchesData[key] }));
    const roster = Object.keys(rosterData).map(key => ({ id: key, ...rosterData[key] }));
    const products = Object.keys(productsData).map(key => ({ id: key, ...productsData[key] }));

    const mCont = document.getElementById('matches-container'), rCont = document.getElementById('roster-container'), pCont = document.getElementById('products-container');
    
    if(mCont) {
        matches.sort((a,b) => new Date(b.date) - new Date(a.date));
        mCont.innerHTML = matches.map(it => `<div class="match-card" style="${it.alertText ? 'border:2px solid #ff6600; background:#fffcf5' : ''}">${it.alertText ? `<div style="background:#ff6600;color:white;padding:3px;font-size:0.7em;margin-bottom:5px;">${it.alertText}</div>` : ''}<h3>${it.team1} ${it.score ? `<span style="color:#ff6600">${it.score}</span>` : 'vs'} ${it.team2}</h3><p>${it.date.split('-').reverse().join('. ')} | ${it.time || '--:--'}</p></div>`).join('');
    }
    if(rCont) {
        rCont.innerHTML = roster.map(it => `<div class="product-card"><div style="font-size:1.8em; font-weight:bold; color:#ff6600;">#${it.number}</div><img src="${it.img}" style="width:100%;height:180px;object-fit:cover;border-radius:5px;"><h3>${it.name}</h3><p style="font-size:0.9em;color:#666;">${it.pos}</p></div>`).join('');
    }
    if(pCont) {
        pCont.innerHTML = products.map((it) => `<div class="product-card"><img src="${it.img.split(',')[0]}" style="width:100%;border-radius:5px;height:180px;object-fit:cover;"><h3>${it.name}</h3><p class="price">${it.price}</p><button class="btn" onclick="openOrder('${it.id}')">Kúpiť</button></div>`).join('');
    }

    // Admin Zoznamy
    const mList = document.getElementById('admin-matches-list'), rList = document.getElementById('admin-roster-list'), pList = document.getElementById('admin-products-list'), oList = document.getElementById('admin-orders-list');
    if(mList) mList.innerHTML = Object.keys(matchesData).map(key => `<div class="list-item"><span>${matchesData[key].team1} vs ${matchesData[key].team2}</span><div><button onclick="editMatch('${key}')">E</button><button onclick="deleteItem('matches', '${key}')">X</button></div></div>`).join('');
    if(rList) rList.innerHTML = Object.keys(rosterData).map(key => `<div class="list-item"><span>#${rosterData[key].number} ${rosterData[key].name}</span><div><button onclick="editPlayer('${key}')">E</button><button onclick="deleteItem('roster', '${key}')">X</button></div></div>`).join('');
    if(pList) pList.innerHTML = Object.keys(productsData).map(key => `<div class="list-item"><span>${productsData[key].name}</span><div><button onclick="editProduct('${key}')">E</button><button onclick="deleteItem('products', '${key}')">X</button></div></div>`).join('');
    if(oList) oList.innerHTML = Object.keys(ordersData).map(key => {
        const o = ordersData[key];
        return `<div class="admin-section" style="border-left:5px solid ${o.status==='Odoslaná'?'green':'orange'}; margin-bottom:10px;"><strong>Objednávka (${o.status})</strong><br>${o.items.map(it => `- ${it.name} (${it.size})`).join('<br>')}<br><small>${o.name}, ${o.phone}</small><br><button onclick="markShipped('${key}')">Odoslať</button> <button onclick="deleteItem('orders', '${key}')">Zmazať</button></div>`;
    }).join('') || "Žiadne objednávky.";
}

async function deleteItem(path, id) { if(confirm("Zmazať?")) { await api(`${path}/${id}`, 'DELETE'); location.reload(); }}
async function markShipped(id) { await api(`orders/${id}`, 'PATCH', { status: 'Odoslaná' }); location.reload(); }

async function renderQuickOverview() {
    let data = await api('matches') || {};
    let matches = Object.keys(data).map(key => data[key]);
    const nextCont = document.getElementById('next-match-summary'), lastCont = document.getElementById('last-match-summary');
    if (!nextCont || !lastCont) return;
    if (matches.length === 0) { nextCont.innerHTML = lastCont.innerHTML = "<p>Žiadne zápasy.</p>"; return; }
    matches.sort((a, b) => new Date(a.date) - new Date(b.date));
    const now = new Date();
    const next = matches.find(m => new Date(m.date + 'T' + (m.time || '00:00')) >= now);
    const past = [...matches].reverse().find(m => new Date(m.date + 'T' + (m.time || '00:00')) < now);
    if (next) nextCont.innerHTML = `<div class="match-card" style="${next.alertText ? 'border: 2px solid #ff6600;' : ''}">${next.alertText ? `<div style="background:#ff6600; color:white; padding:3px; font-size:0.7em; font-weight:bold; margin-bottom:10px;">${next.alertText}</div>` : ''}<strong>${next.team1} vs ${next.team2}</strong><br><span style="color:#ff6600;">${next.date.split('-').reverse().join('. ')} o ${next.time || '--:--'}</span></div>`;
    if (past) lastCont.innerHTML = `<div class="match-card"><strong>${past.team1} <span style="color:#ff6600">${past.score || 'vs'}</span> ${past.team2}</strong><br><small>${past.date.split('-').reverse().join('. ')}</small></div>`;
}

document.addEventListener('DOMContentLoaded', () => { render(); if(document.getElementById('uvod')) showPage('uvod'); });
