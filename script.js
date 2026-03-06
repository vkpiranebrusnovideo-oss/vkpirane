const DB_URL = "https://vk-pirane-e3953-default-rtdb.europe-west1.firebasedatabase.app/";

async function api(path, method = 'GET', body = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${DB_URL}${path}.json`, options);
    return await res.json();
}

let cart = JSON.parse(localStorage.getItem('piraneCart')) || [];
let currentProductFBId = null;

// --- NAVIGÁCIA ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    const target = document.getElementById(pageId);
    if (target) target.style.display = 'block';
    render();
    window.scrollTo(0,0);
}

// --- ADMIN - PRIDÁVANIE A ÚPRAVA ---
async function addMatch() {
    const id = document.getElementById('editMatchIndex').value;
    const obj = { team1: document.getElementById('team1').value, team2: document.getElementById('team2').value, score: document.getElementById('score').value, date: document.getElementById('date').value, time: document.getElementById('time').value, alertText: document.getElementById('alertText').value };
    if (id === "-1") await api('matches', 'POST', obj); else await api(`matches/${id}`, 'PATCH', obj);
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

async function addPlayer() {
    const id = document.getElementById('editPlayerIndex').value;
    const obj = { name: document.getElementById('playerName').value, number: document.getElementById('playerNumber').value, pos: document.getElementById('playerPosition').value, img: document.getElementById('playerImg').value };
    if (id === "-1") await api('roster', 'POST', obj); else await api(`roster/${id}`, 'PATCH', obj);
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

async function addProduct() {
    const id = document.getElementById('editIndex').value;
    const sz = []; document.querySelectorAll('.size-check:checked').forEach(cb => sz.push(cb.value));
    const obj = { name: document.getElementById('prodName').value, price: document.getElementById('prodPrice').value, color: document.getElementById('prodColor').value, img: document.getElementById('prodImg').value, sizes: sz };
    if (id === "-1") await api('products', 'POST', obj); else await api(`products/${id}`, 'PATCH', obj);
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

// --- KOŠÍK ---
async function openOrder(id) {
    currentProductFBId = id;
    const p = await api(`products/${id}`);
    document.getElementById('order-item-name').innerText = p.name;
    const imgList = p.img.split(',').map(i => i.trim());
    document.getElementById('order-main-img').src = imgList[0];
    document.getElementById('selectedColor').innerHTML = p.color ? p.color.split(',').map(c => `<option value="${c.trim()}">${c.trim()}</option>`).join('') : '<option value="Základná">Základná</option>';
    document.getElementById('selectedSize').innerHTML = p.sizes ? p.sizes.map(s => `<option value="${s}">${s}</option>`).join('') : '<option value="Uni">Univerzálna</option>';
    document.getElementById('order-modal').style.display = 'flex';
}

function addToCart() {
    const name = document.getElementById('order-item-name').innerText;
    cart.push({ name, color: document.getElementById('selectedColor').value, size: document.getElementById('selectedSize').value, id: Date.now() });
    updateCart(); closeModal(); alert("Pridané do košíka!");
}

function updateCart() {
    localStorage.setItem('piraneCart', JSON.stringify(cart));
    if(document.getElementById('cart-count')) document.getElementById('cart-count').innerText = cart.length;
    const list = document.getElementById('cart-items-list');
    if(list) list.innerHTML = cart.map((it, i) => `<div style="display:flex;justify-content:space-between;padding:5px;border-bottom:1px solid #eee;"><span>${it.name} (${it.size})</span><button onclick="removeFromCart(${it.id})" style="background:red;color:white;border:none;padding:2px 5px;cursor:pointer;">X</button></div>`).join('') || "Košík je prázdny.";
}

function removeFromCart(id) { cart = cart.filter(item => item.id !== id); updateCart(); }
function toggleCart() { const m = document.getElementById('cart-modal'); m.style.display = m.style.display === 'none' ? 'flex' : 'none'; }
function closeModal() { document.getElementById('order-modal').style.display = 'none'; }

async function submitOrder() {
    const nm = document.getElementById('custName').value, em = document.getElementById('custEmail').value, ph = document.getElementById('custPhone').value, ad = document.getElementById('custAddress').value, dm = document.getElementById('deliveryMethod').value;
    if (!nm || !ph || cart.length === 0) return alert("Vyplňte aspoň meno, telefón a pridajte tovar!");
    const order = { items: cart, name: nm, email: em, phone: ph, addr: ad, delivery: dm, status: 'Nová', date: new Date().toLocaleString() };
    await api('orders', 'POST', order);
    cart = []; updateCart(); toggleCart(); alert("Objednávka odoslaná!");
}

// --- ADMIN - STAV OBJEDNÁVKY ---
async function markShipped(id) {
    await api(`orders/${id}`, 'PATCH', { status: 'Odoslaná' });
    location.reload();
}

// --- RENDER ---
async function render() {
    const mData = await api('matches') || {};
    const rData = await api('roster') || {};
    const pData = await api('products') || {};
    const matches = Object.keys(mData).map(k => ({id: k, ...mData[k]}));
    const roster = Object.keys(rData).map(k => ({id: k, ...rData[k]}));
    const products = Object.keys(pData).map(k => ({id: k, ...pData[k]}));

    // Domov
    const nCont = document.getElementById('next-match-summary'), lCont = document.getElementById('last-match-summary');
    if (nCont && lCont && matches.length > 0) {
        matches.sort((a,b) => new Date(a.date) - new Date(b.date));
        const next = matches.find(m => new Date(m.date) >= new Date());
        const past = [...matches].reverse().find(m => new Date(m.date) < new Date());
        nCont.innerHTML = next ? `<h4>Najbližší</h4><div class="match-card"><strong>${next.team1} vs ${next.team2}</strong><br>${next.date}</div>` : "Žiadne zápasy.";
        lCont.innerHTML = past ? `<h4>Posledný</h4><div class="match-card"><strong>${past.team1} ${past.score || ''} ${past.team2}</strong></div>` : "Žiadne výsledky.";
    }

    if(document.getElementById('matches-container')) document.getElementById('matches-container').innerHTML = matches.map(it => `<div class="match-card" style="${it.alertText?'border:2px solid orange':''}"><h3>${it.team1} vs ${it.team2}</h3><p>${it.date}</p></div>`).join('');
    if(document.getElementById('roster-container')) document.getElementById('roster-container').innerHTML = roster.map(it => `<div class="product-card"><img src="${it.img}" style="width:100%;height:150px;object-fit:cover;"><h3>#${it.number} ${it.name}</h3></div>`).join('');
    if(document.getElementById('products-container')) document.getElementById('products-container').innerHTML = products.map(it => `<div class="product-card"><img src="${it.img.split(',')[0]}" style="width:100%;height:150px;object-fit:cover;"><h3>${it.name}</h3><button class="btn" onclick="openOrder('${it.id}')">Kúpiť</button></div>`).join('');

    // Admin Listy
    const ml = document.getElementById('admin-matches-list'), pl = document.getElementById('admin-products-list'), rl = document.getElementById('admin-roster-list'), ol = document.getElementById('admin-orders-list');
    if(ml) ml.innerHTML = matches.map(it => `<div class="list-item"><span>${it.team1} vs ${it.team2}</span><div><button onclick="editMatch('${it.id}')">E</button><button onclick="deleteItem('matches','${it.id}')">X</button></div></div>`).join('');
    if(pl) pl.innerHTML = products.map(it => `<div class="list-item"><span>${it.name}</span><div><button onclick="editProduct('${it.id}')">E</button><button onclick="deleteItem('products','${it.id}')">X</button></div></div>`).join('');
    if(rl) rl.innerHTML = roster.map(it => `<div class="list-item"><span>${it.name}</span><div><button onclick="editPlayer('${it.id}')">E</button><button onclick="deleteItem('roster','${it.id}')">X</button></div></div>`).join('');
    
    if(ol) {
        const oData = await api('orders') || {};
        ol.innerHTML = Object.keys(oData).map(k => {
            const o = oData[k];
            const itemsHtml = o.items.map(i => `• ${i.name} (${i.size}, ${i.color})`).join('<br>');
            return `<div class="admin-section" style="border-left:8px solid ${o.status === 'Odoslaná' ? '#28a745' : '#ffc107'}; background: ${o.status === 'Odoslaná' ? '#f8fff8' : '#fff'};">
                <div style="display:flex; justify-content:space-between;">
                    <strong>Objednávka: ${o.name}</strong> 
                    <span style="color: ${o.status === 'Odoslaná' ? 'green' : 'orange'}; font-weight: bold;">${o.status}</span>
                </div>
                (${o.date})<br>
                Tel: <strong>${o.phone}</strong> | Doprava: ${o.delivery}<br>
                <div style="background:#eee; padding:8px; margin:8px 0; border-radius:4px;">${itemsHtml}</div>
                <div style="display:flex; gap:10px;">
                    ${o.status !== 'Odoslaná' ? `<button onclick="markShipped('${k}')" style="background:#28a745; color:white; border:none; padding:8px; cursor:pointer;">ODOSLANÉ</button>` : ''}
                    <button onclick="deleteItem('orders','${k}')" style="background:red; color:white; border:none; padding:8px; cursor:pointer;">ZMAZAŤ</button>
                </div>
            </div>`;
        }).join('') || "Žiadne objednávky.";
    }
}

async function deleteItem(path, id) { if(confirm("Naozaj zmazať?")) { await api(`${path}/${id}`, 'DELETE'); location.reload(); } }

document.addEventListener('DOMContentLoaded', () => { render(); if(document.getElementById('uvod')) showPage('uvod'); });
