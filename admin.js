/**
 * ADMIN LOGIC FOR YUMILICIOUS
 * Password: yumilicious2024
 */

// The Correct SHA-256 Hash for "yumilicious2024"
const AUTH_HASH = "9830560a876a382101676f64242d5964f6932452309852077e6878e1c601447a"; 
let localData = null;

/**
 * Hashing function using browser-native SubtleCrypto
 */
async function hashString(str) {
    const msgUint8 = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Login Handler
 */
async function login() {
    const input = document.getElementById('pass-input').value;
    
    // Safety check for local file opening
    if (window.location.protocol === 'file:') {
        alert("NOTE: You are opening this as a local file. The admin panel needs to be uploaded to GitHub or run on a local server to load the menu data properly.");
    }

    const hashed = await hashString(input);
    
    if (hashed === AUTH_HASH) {
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
            `<p style="color:red">Error: Could not load products.json. Make sure the file exists in the same folder.</p>`;
    }
}

/**
 * Update Restaurant object in memory
 */
function updateRestInfo() {
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
    console.log("Updated in memory:", localData.categories[catIdx].products[pIdx].name, price);
}

/**
 * Generate and download the updated JSON file
 */
function downloadJSON() {
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