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

    if (p.hasVariants) {
        // We set ID for the price display specifically
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
        priceHTML = `Rs. ${p.price}`;
    }

    return `
        <div class="card">
            <img src="${p.image}" alt="${p.name}" onerror="this.src='https://placehold.co/400x300?text=Food'">
            <div class="card-body">
                <h3 class="card-title">${p.name}</h3>
                <p class="card-desc">${p.desc || ''}</p>
                ${variantsHTML}
                <div class="card-price" id="final-p-${p.id}">${priceHTML}</div>
                <button class="btn btn-primary" onclick="addToCart('${p.id}')">+ Add to Cart</button>
            </div>
        </div>
    `;
}

// Fixed variant selection logic
function setVariant(pid, btnElement) {
    const container = document.getElementById(`v-cont-${pid}`);
    
    // 1. Visually un-select other buttons
    container.querySelectorAll('.v-btn').forEach(btn => btn.classList.remove('selected'));
    
    // 2. Select the current button
    btnElement.classList.add('selected');
    
    // 3. Get values from the clicked button's Data Attributes
    const newPrice = btnElement.getAttribute('data-price');
    
    // 4. Update the Price Display in the card
    document.getElementById(`price-p-${pid}`).innerText = `Rs. ${newPrice}`;
}

// Fixed Add To Cart Logic
function addToCart(pid) {
    // 1. Find the basic product data
    let productData = null;
    menuData.categories.forEach(c => {
        const found = c.products.find(x => x.id === pid);
        if (found) productData = found;
    });

    let selectedSize = null;
    let selectedPrice = productData.price;

    // 2. If it has sizes, find WHICH button has the 'selected' class
    if (productData.hasVariants) {
        const selectedBtn = document.querySelector(`#v-cont-${pid} .v-btn.selected`);
        selectedSize = selectedBtn.getAttribute('data-size');
        selectedPrice = parseInt(selectedBtn.getAttribute('data-price'));
    }

    // 3. Create unique cart ID based on Size + Product ID
    const cartId = selectedSize ? `${pid}-${selectedSize}` : pid;
    
    // 4. Add to cart logic
    const exists = cart.find(item => item.cartId === cartId);
    if (exists) {
        exists.qty++;
    } else {
        cart.push({
            cartId: cartId,
            name: productData.name,
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
    document.getElementById('cart-count').innerText = cart.reduce((s, i) => s + i.qty, 0);
    
    if(cart.length === 0) {
        list.innerHTML = `<p style="text-align:center; padding:30px; color:#888;">Your cart is empty.</p>`;
        document.getElementById('cart-total-amount').innerText = `Rs. 0`;
        return;
    }

    list.innerHTML = cart.map((item, idx) => `
        <div class="cart-item-row">
            <div>
                <strong>${item.name}</strong><br>
                <small>${item.size || ''}</small>
                <div>Rs. ${item.price * item.qty}</div>
            </div>
            <div class="qty-ctrl">
                <button onclick="changeQty(${idx}, -1)">-</button>
                <span style="font-weight:600; min-width:15px; text-align:center">${item.qty}</span>
                <button onclick="changeQty(${idx}, 1)">+</button>
            </div>
        </div>
    `).join('');

    const total = cart.reduce((s, i) => s + (itemPriceTotal = i.price * i.qty), 0);
    document.getElementById('cart-total-amount').innerText = `Rs. ${cart.reduce((s, i) => s + (i.price * i.qty), 0).toLocaleString()}`;
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
function openCheckout() { 
    if(cart.length === 0) return alert("Cart is empty!");
    document.getElementById('checkout-modal').classList.add('open'); 
}
function closeModal() { document.getElementById('checkout-modal').classList.remove('open'); }
function toggleAddress(v) { document.getElementById('address-field').style.display = v ? 'block' : 'none'; }

function sendToWhatsApp() {
    const name = document.getElementById('order-name').value;
    const type = document.querySelector('input[name="otype"]:checked').value;
    const addr = document.getElementById('order-address').value;
    
    if(!name) return alert("Please enter your name");
    if(type === 'Delivery' && !addr) return alert("Please enter delivery address");

    let text = `*New Order from Yumilicious Website* 🍕\n--------------------------------\n👤 *Customer:* ${name}\n📦 *Order Type:* ${type}\n`;
    if(type === 'Delivery') text += `🏠 *Address:* ${addr}\n`;
    text += `--------------------------------\n🛒 *Items Details:*\n`;
    
    cart.forEach(i => {
        text += `• ${i.qty}x ${i.name} ${i.size ? '['+i.size+']' : ''} - Rs. ${(i.price * i.qty).toLocaleString()}\n`;
    });
    
    const totalAmount = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    text += `--------------------------------\n💰 *Total Amount: Rs. ${totalAmount.toLocaleString()}*`;

    const waLink = `https://wa.me/${menuData.restaurant.whatsapp}?text=${encodeURIComponent(text)}`;
    window.open(waLink, '_blank');
    
    cart = [];
    saveCart();
    updateCartUI();
    closeModal();
    toggleCart();
}
