const DB_URL = "https://vk-pirane-e3953-default-rtdb.europe-west1.firebasedatabase.app/";

async function api(path, method = 'GET', body = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${DB_URL}${path}.json`, options);
    return await res.json();
}

let cart = JSON.parse(localStorage.getItem('piraneCart')) || [];

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    const target = document.getElementById(pageId);
    if (target) target.style.display = 'block';
    render(); 
    window.scrollTo(0,0);
}

// --- ZÁPASY ---
async function addMatch() {
    const id = document.getElementById('editMatchIndex').value;
    const obj = {
        team1: document.getElementById('team1').value, team2: document.getElementById('team2').value,
        score: document.getElementById('score').value, date: document.getElementById('date').value,
        time: document.getElementById('time').value, alertText: document.getElementById('alertText').value
    };
    if (id === "-1") await api('matches', 'POST', obj);
    else await api(`matches/${id}`, 'PATCH', obj);
    location.reload();
}

// --- SÚPISKA ---
async function addPlayer() {
    const id = document.getElementById('editPlayerIndex').value;
    const obj = {
        name: document.getElementById('playerName').value, number: document.getElementById('playerNumber').value,
        pos: document.getElementById('playerPosition').value, img: document.getElementById('playerImg').value
    };
    if (id === "-1") await api('roster', 'POST', obj);
    else await api(`roster/${id}`, 'PATCH', obj);
    location.reload();
}

// --- FANSHOP ---
async function addProduct() {
    const id = document.getElementById('editIndex').value;
    const sz = []; document.querySelectorAll('.size-check:checked').forEach(cb => sz.push(cb.value));
    const obj = {
        name: document.getElementById('prodName').value, price: document.getElementById('prodPrice').value,
        color: document.getElementById('prodColor').value, img: document.getElementById('prodImg').value, sizes: sz
    };
    if (id === "-1") await api('products', 'POST', obj);
    else await api(`products/${id}`, 'PATCH', obj);
    location.reload();
}

// --- KOŠÍK (OPRAVENÝ PRE FIREBASE ID) ---
async function openOrder(id) {
    const p = await api(`products/${id}`);
    if (!p) return;

    document.getElementById('order-item-name').innerText = p.name;
    const imgList = p.img.split(',').map(i => i.trim());
    document.getElementById('order-main-img').src = imgList[0];
    
    document.getElementById('selectedColor').innerHTML = p.color ? p.color.split(',').map(c => `<option value="${c.trim()}">${c.trim()}</option>`).join('') : '<option value="Základná">Základná</option>';
    document.getElementById('selectedSize').innerHTML = p.sizes ? p.sizes.map(s => `<option value="${s}">${s}</option>`).join('') : '<option value="Uni">Univerzálna</option>';
    
    // Uložíme si aktuálne dáta do globálnej premennej pre addToCart
    window.currentActiveProduct = { ...p, fbId: id };
    document.getElementById('order-modal').style.display = 'flex';
}

function addToCart() {
    const p = window.currentActiveProduct;
    cart.push({ name: p.name, price: p.price, color: document.getElementById('selectedColor').value, size: document.getElementById('selectedSize').value, id: Date.now() });
    updateCart(); document.getElementById('order-modal').style.display = 'none';
    alert("Pridané do košíka!");
}

function updateCart() {
    localStorage.setItem('piraneCart', JSON.stringify(cart));
    if(document.getElementById('cart-count')) document.getElementById('cart-count').innerText = cart.length;
    if(document.getElementById('cart-items-list')) {
        document.getElementById('cart-items-list').innerHTML = cart.map((it, i) => `<div style="display:flex;justify-content:space-between;padding:5px;border-bottom:1px solid #eee;"><span>${it.name}</span><button onclick="removeFromCart(${i})">X</button></div>`).join('');
    }
}
function removeFromCart(i) { cart.splice(i, 1); updateCart(); }
function toggleCart() { const m = document.getElementById('cart-modal'); m.style.display = m.style.display === 'none' ? 'flex' : 'none'; }

async function submitOrder() {
    const order = { items: cart, name: document.getElementById('custName').value, email: document.getElementById('custEmail').value, phone: document.getElementById('custPhone').value, addr: document.getElementById('custAddress').value, delivery: document.getElementById('deliveryMethod').value, status: 'Nová', date: new Date().toLocaleString() };
    if (!order.name || cart.length === 0) return alert("Prázdny košík alebo chýba meno!");
    await api('orders', 'POST', order);
    cart = []; updateCart(); toggleCart(); alert("Objednávka odoslaná!"); location.reload();
}

// --- RENDER (OPRAVENÝ) ---
async function render() {
    const matchesData = await api('matches') || {};
    const rosterData = await api('roster') || {};
    const productsData = await api('products') || {};

    const matches = Object.keys(matchesData).map(key => ({ id: key, ...matchesData[key] }));
    const roster = Object.keys(rosterData).map(key => ({ id: key, ...rosterData[key] }));
    const products = Object.keys(productsData).map(key => ({ id: key, ...productsData[key] }));

    // Domov
    const nCont = document.getElementById('next-match-summary'), lCont = document.getElementById('last-match-summary');
    if (nCont && lCont && matches.length > 0) {
        matches.sort((a, b) => new Date(a.date) - new Date(b.date));
        const next = matches.find(m => new Date(m.date) >= new Date());
        const past = [...matches].reverse().find(m => new Date(m.date) < new Date());
        nCont.innerHTML = next ? `<strong>${next.team1} vs ${next.team2}</strong>` : "TBA";
        lCont.innerHTML = past ? `<strong>${past.team1} ${past.score || ''} ${past.team2}</strong>` : "Žiadne výsledky";
    }

    // Zápasy podstránka
    if (document.getElementById('matches-container')) {
        document.getElementById('matches-container').innerHTML = matches.map(it => `<div class="match-card"><h3>${it.team1} ${it.score || 'vs'} ${it.team2}</h3><p>${it.date}</p></div>`).join('');
    }

    // Súpiska podstránka
    if (document.getElementById('roster-container')) {
        document.getElementById('roster-container').innerHTML = roster.map(it => `<div class="product-card"><img src="${it.img}" style="width:100%;height:150px;object-fit:cover;"><h3>#${it.number} ${it.name}</h3></div>`).join('');
    }

    // Fanshop podstránka
    if (document.getElementById('products-container')) {
        document.getElementById('products-container').innerHTML = products.map(it => `
            <div class="product-card">
                <img src="${it.img.split(',')[0]}" style="width:100%;height:150px;object-fit:cover;">
                <h3>${it.name}</h3>
                <button class="btn" onclick="openOrder('${it.id}')">Kúpiť</button>
            </div>`).join('');
    }
}

async function deleteItem(path, id) { if (confirm("Zmazať?")) { await api(`${path}/${id}`, 'DELETE'); location.reload(); } }
function closeModal() { document.getElementById('order-modal').style.display='none'; }

document.addEventListener('DOMContentLoaded', () => {
    render();
    if(document.getElementById('uvod')) showPage('uvod');
});
