let menuData = null;
let cart = JSON.parse(localStorage.getItem('yum_cart')) || [];

document.addEventListener('DOMContentLoaded', () => {
    fetchMenu();
});

async function fetchMenu() {
    try {
        const response = await fetch('./products.json');
        menuData = await response.json();
        renderHeader();
        renderCategories();
        renderAllProducts();
        updateCartUI();
    } catch (err) {
        console.error("Failed to load menu", err);
    }
}

function renderHeader() {
    const r = menuData.restaurant;
    document.getElementById('rest-logo').src = r.logoImage;
    document.getElementById('rest-name').textContent = r.name;
    document.getElementById('hero-bg').style.backgroundImage = `url('${r.bannerImage}')`;
    document.getElementById('hero-title').textContent = r.name;
    document.getElementById('hero-tagline').textContent = r.bannerTagline;
    document.getElementById('footer-addr').textContent = r.address;
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
    document.getElementById(id).scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderAllProducts() {
    const container = document.getElementById('menu-container');
    container.innerHTML = menuData.categories.map(cat => `
        <section id="${cat.id}" style="padding-top: 80px">
            <h2 style="font-family:'Playfair Display'; font-size: 2rem; border-left: 5px solid var(--primary); padding-left: 15px">
                ${cat.icon} ${cat.name}
            </h2>
            <div class="grid">
                ${cat.products.map(p => renderProductCard(p)).join('')}
            </div>
        </section>
    `).join('');
}

function renderProductCard(p) {
    let priceHTML = '';
    let variantsHTML = '';

    if (p.hasVariants) {
        priceHTML = `<span id="price-${p.id}">Rs. ${p.variants[0].price}</span>`;
        variantsHTML = `
            <div class="variants">
                ${p.variants.map((v, i) => `
                    <button class="v-btn ${i === 0 ? 'selected' : ''}" 
                        onclick="selectVariant('${p.id}', '${v.size}', ${v.price}, this)">
                        ${v.size}
                    </button>
                `).join('')}
            </div>
        `;
    } else {
        priceHTML = `Rs. ${p.price}`;
    }

    return `
        <div class="card">
            <img src="${p.image}" alt="${p.name}" loading="lazy">
            <div class="card-body">
                <h3 class="card-title">${p.name}</h3>
                <p class="card-desc">${p.desc || ''}</p>
                ${variantsHTML}
                <div class="card-price">${priceHTML}</div>
                <button class="btn btn-primary" onclick="addToCart('${p.id}')">Add to Cart</button>
            </div>
        </div>
    `;
}

function selectVariant(pid, size, price, el) {
    const parent = el.parentElement;
    parent.querySelectorAll('.v-btn').forEach(b => b.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById(`price-${pid}`).textContent = `Rs. ${price}`;
}

function addToCart(pid) {
    let product;
    menuData.categories.forEach(c => {
        const found = c.products.find(p => p.id === pid);
        if (found) product = found;
    });

    let selectedSize = null;
    let selectedPrice = product.price;

    const card = document.getElementById(`price-${pid}`)?.closest('.card');
    if (card && product.hasVariants) {
        const selBtn = card.querySelector('.v-btn.selected');
        selectedSize = selBtn.textContent.trim();
        selectedPrice = product.variants.find(v => v.size === selectedSize).price;
    }

    const cartId = selectedSize ? `${pid}-${selectedSize}` : pid;
    const existing = cart.find(item => item.cartId === cartId);

    if (existing) {
        existing.qty++;
    } else {
        cart.push({
            cartId,
            id: pid,
            name: product.name,
            size: selectedSize,
            price: selectedPrice,
            qty: 1
        });
    }

    animateFlame();
    updateCartUI();
    saveCart();
}

function updateCartUI() {
    const list = document.getElementById('cart-items-list');
    const count = document.getElementById('cart-count');
    const totalEl = document.getElementById('cart-total-amount');

    count.textContent = cart.reduce((acc, item) => acc + item.qty, 0);
    
    if (cart.length === 0) {
        list.innerHTML = `<p style="text-align:center; padding: 20px;">Your cart is empty</p>`;
        totalEl.textContent = `Rs. 0`;
        return;
    }

    list.innerHTML = cart.map((item, idx) => `
        <div class="cart-item-row">
            <div>
                <strong>${item.name}</strong><br>
                <small>${item.size || ''}</small>
            </div>
            <div class="qty-ctrl">
                <button class="qty-btn" onclick="updateQty(${idx}, -1)">-</button>
                <span>${item.qty}</span>
                <button class="qty-btn" onclick="updateQty(${idx}, 1)">+</button>
            </div>
            <div>Rs. ${item.price * item.qty}</div>
        </div>
    `).join('');

    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    totalEl.textContent = `Rs. ${total.toLocaleString()}`;
}

function updateQty(idx, delta) {
    cart[idx].qty += delta;
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
    f.style.display = 'block';
    setTimeout(() => f.style.display = 'none', 2000);
}

function saveCart() {
    localStorage.setItem('yum_cart', JSON.stringify(cart));
}

function openCheckout() {
    if (cart.length === 0) return alert("Cart is empty!");
    document.getElementById('checkout-modal').classList.add('open');
}

function closeModal() {
    document.getElementById('checkout-modal').classList.remove('open');
}

function toggleAddress(show) {
    document.getElementById('address-field').style.display = show ? 'block' : 'none';
}

function sendToWhatsApp() {
    const name = document.getElementById('order-name').value;
    const type = document.querySelector('input[name="otype"]:checked').value;
    const addr = document.getElementById('order-address').value;
    const notes = document.getElementById('order-notes').value;

    if (!name || (type === 'Delivery' && !addr)) {
        alert("Please fill in required fields");
        return;
    }

    let itemsText = cart.map(i => `• ${i.qty}x ${i.name} ${i.size ? '('+i.size+')' : ''} — Rs.${(i.price * i.qty).toLocaleString()}`).join('\n');
    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

    const message = `Hello Yumilicious! 🍕\n\nI'd like to place an order:\n\n🛒 *My Order:*\n${itemsText}\n\n💰 *Total: Rs. ${total.toLocaleString()}*\n\n👤 *Name:* ${name}\n📦 *Type:* ${type}\n${type === 'Delivery' ? '🏠 *Address:* ' + addr : ''}\n📝 *Notes:* ${notes || 'None'}\n\nThank you!`;

    const waUrl = `https://wa.me/${menuData.restaurant.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    
    // Clear cart after ordering
    cart = [];
    saveCart();
    updateCartUI();
    closeModal();
    toggleCart();
}