# StockSync Lite 🔄

StockSync Lite is a B2B multi-channel inventory synchronization tool designed specifically for small e-commerce merchants. It keeps your inventory stock levels perfectly synced in real-time between **Shopify** and **eBay**, using the **SKU (Stock Keeping Unit)** as the master matching key.

Its primary unique selling point is the **Buffer Stock (Safety Stock)** system, which dynamically deducts a safety margin from your eBay inventory. This ensures that even during peak shopping hours with high sales velocity, you will never double-sell and face penalization or account suspension from eBay.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔄 **Real-time Sync** | Instant Shopify → eBay inventory sync via SKU mapping |
| 🛡️ **Buffer Stock** | Configurable safety buffer to prevent overselling |
| 🌙 **Dark / Light Mode** | Smooth theme toggle, preference saved in localStorage |
| 🔔 **Browser Notifications** | Native OS push alerts on every sync event |
| 🌐 **EN / IT Localization** | Full bilingual UI, auto-detected from browser language |
| 🖥️ **Sandbox Simulator** | Live demo mode — no API keys needed |
| ☁️ **Serverless Ready** | One-click deploy on Vercel at $0/month |

---

## 🚀 Getting Started

### 1. Instant Local Preview (Sandbox Simulator)
Since this application features an **automated Dual-Mode Client**, you can test the entire interactive dashboard immediately on your local computer without installing Node.js, databases, or running server commands.

1.  Navigate to your local project folder: `NUOVO PROGETTO`.
2.  **Double-click the `index.html` file** to open it directly in any web browser.
3.  The dashboard will boot in **Sandbox Simulation Mode** (`isSimulationMode = true`):
    *   **Preset Demo Data**: It will pre-populate 3 typical products with active stock levels so you can see the interface populated immediately.
    *   **Interactive Sliders**: Drag the **Buffer Stock** slider. You will see the eBay target quantity column recalculate instantly in real-time.
    *   **Manual Trigger**: Click the **Sychronize (refresh)** icon on any row to simulate an instant inventory update. Watch the developer sync logs print success messages to the live console.
    *   **Background Sales Webhooks**: Every 25 seconds, the simulator will automatically simulate a random sale on Shopify (e.g. *"Shopify sold 2 hoodies"*). It will dynamically deduct the stock on the screen, flash a visual pulse on the system status light, and automatically trigger an eBay update reflecting the new stock minus the safety buffer stock.
    *   **🌙 Dark / Light Mode**: Click the toggle switch in the top navbar to switch between dark and light themes. The preference is saved across sessions.
    *   **🔔 Browser Notifications**: Click the bell icon in the navbar to enable native OS notifications. You will receive a push alert on your desktop every time a sync event is triggered, even if the browser tab is in the background.

---

## ☁️ Deployment Guide (Free Hosting on Vercel)

Deploying StockSync Lite to the cloud with real-time backend synchronization costs **$0.00/month** and takes less than a minute.

### Step 1: Push to GitHub or Upload to Vercel
1.  Create a free account on [Vercel](https://vercel.com).
2.  In the Vercel Dashboard, click **Add New** ➔ **Project**.
3.  You can connect a GitHub repository containing these files OR simply install the Vercel CLI locally and run `vercel` in your project folder.
4.  Vercel will automatically detect the configuration in `vercel.json` and set up the `/api` serverless Node.js endpoints.

### Step 2: Configure Environment Variables
To enable live connections to your real stores, add these environment variables in your **Vercel Project Settings ➔ Environment Variables** panel:

#### Shopify Configuration
*   `SHOPIFY_SHOP_NAME`: Your Shopify primary domain prefix (e.g. `your-store-name.myshopify.com`).
*   `SHOPIFY_ADMIN_ACCESS_TOKEN`: The Custom App Admin API Access Token (starts with `shpat_`).
    *   *How to get it*: In your Shopify Admin panel, go to **Settings ➔ App and sales channels ➔ Develop apps ➔ Create an app**. Under **API credentials**, click **Configure Admin API scopes**, grant `write_inventory` and `read_inventory` permissions, and install the app to reveal the token.

#### eBay Configuration
*   `EBAY_CLIENT_ID`: Your Application ID (App ID).
*   `EBAY_CLIENT_SECRET`: Your Certification ID (Cert ID).
*   `EBAY_REFRESH_TOKEN`: The User Refresh Token used to fetch fresh access tokens.
    *   *How to get it*: Create a free developer account at [eBay Developers Program](https://developer.ebay.com). Register an application under **Production**, retrieve your App ID and Cert ID, and use the ebay OAuth token generator page to log in to your real eBay seller account and generate the long-lived User Refresh Token.

---

## 🛠️ Tech Stack & Architecture

*   **Frontend**: HTML5, Vanilla CSS3 (Custom properties, dark/light theme HSL gradients, glassmorphism, responsive grid), Vanilla ES6 JavaScript (event-driven, local storage state persistence, Web Notifications API).
*   **Backend**: Node.js serverless functions (designed for Vercel/Netlify lambda environments).
*   **Database**: Local-first state management using the browser's `localStorage`, keeping hosting costs at absolute zero.
*   **Communication**: Event-driven webhook processing and secure OAuth token exchange.

---

## 🔒 Security & Privacy

StockSync Lite is built with security as a priority:
*   **No Centralized Database**: Your mapped products and configurations never leave your browser. They are stored securely in your browser's private `localStorage`.
*   **Protected Credentials**: API Secrets and Access Tokens are never loaded or exposed to the client-side frontend browser. All communications with Shopify and eBay are signed and authorized securely inside serverless endpoints on Vercel's isolated servers.

