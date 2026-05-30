# StockSync Lite 🔄

> **Live Demo** → [stocksync-lite.vercel.app](https://stocksync-lite.vercel.app)

StockSync Lite is a B2B multi-channel inventory synchronization dashboard designed for small e-commerce merchants. It keeps stock levels perfectly synced in real-time between **Shopify** and **eBay**, using the **SKU (Stock Keeping Unit)** as the master matching key — with zero monthly costs.

Its primary unique selling point is the **Buffer Stock (Safety Stock)** system, which dynamically deducts a configurable safety margin from your eBay inventory. This ensures that even during peak shopping hours with high sales velocity, you will never double-sell and face penalization or account suspension from eBay.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔄 **Real-time Sync** | Instant Shopify → eBay inventory sync via SKU mapping |
| 🛡️ **Buffer Stock** | Configurable safety buffer slider to prevent overselling |
| ⚠️ **Low Stock Alerts** | Animated badge + browser push when stock drops below threshold |
| 📊 **Sync Statistics** | Live bar chart (native Canvas 2D) with 3 KPI counters |
| 🔍 **Live SKU Search** | Real-time table filter as you type |
| 📋 **CSV Import** | Bulk-import SKU mappings from a `.csv` file |
| 🌙 **Dark / Light Mode** | Smooth theme toggle, preference saved in `localStorage` |
| 🔔 **Browser Notifications** | Native OS push alerts on every sync event |
| 🌐 **EN / IT Localization** | Full bilingual UI, auto-detected from browser language |
| 🖥️ **Sandbox Simulator** | Live demo mode — no API keys needed to test |
| ☁️ **Serverless Ready** | One-click deploy on Vercel at $0/month |

---

## 🚀 Getting Started

### 1. Instant Local Preview (Sandbox Simulator)

Since this application features an **automated Dual-Mode Client**, you can test the entire interactive dashboard immediately on your local computer without installing Node.js, databases, or running server commands.

1. Navigate to your local project folder: `NUOVO PROGETTO`.
2. **Double-click the `index.html` file** to open it directly in any web browser.
3. The dashboard will boot in **Sandbox Simulation Mode** — no API keys required:
    * **Preset Demo Data**: Pre-populates 3 products with active stock levels immediately.
    * **Buffer Stock Slider**: Drag the slider — eBay quantities recalculate instantly in real-time.
    * **Low Stock Alert Slider**: Set the threshold and watch rows highlight with an animated `LOW` badge when stock drops below it.
    * **Manual Sync**: Click the **↺** icon on any row to simulate an instant inventory update.
    * **Background Webhooks**: Every 25 seconds, the simulator auto-sells a random product on Shopify, deducts stock, and triggers an eBay sync — all visible live on screen.
    * **Statistics Panel**: Watch the bar chart and KPI counters update in real-time after every sync event.
    * **SKU Search**: Type in the search bar to filter products by SKU code instantly.
    * **CSV Import**: Click the **CSV** button to bulk-import product mappings from a file.
    * **🌙 Dark / Light Mode**: Toggle in the top navbar — preference is saved across sessions.
    * **🔔 Browser Notifications**: Click the bell icon to enable native OS push alerts on every sync.

---

## 📋 CSV Import Format

To bulk-import SKU mappings, prepare a `.csv` file with the following columns (header row required). Both `,` and `;` delimiters are supported:

```csv
sku,shopifyId,ebayId
TSHIRT-BLUE-M,gid://shopify/ProductVariant/123456789,987654321
HOODIE-RED-XL,gid://shopify/ProductVariant/987654321,123456789
CAP-BLACK-OS,gid://shopify/ProductVariant/112233445,556677889
```

| Column | Description |
|---|---|
| `sku` | Master SKU — must be identical on both Shopify and eBay |
| `shopifyId` | Shopify Variant ID (from Admin API) or Product ID |
| `ebayId` | eBay Item ID (numeric listing ID) |

> Duplicate SKUs are automatically skipped. The import report shows how many were added vs. skipped.

---

## ☁️ Deployment Guide (Free Hosting on Vercel)

Deploying StockSync Lite to the cloud costs **$0.00/month** and takes less than a minute.

### Step 1: Push to GitHub and Connect to Vercel
1. Create a free account on [Vercel](https://vercel.com).
2. In the Vercel Dashboard, click **Add New** ➔ **Project**.
3. Connect your GitHub repository — Vercel auto-detects `vercel.json` and sets up the `/api` serverless endpoints.

### Step 2: Configure Environment Variables

In your **Vercel Project Settings ➔ Environment Variables**, add:

#### Shopify
| Variable | Description |
|---|---|
| `SHOPIFY_SHOP_NAME` | Your store domain (e.g. `your-store.myshopify.com`) |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | Admin API Access Token (starts with `shpat_`) |

> *How to get it*: Shopify Admin → **Settings → Apps → Develop apps → Create app** → Configure Admin API scopes (`write_inventory`, `read_inventory`) → Install app → copy token.

#### eBay
| Variable | Description |
|---|---|
| `EBAY_CLIENT_ID` | Application ID (App ID) |
| `EBAY_CLIENT_SECRET` | Certification ID (Cert ID) |
| `EBAY_REFRESH_TOKEN` | User Refresh Token (long-lived) |

> *How to get it*: [eBay Developers Program](https://developer.ebay.com) → Register app under **Production** → use the OAuth token generator to log in with your seller account and generate the refresh token.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, Vanilla CSS3 (HSL gradients, glassmorphism, CSS custom properties, dark/light themes), Vanilla ES6 JavaScript |
| **Charts** | Native Canvas 2D API — zero external chart libraries |
| **Backend** | Node.js Serverless Functions (Vercel / Netlify compatible) |
| **State** | Local-first via `localStorage` — no database, $0 hosting |
| **Notifications** | Web Notifications API (native OS push) |
| **i18n** | Client-side EN/IT localization with auto browser-language detection |

---

## 🔒 Security & Privacy

* **No Centralized Database**: Your product mappings and configurations never leave your browser. All data is stored in your browser's private `localStorage`.
* **Protected Credentials**: API Secrets and Access Tokens are never exposed to the client-side. All API communication with Shopify and eBay is handled exclusively inside serverless endpoints on Vercel's isolated servers.
* **No Tracking**: StockSync Lite does not use analytics, cookies, or third-party SDKs of any kind.

---

## 📁 Project Structure

```
stocksync-lite/
├── index.html          # Main SPA shell
├── css/
│   └── style.css       # Full design system (variables, dark/light themes, components)
├── js/
│   ├── app.js          # Application logic, state management, all feature controllers
│   ├── api-client.js   # Dual-mode API client (Sandbox simulator / Live production)
│   └── translations.js # EN/IT localization dictionary
├── api/
│   ├── shopify.js      # Serverless endpoint: Shopify inventory read/write
│   └── ebay.js         # Serverless endpoint: eBay OAuth + inventory update
├── vercel.json         # Vercel deployment configuration
└── README.md
```

---

*Built with ❤️ and zero dependencies.*
