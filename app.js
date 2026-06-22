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

    if (p.hasVariants && p.variants) {
        // Initial price shows the first variant price
        priceHTML = `<span id="price-p-${p.id}">Rs. ${p.variants[0].price}</span>`;
        variantsHTML = `<div class="variants" id="v-cont-${p.id}">` +
            p.variants.map((v, i) => `
                <button class="v-btn ${i === 0 ? 'selected' : ''}" 
                        data-price="${v.price}" 
                        data-size="${v.size}"
                        onclick="setVariant('${p.id}', this)">
                    ${v.size}
                </button>
            `).join('') + `</div>`;
    } else {
        priceHTML = `<span>Rs. ${p.price}</span>`;
    }

    return `
        <div class="card">
            <img src="${p.image}" alt="${p.name}" onerror="this.src='https://placehold.co/400x300?text=Food'">
            <div class="card-body">
                <h3 class="card-title">${p.name}</h3>
                <p class="card-desc">${p.desc || ''}</p>
                ${variantsHTML}
                <div class="card-price" id="final-container-${p.id}">${priceHTML}</div>
                <button class="btn btn-primary" onclick="addToCart('${p.id}')">+ Add to Cart</button>
            </div>
        </div>
    `;
}

/**
 * Switcher function for Sizes
 */
function setVariant(pid, clickedBtn) {
    // 1. Target specifically the buttons inside this pizza's container
    const container = document.getElementById(`v-cont-${pid}`);
    const allButtons = container.querySelectorAll('.v-btn');
    
    // 2. Remove 'selected' style from all other sizes
    allButtons.forEach(btn => btn.classList.remove('selected'));
    
    // 3. Highlight only the clicked one
    clickedBtn.classList.add('selected');
    
    // 4. Update the visual price on the card
    const priceValue = clickedBtn.getAttribute('data-price');
    const priceLabel = document.getElementById(`price-p-${pid}`);
    if (priceLabel) {
        priceLabel.innerText = `Rs. ${priceValue}`;
    }
}

/**
 * Final Add to Cart logic
 */
function addToCart(pid) {
    // Locate the raw product from our JSON data
    let foundProduct = null;
    menuData.categories.forEach(cat => {
        const match = cat.products.find(p => p.id === pid);
        if (match) foundProduct = match;
    });

    if (!foundProduct) return;

    let cartSize = null;
    let cartPrice = foundProduct.price;

    // Check if we need to grab size info
    if (foundProduct.hasVariants) {
        const activeSizeBtn = document.querySelector(`#v-cont-${pid} .v-btn.selected`);
        if (activeSizeBtn) {
            cartSize = activeSizeBtn.getAttribute('data-size');
            cartPrice = parseInt(activeSizeBtn.getAttribute('data-price'));
        }
    }

    // Create unique key for cart so "Medium" and "Small" don't mix
    const cartUniqueId = cartSize ? `${pid}-${cartSize}` : pid;
    
    const existingIndex = cart.findIndex(item => item.cartId === cartUniqueId);

    if (existingIndex > -1) {
        cart[existingIndex].qty += 1;
    } else {
        cart.push({
            cartId: cartUniqueId,
            id: pid,
            name: foundProduct.name,
            size: cartSize,
            price: cartPrice,
            qty: 1
        });
    }

    animateFlame();
    updateCartUI();
    saveCart();
}

function updateCartUI() {
    const list = document.getElementById('cart-items-list');
    const totalCount = cart.reduce((acc, i) => acc + i.qty, 0);
    document.getElementById('cart-count').innerText = totalCount;
    
    if (cart.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding:30px; color:#888;">Cart is currently empty.</div>`;
        document.getElementById('cart-total-amount').innerText = `Rs. 0`;
        return;
    }

    list.innerHTML = cart.map((item, index) => `
        <div class="cart-item-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #f0f0f0; padding-bottom:10px;">
            <div>
                <div style="font-weight:700;">${item.name}</div>
                <div style="font-size:0.8rem; color:#E21B1B;">${item.size || ''}</div>
                <div style="font-weight:700;">Rs. ${(item.price * item.qty).toLocaleString()}</div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <button onclick="changeQty(${index}, -1)" style="border:1px solid #ddd; background:white; width:28px; height:28px; border-radius:5px;">-</button>
                <span style="min-width:15px; text-align:center; font-weight:700;">${item.qty}</span>
                <button onclick="changeQty(${index}, 1)" style="border:1px solid #ddd; background:white; width:28px; height:28px; border-radius:5px;">+</button>
            </div>
        </div>
    `).join('');

    const subtotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
    document.getElementById('cart-total-amount').innerText = `Rs. ${subtotal.toLocaleString()}`;
}

function changeQty(idx, val) {
    cart[idx].qty += val;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    updateCartUI();
    saveCart();
}

function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('open');
    document.getElementById('cart-overlay').classList.toggle('open');
}

function animateFlame() {
    const flame = document.getElementById('flame');
    flame.classList.add('active');
    setTimeout(() => flame.classList.remove('active'), 800);
}

function saveCart() { 
    localStorage.setItem('yum_cart', JSON.stringify(cart)); 
}

function openCheckout() {
    if(cart.length === 0) return;
    document.getElementById('checkout-modal').classList.add('open');
}

function closeModal() {
    document.getElementById('checkout-modal').classList.remove('open');
}

function toggleAddress(isVisible) {
    document.getElementById('address-field').style.display = isVisible ? 'block' : 'none';
}

function sendToWhatsApp() {
    const custName = document.getElementById('order-name').value;
    const type = document.querySelector('input[name="otype"]:checked').value;
    const address = document.getElementById('order-address').value;
    
    if(!custName) return alert("Please enter your name");
    if(type === 'Delivery' && !address) return alert("Address is required for delivery");

    let text = `*New Order: Yumilicious Fast Food*\n------------------------------\n👤 *Customer:* ${custName}\n📦 *Order Type:* ${type}\n`;
    if(type === 'Delivery') text += `🏠 *Address:* ${address}\n`;
    text += `------------------------------\n🛒 *Items:*\n`;
    
    cart.forEach(i => {
        text += `• ${i.qty}x ${i.name} [${i.size || ''}] - Rs.${(i.price * i.qty).toLocaleString()}\n`;
    });
    
    const finalBill = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
    text += `------------------------------\n💰 *Total: Rs. ${finalBill.toLocaleString()}*`;

    const link = `https://wa.me/${menuData.restaurant.whatsapp}?text=${encodeURIComponent(text)}`;
    window.open(link, '_blank');
    
    // Clear and reset
    cart = [];
    saveCart();
    updateCartUI();
    closeModal();
    toggleCart();
}
