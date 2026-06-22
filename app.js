let menu = null;
let cart = JSON.parse(localStorage.getItem('yum_cart')) || [];

document.addEventListener('DOMContentLoaded', () => {
    loadMenu();
});

async function loadMenu() {
    const display = document.getElementById('menu-display');
    try {
        const response = await fetch('./products.json');
        
        if (!response.ok) {
            throw new Error(`Status: ${response.status} (File not found)`);
        }

        menu = await response.json();
        renderSite();
    } catch (err) {
        console.error("Critical Load Error:", err);
        display.innerHTML = `
            <div style="text-align:center; padding: 100px 20px;">
                <h1 style="color:#E21B1B">⚠️ Oops! Menu Failed to Load</h1>
                <p>Possible causes:</p>
                <ul style="display:inline-block; text-align:left;">
                    <li><strong>Path Error:</strong> products.json is not in the same folder as index.html</li>
                    <li><strong>GitHub Pages:</strong> If you just uploaded, wait 1-2 minutes for GitHub to refresh.</li>
                    <li><strong>Browser Security:</strong> You are testing on your computer desktop instead of GitHub or a server.</li>
                </ul>
            </div>`;
    }
}

function renderSite() {
    const r = menu.restaurant;
    
    // UI Metadata
    document.title = r.name;
    document.getElementById('rest-logo').src = r.logoImage;
    document.getElementById('rest-name').innerText = r.name;
    document.getElementById('hero-title').innerText = r.name;
    document.getElementById('hero-tagline').innerText = r.bannerTagline;
    
    const hero = document.querySelector('.hero');
    hero.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${r.bannerImage}')`;

    // Category Navigation
    const nav = document.getElementById('cat-nav');
    nav.innerHTML = menu.categories.map((c, i) => `
        <div class="cat-item ${i === 0 ? 'active' : ''}" onclick="filterCat('${c.id}', this)">
            ${c.icon} ${c.name}
        </div>
    `).join('');

    // Products
    const display = document.getElementById('menu-display');
    let content = "";
    menu.categories.forEach(cat => {
        content += `
            <section id="${cat.id}">
                <h2 style="font-family:'Playfair Display'; margin-top:50px; font-size: 2rem;">${cat.icon} ${cat.name}</h2>
                <div class="grid">
                    ${cat.products.map(p => {
                        let varsHtml = "";
                        let currentPrice = p.price;
                        
                        if(p.hasVariants) {
                            currentPrice = p.variants[0].price;
                            varsHtml = `<div class="v-container" id="vc-${p.id}">` +
                                p.variants.map((v, i) => `
                                <button class="v-btn ${i === 0 ? 'sel' : ''}" onclick="updateP('${p.id}', '${v.size}', ${v.price}, this)">${v.size}</button>
                                `).join('') + `</div>`;
                        }
                        
                        return `
                        <div class="card">
                            <img src="${p.image}" alt="${p.name}">
                            <div class="card-content">
                                <div class="card-title">${p.name}</div>
                                <p style="font-size:0.8rem; color:#777; flex:1;">${p.desc || ''}</p>
                                ${varsHtml}
                                <div class="price-text" id="pr-${p.id}">Rs. ${currentPrice}</div>
                                <button class="btn-add" onclick="addOrder('${p.id}')">Add to Order</button>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </section>`;
    });
    display.innerHTML = content;
    updateUI(); // Setup cart badge
}

// Support Functions
function updateP(pid, size, price, btn) {
    const parent = document.getElementById(`vc-${pid}`);
    parent.querySelectorAll('.v-btn').forEach(b => b.classList.remove('sel'));
    btn.classList.add('sel');
    document.getElementById(`pr-${pid}`).innerText = `Rs. ${price}`;
}

function filterCat(id, el) {
    document.querySelectorAll('.cat-item').forEach(x => x.classList.remove('active'));
    el.classList.add('active');
    const target = document.getElementById(id);
    window.scrollTo({ top: target.offsetTop - 140, behavior: 'smooth' });
}

function addOrder(pid) {
    let item = null;
    menu.categories.forEach(c => {
        const found = c.products.find(x => x.id === pid);
        if(found) item = found;
    });

    let s = null;
    let p = item.price;

    if(item.hasVariants) {
        const active = document.querySelector(`#vc-${pid} .sel`);
        s = active.innerText;
        p = item.variants.find(v => v.size === s).price;
    }

    const uniqueId = s ? `${pid}-${s}` : pid;
    const exists = cart.find(x => x.uid === uniqueId);
    if(exists) exists.qty++;
    else cart.push({ uid: uniqueId, name: item.name, size: s, price: p, qty: 1 });

    saveData();
    updateUI();
    const flame = document.getElementById('flame');
    flame.classList.add('active');
    setTimeout(() => flame.classList.remove('active'), 1000);
}

function updateUI() {
    document.getElementById('cart-count').innerText = cart.reduce((a, b) => a + b.qty, 0);
    const list = document.getElementById('cart-list');
    
    if(cart.length === 0) {
        list.innerHTML = `<p style="text-align:center; padding:30px; color:#999;">Empty Cart</p>`;
        document.getElementById('cart-total').innerText = "Rs. 0";
        return;
    }

    list.innerHTML = cart.map((i, idx) => `
        <div style="border-bottom:1px solid #eee; padding:10px 0; display:flex; justify-content:space-between; align-items:center;">
            <div style="font-size:0.9rem;"><strong>${i.name}</strong><br><small>${i.size||''}</small><br>Rs. ${i.price*i.qty}</div>
            <div>
                <button onclick="qty(${idx}, -1)" style="width:25px; border-radius:5px; border:1px solid #ddd;">-</button>
                <span>${i.qty}</span>
                <button onclick="qty(${idx}, 1)" style="width:25px; border-radius:5px; border:1px solid #ddd;">+</button>
            </div>
        </div>
    `).join('');
    
    document.getElementById('cart-total').innerText = "Rs. " + cart.reduce((a, b) => a + (b.price * b.qty), 0);
}

function qty(idx, diff) {
    cart[idx].qty += diff;
    if(cart[idx].qty <= 0) cart.splice(idx, 1);
    updateUI(); saveData();
}

function saveData() { localStorage.setItem('yum_cart', JSON.stringify(cart)); }
function toggleCart() {
    document.getElementById('cart-panel').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('open');
}
function openCheckout() {
    if(cart.length > 0) document.getElementById('order-modal').classList.add('open');
    else alert("Empty Cart!");
}
function closeModal() { document.getElementById('order-modal').classList.remove('open'); }
function setAddr(v) { document.getElementById('cust-addr').style.display = v ? 'block' : 'none'; }

function checkout() {
    const name = document.getElementById('cust-name').value;
    const type = document.querySelector('input[name="order-type"]:checked').value;
    const addr = document.getElementById('cust-addr').value;

    if(!name || (type==='Delivery' && !addr)) return alert("Missing Info");

    let text = `*New Yumilicious Order*\nCustomer: ${name}\nType: ${type}\n`;
    if(type==='Delivery') text += `Addr: ${addr}\n`;
    text += `\n🛒 *Items:*\n`;
    cart.forEach(i => text += `• ${i.qty}x ${i.name} [${i.size||''}] = Rs. ${i.price*i.qty}\n`);
    text += `\n*TOTAL: Rs. ${cart.reduce((a, b) => a + (b.price*b.qty), 0)}*`;

    window.open(`https://wa.me/${menu.restaurant.whatsapp}?text=${encodeURIComponent(text)}`);
    cart = []; saveData(); updateUI(); closeModal(); toggleCart();
}