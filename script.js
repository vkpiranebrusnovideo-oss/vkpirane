const DB_URL = "https://vk-pirane-e3953-default-rtdb.europe-west1.firebasedatabase.app/";

// --- ZÁKLADNÁ KOMUNIKÁCIA S DATABÁZOU ---
async function api(path, method = 'GET', body = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${DB_URL}${path}.json`, options);
    return await res.json();
}

let cart = JSON.parse(localStorage.getItem('piraneCart')) || [];

// --- NAVIGÁCIA ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    const target = document.getElementById(pageId);
    if (target) target.style.display = 'block';
    render();
    window.scrollTo(0,0);
}

// --- ADMIN: ZÁPASY ---
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

// --- ADMIN: HRÁČKY (OPRAVENÉ) ---
async function addPlayer() {
    const id = document.getElementById('editPlayerIndex').value;
    const obj = { 
        name: document.getElementById('playerName').value, 
        number: document.getElementById('playerNumber').value, 
        pos: document.getElementById('playerPosition').value, 
        img: document.getElementById('playerImg').value 
    };
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

// --- ADMIN: FANSHOP (OPRAVENÉ) ---
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
    document.querySelectorAll('.size-check').forEach(cb => {
        cb.checked = p.sizes ? p.sizes.includes(cb.value) : false;
    });
    document.getElementById('saveBtn').innerText = "AKTUALIZOVAŤ PRODUKT";
    window.scrollTo(0,0);
}

// --- ADMIN: OBJEDNÁVKY ---
async function updateOrderStatus(id, newStatus) {
    await api(`orders/${id}`, 'PATCH', { status: newStatus });
    render();
}

async function deleteOrder(id) {
    if (confirm('Naozaj chcete vymazať túto objednávku?')) {
        await api(`orders/${id}`, 'DELETE');
        render();
    }
}

// --- KOŠÍK ---
async function openOrder(id) {
    const p = await api(`products/${id}`);
    document.getElementById('order-item-name').innerText = p.name;
    const imgList = p.img.split(',').map(i => i.trim());
    document.getElementById('order-main-img').src = imgList[0];
    document.getElementById('selectedColor').innerHTML = p.color ? p.color.split(',').map(c => `<option value="${c.trim()}">${c.trim()}</option>`).join('') : '<option value="Základná">Základná</option>';
    document.getElementById('selectedSize').innerHTML = p.sizes ? p.sizes.map(s => `<option value="${s}">${s}</option>`).join('') : '<option value="Uni">Uni</option>';
    document.getElementById('order-modal').style.display = 'flex';
}

function addToCart() {
    const name = document.getElementById('order-item-name').innerText;
    cart.push({ 
        name, 
        color: document.getElementById('selectedColor').value, 
        size: document.getElementById('selectedSize').value, 
        id: Date.now() 
    });
    updateCart(); closeModal(); alert("Pridané!");
}

function updateCart() {
    localStorage.setItem('piraneCart', JSON.stringify(cart));
    if(document.getElementById('cart-count')) document.getElementById('cart-count').innerText = cart.length;
    const list = document.getElementById('cart-items-list');
    if(list) list.innerHTML = cart.map((it) => `
        <div style="display:flex;justify-content:space-between;padding:5px;border-bottom:1px solid #eee;">
            <span>${it.name} (${it.size}, ${it.color})</span>
            <button onclick="removeFromCart(${it.id})" style="background:red;color:white;border:none;padding:2px 5px;cursor:pointer;">X</button>
        </div>`).join('') || "Košík je prázdny.";
}

function removeFromCart(id) { cart = cart.filter(item => item.id !== id); updateCart(); }
function toggleCart() { const m = document.getElementById('cart-modal'); m.style.display = m.style.display === 'none' ? 'flex' : 'none'; }
function closeModal() { document.getElementById('order-modal').style.display = 'none'; }

async function submitOrder() {
    const nm = document.getElementById('custName').value, ph = document.getElementById('custPhone').value;
    if (!nm || !ph || cart.length === 0) return alert("Vyplňte údaje!");
    const order = { 
        items: cart, name: nm, email: document.getElementById('custEmail').value, 
        phone: ph, addr: document.getElementById('custAddress').value, 
        delivery: document.getElementById('deliveryMethod').value, 
        status: 'Nová', date: new Date().toLocaleString() 
    };
    await api('orders', 'POST', order);
    cart = []; updateCart(); toggleCart(); alert("Odoslané!");
}

// --- RENDER (DÁTA NA WEBE A V ADMINOVI) ---
async function render() {
    const mData = await api('matches') || {};
    const rData = await api('roster') || {};
    const pData = await api('products') || {};
    
    const matches = Object.keys(mData).map(k => ({id: k, ...mData[k]}));
    const roster = Object.keys(rData).map(k => ({id: k, ...rData[k]}));
    const products = Object.keys(pData).map(k => ({id: k, ...pData[k]}));

    // DOMOV
    const nCont = document.getElementById('next-match-summary'), lCont = document.getElementById('last-match-summary');
    if (nCont && lCont && matches.length > 0) {
        matches.sort((a,b) => new Date(a.date) - new Date(b.date));
        const next = matches.find(m => new Date(m.date) >= new Date().setHours(0,0,0,0));
        const past = [...matches].reverse().find(m => new Date(m.date) < new Date());

        nCont.innerHTML = next ? `
            <div class="overview-card">
                <h4>Najbližší zápas</h4>
                <strong>${next.team1} vs ${next.team2}</strong><br>${next.date.split('-').reverse().join('. ')} o ${next.time}
                ${next.alertText ? `<div style="color:var(--secondary); font-weight:bold; margin-top:10px; padding:5px; border:1px dashed var(--secondary);">⚠️ ${next.alertText}</div>` : ''}
            </div>` : "Žiadne zápasy.";

        lCont.innerHTML = past ? `
            <div class="overview-card">
                <h4>Posledný zápas</h4>
                <div style="font-size:1.1em; color:var(--primary);"><strong>${past.team1} ${past.score || '? : ?'} ${past.team2}</strong></div>
            </div>` : "Žiadne výsledky.";
    }

    // ZÁPASY
    const upCont = document.getElementById('upcoming-matches'), pastCont = document.getElementById('past-matches');
    if (upCont && pastCont) {
        const today = new Date().setHours(0,0,0,0);
        upCont.innerHTML = matches.filter(m => new Date(m.date) >= today).map(m => `
            <div class="match-card">
                <div>${m.date.split('-').reverse().join('.')} | ${m.time}</div>
                <strong>${m.team1}</strong> vs <strong>${m.team2}</strong>
                ${m.alertText ? `<div style="color:var(--secondary); font-weight:bold;">⚠️ ${m.alertText}</div>` : ''}
            </div>`).join('');
        pastCont.innerHTML = matches.filter(m => new Date(m.date) < today).reverse().map(m => `
            <div class="match-card" style="opacity:0.8;">${m.team1} <strong>${m.score || '?'}</strong> ${m.team2}</div>`).join('');
    }

    // SÚPISKA (Web aj Admin)
    const rCont = document.getElementById('roster-container'), admRoster = document.getElementById('admin-roster-list');
    if (rCont) {
        rCont.innerHTML = roster.map(p => `
            <div class="match-card">
                <img src="${p.img || 'https://via.placeholder.com'}" style="width:100%; border-radius:5px; height:200px; object-fit:cover;">
                <h3>#${p.number} ${p.name}</h3><p>${p.pos}</p>
            </div>`).join('');
    }
    if (admRoster) {
        admRoster.innerHTML = roster.map(p => `
            <div class="list-item">
                <span>#${p.number} ${p.name}</span>
                <div>
                    <button onclick="editPlayer('${p.id}')" style="width:auto; padding:5px;">Upraviť</button>
                    <button onclick="if(confirm('Zmazať?')) api('roster/${p.id}','DELETE').then(()=>render())" style="background:red; color:white; width:auto; padding:5px;">X</button>
                </div>
            </div>`).join('');
    }

    // FANSHOP (Web aj Admin)
    const pCont = document.getElementById('products-container'), admProducts = document.getElementById('admin-products-list');
    if (pCont) {
        pCont.innerHTML = products.map(p => `
            <div class="match-card" onclick="openOrder('${p.id}')">
                <img src="${p.img.split(',')[0]}" style="width:100%; height:150px; object-fit:contain;">
                <h3>${p.name}</h3><div class="price">${p.price} €</div>
            </div>`).join('');
    }
    if (admProducts) {
        admProducts.innerHTML = products.map(p => `
            <div class="list-item">
                <span>${p.name}</span>
                <div>
                    <button onclick="editProduct('${p.id}')" style="width:auto; padding:5px;">Upraviť</button>
                    <button onclick="if(confirm('Zmazať?')) api('products/${p.id}','DELETE').then(()=>render())" style="background:red; color:white; width:auto; padding:5px;">X</button>
                </div>
            </div>`).join('');
    }

    // ADMIN OBJEDNÁVKY
    const admOrders = document.getElementById('admin-orders-list');
    if (admOrders) {
        const oData = await api('orders') || {};
        const orders = Object.keys(oData).map(k => ({id: k, ...oData[k]}));
        admOrders.innerHTML = orders.reverse().map(o => {
            let color = o.status === 'V procese' ? '#ffaa00' : (o.status === 'Odoslaná' ? '#28a745' : '#ff0000');
            return `
            <div class="admin-section" style="border-left: 8px solid ${color}; position:relative; background:white; margin-bottom:10px; padding:10px;">
                <button onclick="deleteOrder('${o.id}')" style="position:absolute; top:5px; right:5px; border:none; background:none; color:red; cursor:pointer;">🗑️</button>
                <strong>${o.name}</strong> [${o.status}]<br>
                ${o.items.map(i => i.name + ' (' + i.size + ')').join(', ')}<br>
                Tel: ${o.phone} | ${o.delivery}
                <div style="margin-top:10px;">
                    <button onclick="updateOrderStatus('${o.id}', 'V procese')" style="background:#ffaa00; color:white; padding:5px; border:none; cursor:pointer;">V PROCESE</button>
                    <button onclick="updateOrderStatus('${o.id}', 'Odoslaná')" style="background:#28a745; color:white; padding:5px; border:none; cursor:pointer;">ODOSLANÁ</button>
                </div>
            </div>`;
        }).join('') || "Žiadne objednávky.";
    }

        // ADMIN ZÁPASY ZOZNAM (Nájdi toto na konci funkcie render a vymeň to)
    const admMatches = document.getElementById('admin-matches-list');
    if (admMatches) {
        admMatches.innerHTML = matches.map(m => `
            <div class="list-item">
                <span>${m.team1} vs ${m.team2} (${m.date.split('-').reverse().join('.')})</span>
                <div>
                    <button onclick="editMatch('${m.id}')" style="width:auto; padding:5px 10px; cursor:pointer;">Upraviť</button>
                    <button onclick="if(confirm('Naozaj zmazať zápas ${m.team1} vs ${m.team2}?')) api('matches/${m.id}','DELETE').then(()=>render())" style="width:auto; background:red; color:white; padding:5px 10px; cursor:pointer; margin-left:5px; border:none; border-radius:3px;">X</button>
                </div>
            </div>`).join('') || "Žiadne zápasy v databáze.";
    }

}

window.onload = () => { render(); updateCart(); };
