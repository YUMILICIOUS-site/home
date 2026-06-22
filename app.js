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
            <h2 style="font-family:'Playfair Display'; font-size: 2rem; border-left: 5px solid var(--primary); padding-left: 15px; margin-bottom:20px;">
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
        // Default to first variant
        priceHTML = `<span id="price-display-${p.id}">Rs. ${p.variants[0].price.toLocaleString()}</span>`;
        variantsHTML = `
            <div class="variants" id="variants-${p.id}">
                ${p.variants.map((v, i) => `
                    <button class="v-btn ${i === 0 ? 'selected' : ''}" 
                        data-price="${v.price}" 
                        data-size="${v.size}"
                        onclick="selectVariant('${p.id}', this)">
                        ${v.size}
                    </button>
                `).join('')}
            </div>
        `;
    } else {
        priceHTML = `Rs. ${p.price.toLocaleString()}`;
    }

    return `
        <div class="card" id="card-${p.id}">
            <img src="${p.image}" alt="${p.name}" loading="lazy">
            <div class="card-body">
                <h3 class="card-title">${p.name}</h3>
                <p class="card-desc">${p.desc || ''}</p>
                ${variantsHTML}
                <div class="card-price" id="container-price-${p.id}">${priceHTML}</div>
                <button class="btn btn-primary" onclick="addToCart('${p.id}')">Add to Cart</button>
            </div>
        </div>
    `;
}

// Logic to change the size and update the displayed price
function selectVariant(pid, el) {
    const variantContainer = document.getElementById(`variants-${pid}`);
    // Remove selected class from all buttons in this specific card
    variantContainer.querySelectorAll('.v-btn').forEach(btn => btn.classList.remove('selected'));
    // Add to clicked one
    el.classList.add('selected');
    
    // Update the price text
    const newPrice = parseInt(el.getAttribute('data-price'));
    document.getElementById(`price-display-${pid}`).textContent = `Rs. ${newPrice.toLocaleString()}`;
}

function addToCart(pid) {
    // 1. Find product data
    let product = null;
    menuData.categories.forEach(cat => {
        const found = cat.products.find(p => p.id === pid);
        if (found) product = found;
    });

    if (!product) return;

    let finalSize = null;
    let finalPrice = product.price;

    // 2. If it has sizes, find the one with the 'selected' class
    if (product.hasVariants) {
        const selectedBtn = document.querySelector(`#variants-${pid} .v-btn.selected`);
        finalSize = selectedBtn.getAttribute('data-size');
        finalPrice = parseInt(selectedBtn.getAttribute('data-price'));
    }

    // 3. Create a unique ID for the cart (so Small and Large pizza are separate lines)
    const cartId = finalSize ? `${pid}-${finalSize}` : pid;

    // 4. Add to cart array
    const existingIndex = cart.findIndex(item => item.cartId === cartId);
    if (existingIndex > -1) {
        cart[existingIndex].qty += 1;
    } else {
        cart.push({
            cartId: cartId,
            id: pid,
            name: product.name,
            size: finalSize,
            price: finalPrice,
            qty: 1,
            image: product.image
        });
    }

    // 5. Update UI
    animateFlame();
    updateCartUI();
    saveCart();
    
    // Optional: open cart automatically on mobile when item added
    if(window.innerWidth < 500) {
        toggleCart();
    }
}

function updateCartUI() {
    const list = document.getElementById('cart-items-list');
    const countBadge = document.getElementById('cart-count');
    const totalEl = document.getElementById('cart-total-amount');

    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    countBadge.textContent = totalQty;
    
    if (cart.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding: 40px; color: #888;">
            <div style="font-size: 3rem; margin-bottom: 10px;">🛒</div>
            <p>Your cart is empty.</p>
        </div>`;
        totalEl.textContent = `Rs. 0`;
        return;
    }

    list.innerHTML = cart.map((item, idx) => `
        <div class="cart-item-row">
            <div style="flex: 1;">
                <div style="font-weight: 600; font-size: 0.95rem;">${item.name}</div>
                ${item.size ? `<div style="font-size: 0.8rem; color: var(--primary); font-weight:500;">Size: ${item.size}</div>` : ''}
                <div style="font-weight: 700; margin-top: 4px;">Rs. ${(item.price * item.qty).toLocaleString()}</div>
            </div>
            <div class="qty-ctrl">
                <button class="qty-btn" onclick="updateQty(${idx}, -1)">-</button>
                <span style="font-weight:600; width: 20px; text-align:center;">${item.qty}</span>
                <button class="qty-btn" onclick="updateQty(${idx}, 1)">+</button>
            </div>
        </div>
    `).join('');

    const grandTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    totalEl.textContent = `Rs. ${grandTotal.toLocaleString()}`;
}

function updateQty(idx, delta) {
    cart[idx].qty += delta;
    if (cart[idx].qty <= 0) {
        cart.splice(idx, 1);
    }
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
    f.classList.remove('animate');
    void f.offsetWidth; // trigger reflow
    f.classList.add('animate');
    setTimeout(() => { f.style.display = 'none'; }, 1500);
}

function saveCart() {
    localStorage.setItem('yum_cart', JSON.stringify(cart));
}

function openCheckout() {
    if (cart.length === 0) return alert("Add items to your cart first!");
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

    if (!name) return alert("Please enter your name");
    if (type === 'Delivery' && !addr) return alert("Please enter delivery address");

    const grandTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    let orderText = `*New Order from Website* 🍕\n\n`;
    orderText += `👤 *Customer:* ${name}\n`;
    orderText += `📦 *Type:* ${type}\n`;
    if(type === 'Delivery') orderText += `🏠 *Address:* ${addr}\n`;
    if(notes) orderText += `📝 *Instructions:* ${notes}\n`;
    orderText += `\n🛒 *Order Details:*\n`;
    
    cart.forEach(item => {
        orderText += `• ${item.qty}x ${item.name} ${item.size ? '('+item.size+')' : ''} - Rs.${(item.price * item.qty).toLocaleString()}\n`;
    });
    
    orderText += `\n💰 *Total Amount: Rs. ${grandTotal.toLocaleString()}*`;
    orderText += `\n\n_Delivery charges will be confirmed on call._`;

    const waUrl = `https://wa.me/${menuData.restaurant.whatsapp}?text=${encodeURIComponent(orderText)}`;
    window.open(waUrl, '_blank');
    
    // Clear cart and finish
    cart = [];
    saveCart();
    updateCartUI();
    closeModal();
    toggleCart();
}