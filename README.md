# Yumilicious Fast Food & Pizza - Web App

A lightweight, static, WhatsApp-ordering website for Yumilicious.

## 🚀 Setup Checklist
1. Create a GitHub account.
2. Create a repository named `yumilicious`.
3. Upload all files (`index.html`, `admin.html`, `products.json`, `style.css`, `app.js`, `admin.js`).
4. Go to **Settings > Pages**. 
5. Under **Build and deployment**, set Source to "Deploy from a branch" and select `main` / `root`.
6. Visit `https://[your-username].github.io/yumilicious`.

## 🛠 How to Update Prices
1. Open `admin.html` in your browser.
2. Login with password: `yumilicious2024`.
3. Change prices, click **Download products.json**.
4. Go to your GitHub repo, click **Add File > Upload files**, and upload the new `products.json` to replace the old one.
5. Site updates automatically in ~1 minute.

## 📱 WhatsApp Config
To change the number, edit `products.json` and update the `whatsapp` field (must start with country code, e.g., `923160490499`).