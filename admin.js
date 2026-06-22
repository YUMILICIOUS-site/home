/**
 * ADMIN LOGIC FOR YUMILICIOUS
 * Password: yumilicious2024
 */

// We will use a plain string for maximum compatibility
const ADMIN_PASSWORD = "yumilicious2024"; 
let localData = null;

/**
 * Login Handler
 */
function login() {
    const input = document.getElementById('pass-input').value;
    
    // Simple, reliable check that works on all browsers and local files
    if (input === ADMIN_PASSWORD) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-content').style.display = 'block';
        loadAdminData();
    } else {
        alert("Incorrect password. Please try again.");
    }
}

/**
 * Fetch products.json and populate forms
 */
async function loadAdminData() {
    try {
        // This may still fail if opening as a local file due to browser security
        // It works perfectly once uploaded to GitHub.
        const res = await fetch('./products.json');
        if (!res.ok) throw new Error("Could not find products.json");
        
        localData = await res.json();
        
        // Fill Restaurant Info
        document.getElementById('admin-rest-name').value = localData.restaurant.name;
        document.getElementById('admin-rest-wa').value = localData.restaurant.whatsapp;
        document.getElementById('admin-banner-url').value = localData.restaurant.bannerImage;
        
        renderPriceTable();
    } catch (err) {
        console.error(err);
        document.getElementById('price-table-container').innerHTML = 
            `<div style="color:red; padding:20px; border:1px solid red; background:#fff0f0;">
                <p><strong>⚠️ Browser Security Block</strong></p>
                <p>Browsers block loading data files directly from your computer for security.</p>
                <p><strong>To see your data:</strong> Please upload your files to GitHub Pages. It will work perfectly there!</p>
            </div>`;
    }
}

/**
 * Update Restaurant object in memory
 */
function updateRestInfo() {
    if(!localData) return;
    localData.restaurant.name = document.getElementById('admin-rest-name').value;
    localData.restaurant.whatsapp = document.getElementById('admin-rest-wa').value;
    localData.restaurant.bannerImage = document.getElementById('admin-banner-url').value;
}

/**
 * Build the Editable Price Table
 */
function renderPriceTable() {
    let html = `<table>
        <thead>
            <tr>
                <th>Category</th>
                <th>Product Name</th>
                <th>Size/Variant</th>
                <th>Price (Rs)</th>
            </tr>
        </thead>
        <tbody>`;

    localData.categories.forEach((cat, catIdx) => {
        cat.products.forEach((p, pIdx) => {
            if (p.hasVariants) {
                p.variants.forEach((v, vIdx) => {
                    html += `<tr>
                        <td style="font-size:0.8rem; color:#888">${cat.name}</td>
                        <td>${p.name}</td>
                        <td>${v.size}</td>
                        <td><input type="number" value="${v.price}" onchange="updatePrice(${catIdx}, ${pIdx}, ${vIdx}, this.value)"></td>
                    </tr>`;
                });
            } else {
                html += `<tr>
                    <td style="font-size:0.8rem; color:#888">${cat.name}</td>
                    <td>${p.name}</td>
                    <td>Standard</td>
                    <td><input type="number" value="${p.price}" onchange="updatePrice(${catIdx}, ${pIdx}, null, this.value)"></td>
                </tr>`;
            }
        });
    });

    html += `</tbody></table>`;
    document.getElementById('price-table-container').innerHTML = html;
}

/**
 * Update data in localData variable when user types in table
 */
function updatePrice(catIdx, pIdx, vIdx, newVal) {
    const price = parseInt(newVal);
    if (vIdx !== null) {
        localData.categories[catIdx].products[pIdx].variants[vIdx].price = price;
    } else {
        localData.categories[catIdx].products[pIdx].price = price;
    }
}

/**
 * Generate and download the updated JSON file
 */
function downloadJSON() {
    if(!localData) return alert("No data loaded to save.");
    
    const dataStr = JSON.stringify(localData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = "products.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert("File downloaded! Now upload this products.json to your GitHub repository to make the changes live.");
}

function logout() {
    window.location.reload();
}