const ADMIN_PASSWORD = "yumilicious2024"; // <-- CHANGE THIS MANUALLY OR VIA SECURITY TAB

let localData = null;

function login() {
    const input = document.getElementById('pass-input').value;
    if (input === ADMIN_PASSWORD) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-content').style.display = 'block';
        loadData();
    } else {
        alert("Incorrect Password!");
    }
}

async function loadData() {
    try {
        const res = await fetch('./products.json');
        localData = await res.json();
        
        // Fill Info Tab
        document.getElementById('inf-name').value = localData.restaurant.name;
        document.getElementById('inf-wa').value = localData.restaurant.whatsapp;
        document.getElementById('inf-banner').value = localData.restaurant.bannerImage;
        
        renderMenuTable();
    } catch (e) {
        alert("Error loading products.json. Make sure you are using a local server or GitHub Pages.");
    }
}

function showTab(tabId, el) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    el.classList.add('active');
}

function renderMenuTable() {
    let html = `<table>
        <thead>
            <tr>
                <th>Preview</th>
                <th>Product Name</th>
                <th>Variant/Size</th>
                <th>Price (Rs)</th>
                <th>Image URL / Path</th>
            </tr>
        </thead>
        <tbody>`;

    localData.categories.forEach((cat, cIdx) => {
        cat.products.forEach((p, pIdx) => {
            // Handle variants (Pizzas)
            if (p.hasVariants) {
                p.variants.forEach((v, vIdx) => {
                    html += `<tr>
                        <td><img src="${p.image}" class="img-preview"></td>
                        <td><strong>${p.name}</strong></td>
                        <td>${v.size}</td>
                        <td><input type="number" value="${v.price}" onchange="updateVal(${cIdx}, ${pIdx}, 'price', this.value, ${vIdx})"></td>
                        <td><input type="text" value="${p.image}" onchange="updateVal(${cIdx}, ${pIdx}, 'image', this.value)"></td>
                    </tr>`;
                });
            } else {
                // Handle single items (Burgers/Fries)
                html += `<tr>
                    <td><img src="${p.image}" class="img-preview"></td>
                    <td><strong>${p.name}</strong></td>
                    <td>Standard</td>
                    <td><input type="number" value="${p.price}" onchange="updateVal(${cIdx}, ${pIdx}, 'price', this.value)"></td>
                    <td><input type="text" value="${p.image}" onchange="updateVal(${cIdx}, ${pIdx}, 'image', this.value)"></td>
                </tr>`;
            }
        });
    });
    html += `</tbody></table>`;
    document.getElementById('menu-table-container').innerHTML = html;
}

function updateVal(cIdx, pIdx, key, val, vIdx = null) {
    const product = localData.categories[cIdx].products[pIdx];
    
    if (key === 'price') {
        if (vIdx !== null) product.variants[vIdx].price = parseInt(val);
        else product.price = parseInt(val);
    } else if (key === 'image') {
        product.image = val;
        renderMenuTable(); // Refresh previews
    }
}

function syncInfo() {
    localData.restaurant.name = document.getElementById('inf-name').value;
    localData.restaurant.whatsapp = document.getElementById('inf-wa').value;
    localData.restaurant.bannerImage = document.getElementById('inf-banner').value;
}

function genPassCode() {
    const newPass = document.getElementById('new-pass-input').value;
    document.getElementById('pass-code-output').textContent = `const ADMIN_PASSWORD = "${newPass}";`;
}

function downloadJSON() {
    const blob = new Blob([JSON.stringify(localData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "products.json";
    a.click();
    alert("Success! Now upload the downloaded 'products.json' to GitHub to save your changes.");
}

function logout() { window.location.reload(); }