let menuData = null;
let cart = JSON.parse(localStorage.getItem('yum_cart')) || [];

document.addEventListener('DOMContentLoaded', () => {
    fetchMenu();
});

async function fetchMenu() {
    try {
        const response = await fetch('./products.json');
        if (!response.ok) throw new Error("Could not find products.json");
        menuData = await response.json();
        
        renderHeader();
        renderCategories();
        renderProducts();
        updateCartUI();
    } catch (err) {
        console.error("Fetch Error:", err);
        document.getElementById('menu-container').innerHTML = 
            `<h2 style="text-align:center; padding:50px; color:red;">⚠️ Failed to load menu. Ensure products.json is in the same folder.</h2>`;
    }
}

function renderHeader() {
    const r = menuData.restaurant;
    document.getElementById('rest-logo').src = r.logoImage;
    document.getElementById('rest-name').textContent = r.name;
    document.getElementById('hero-title').textContent = r.name;
    document.getElementById('hero-tagline').textContent = r.bannerTagline;
    document.getElementById('footer-addr').textContent = r.address;
    document.getElementById('hero-bg').style.backgroundImage = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${r.bannerImage}')`;
}

function renderCategories() {
    const nav = document.getElementById('cat-nav');
    nav.innerHTML = menuData.categories.map((cat, idx) => `
        <div class="cat-item ${idx === 0 ? 'active' : ''}" onclick="scrollToCat('${cat.id}', this)">
            ${cat.icon} ${cat.name}
        </div>
    `).join('');
}

function scrollToCat(id, el) {
    document.querySelectorAll('.cat-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    const target = document.getElementById(id);
    const offset = 140;
    window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
}

function renderProducts() {
    const container = document.getElementById('menu-container');
    let html = "";

    menuData.categories.forEach(cat => {
        html += `
            <section id="${cat.id}">
                <h2 class="category-header">${cat.icon} ${cat.name}</h2>
                <div class="product-grid">
                    ${cat.products.map(p => renderProductCard(p)).join('')}
                </div>
            </section>
        `;
    });
    container.innerHTML = html;
}

function renderProductCard(p) {
    let priceHTML = "";
    let variantsHTML = "";

    if (p.hasVariants) {
        priceHTML = `<span id="price-p-${p.id}">Rs. ${p.variants[0].price}</span>`;
        variantsHTML = `<div class="variants" id="v-cont-${p.id}">` +
            p.variants.map((v, i) => `
                <button class="v-btn ${i === 0 ? 'selected' : ''}" 
                        onclick="setVariant('${p.id}', '${v.size}', ${v.price}, this)">
                    ${v.size}
                </button>
            `).join('') + `</div>`;
    } else {
        priceHTML = `Rs. ${p.price}`;
    }

    return `
        <div class="card">
            <img src="${p.image}" alt="${p.name}" onerror="this.src='https://placehold.co/400x300?text=Food'">
            <div class="card-body">
                <h3 class="card-title">${p.name}</h3>
                <p class="card-desc">${p.desc || ''}</p>
                ${variantsHTML}
                <div class="card-price">${priceHTML}</div>
                <button class="btn btn-primary" onclick="addToCart('${p.id}')">+ Add to Cart</button>
            </div>
        </div>
    `;
}

function setVariant(pid, size, price, el) {
    const parent = document.getElementById(`v-cont-${pid}`);
    parent.querySelectorAll('.v-btn').forEach(b => b.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById(`price-p-${pid}`).innerText = `Rs. ${price}`;
}

function addToCart(pid) {
    let product = null;
    menuData.categories.forEach(c => {
        const found = c.products.find(x => x.id === pid);
        if (found) product = found;
    });

    let size = null;
    let price = product.price;

    if (product.hasVariants) {
        const btn = document.querySelector(`#v-cont-${pid} .selected`);
        size = btn.innerText;
        price = product.variants.find(v => v.size === size).price;
    }

    const cartId = size ? `${pid}-${size}` : pid;
    const exists = cart.find(i => i.cartId === cartId);

    if (exists) {
        exists.qty++;
    } else {
        cart.push({ cartId, name: product.name, size, price, qty: 1 });
    }

    animateFlame();
    updateCartUI();
    saveCart();
}

function updateCartUI() {
    const list = document.getElementById('cart-items-list');
    document.getElementById('cart-count').innerText = cart.reduce((s, i) => s + i.qty, 0);
    
    list.innerHTML = cart.map((item, idx) => `
        <div class="cart-item-row">
            <div>
                <strong>${item.name}</strong><br>
                <small>${item.size || ''}</small>
                <div>Rs. ${item.price * item.qty}</div>
            </div>
            <div class="qty-ctrl">
                <button onclick="changeQty(${idx}, -1)">-</button>
                <span>${item.qty}</span>
                <button onclick="changeQty(${idx}, 1)">+</button>
            </div>
        </div>
    `).join('');

    const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    document.getElementById('cart-total-amount').innerText = `Rs. ${total.toLocaleString()}`;
}

function changeQty(idx, diff) {
    cart[idx].qty += diff;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    updateCartUI();
    saveCart();
}

function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('open');
    document.getElementById('cart-overlay').classList.toggle('open');
}

function animateFlame() {
    const f = document.getElementById('flame');
    f.classList.add('active');
    setTimeout(() => f.classList.remove('active'), 1000);
}

function saveCart() { localStorage.setItem('yum_cart', JSON.stringify(cart)); }
function openCheckout() { document.getElementById('checkout-modal').classList.add('open'); }
function closeModal() { document.getElementById('checkout-modal').classList.remove('open'); }
function toggleAddress(v) { document.getElementById('address-field').style.display = v ? 'block' : 'none'; }

function sendToWhatsApp() {
    const name = document.getElementById('order-name').value;
    const type = document.querySelector('input[name="otype"]:checked').value;
    const addr = document.getElementById('order-address').value;
    if(!name) return alert("Please enter name");

    let text = `*New Order - Yumilicious*\nCustomer: ${name}\nType: ${type}\n`;
    if(type === 'Delivery') text += `Address: ${addr}\n`;
    text += `\n*Items:*\n`;
    cart.forEach(i => text += `• ${i.qty}x ${i.name} [${i.size||''}] - Rs.${i.price*i.qty}\n`);
    const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    text += `\n*TOTAL: Rs. ${total.toLocaleString()}*`;

    window.open(`https://wa.me/${menuData.restaurant.whatsapp}?text=${encodeURIComponent(text)}`);
    cart = []; saveCart(); updateCartUI(); closeModal(); toggleCart();
}