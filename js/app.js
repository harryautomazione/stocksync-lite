/**
 * StockSync Lite - Core Dashboard Application Logic
 * Author: Antigravity AI
 * 
 * DESCRIPTION:
 * Manages UI interactions, modals, dynamic table rendering, state preservation,
 * dynamic real-time translations (EN/IT), and triggers simulated background 
 * sales events to visually demonstrate the synchronization process.
 */

// Application State
let appState = {
  credentials: null,
  mappings: [],
  bufferValue: 2,
  logs: [],
  lang: 'en' // Default language is English (global B2B standard)
};

// DOM Elements
const elements = {
  // Language Buttons
  btnLangEn: document.getElementById('btnLangEn'),
  btnLangIt: document.getElementById('btnLangIt'),

  // Theme Toggle
  themeToggleBtn: document.getElementById('themeToggleBtn'),

  // Notification Bell
  notifBellBtn: document.getElementById('notifBellBtn'),

  // Connection Badges
  shopifyBadge: document.getElementById('shopifyBadge'),
  ebayBadge: document.getElementById('ebayBadge'),
  sysStatusDot: document.getElementById('sysStatusDot'),
  sysStatusText: document.getElementById('sysStatusText'),
  
  // Settings Button
  openSettingsBtn: document.getElementById('openSettingsBtn'),
  settingsModal: document.getElementById('settingsModal'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),
  apiSettingsForm: document.getElementById('apiSettingsForm'),
  
  // Credentials Fields
  shopName: document.getElementById('shopName'),
  shopifyToken: document.getElementById('shopifyToken'),
  ebayClientId: document.getElementById('ebayClientId'),
  ebayClientSecret: document.getElementById('ebayClientSecret'),
  ebayRefreshToken: document.getElementById('ebayRefreshToken'),
  
  // Buffer Slider
  bufferSlider: document.getElementById('bufferSlider'),
  bufferVal: document.getElementById('bufferVal'),
  
  // Mappings List & Modal
  openAddMappingBtn: document.getElementById('openAddMappingBtn'),
  addMappingModal: document.getElementById('addMappingModal'),
  closeAddMappingBtn: document.getElementById('closeAddMappingBtn'),
  addMappingForm: document.getElementById('addMappingForm'),
  skuTableBody: document.getElementById('skuTableBody'),
  tableEmptyState: document.getElementById('tableEmptyState'),
  
  // Logs Console
  logsContainer: document.getElementById('logsContainer'),
  clearLogsBtn: document.getElementById('clearLogsBtn'),
  
  // Banner Notification
  notificationBanner: document.getElementById('notificationBanner'),
  notificationMessage: document.getElementById('notificationMessage'),
  notificationIcon: document.getElementById('notificationIcon')
};

// Initialize Application
function init() {
  loadDataFromStorage();
  setupEventListeners();
  applyLanguage(appState.lang);
  setupThemeToggle();         // NEW: Dark/Light Mode
  setupBrowserNotifications(); // NEW: Browser Push Notifications
  renderDashboard();
  
  const initLogKey = ApiClient.isSimulationMode ? 'log_init_sandbox' : 'log_init_production';
  addLog(t(initLogKey), "info");
  
  // Automatically trigger a simulated sale webhook event every 25 seconds if products exist
  setInterval(simulateBackgroundActivity, 25000);
}

// Load configurations and language from browser localStorage
function loadDataFromStorage() {
  const savedCreds = localStorage.getItem('stocksync_creds');
  if (savedCreds) {
    appState.credentials = JSON.parse(savedCreds);
  }
  
  const savedMappings = localStorage.getItem('stocksync_mappings');
  if (savedMappings) {
    appState.mappings = JSON.parse(savedMappings);
  } else {
    // Inject default initial mappings for immediate visual demonstration
    appState.mappings = [
      { sku: "TSHIRT-SLATE-M", shopifyId: "gid://shopify/ProductVariant/8402849", ebayId: "128491048590", shopifyQty: 18, lastSync: "-" },
      { sku: "HOODIE-NEON-XL", shopifyId: "gid://shopify/ProductVariant/5719304", ebayId: "248104850128", shopifyQty: 5, lastSync: "-" },
      { sku: "CAP-CYAN-OS", shopifyId: "gid://shopify/ProductVariant/2947194", ebayId: "329581048591", shopifyQty: 32, lastSync: "-" }
    ];
    localStorage.setItem('stocksync_mappings', JSON.stringify(appState.mappings));
  }
  
  const savedBuffer = localStorage.getItem('stocksync_buffer');
  if (savedBuffer) {
    appState.bufferValue = parseInt(savedBuffer, 10);
    elements.bufferSlider.value = appState.bufferValue;
    elements.bufferVal.textContent = appState.bufferValue;
  }

  const savedLang = localStorage.getItem('stocksync_lang');
  if (savedLang) {
    appState.lang = savedLang;
  } else {
    // Auto-detect browser language if it is Italian
    const userLang = navigator.language || navigator.userLanguage;
    if (userLang.startsWith('it')) {
      appState.lang = 'it';
    }
  }
}

// Save current state back to browser localStorage
function saveState() {
  localStorage.setItem('stocksync_mappings', JSON.stringify(appState.mappings));
  localStorage.setItem('stocksync_buffer', appState.bufferValue.toString());
}

// Translate utility helper
function t(key, replacements = {}) {
  const dictionary = translations[appState.lang] || translations['en'];
  let text = dictionary[key] || translations['en'][key] || key;
  
  // Replace tokens in string (e.g. {sku} with SKU-123)
  Object.keys(replacements).forEach(token => {
    text = text.replace(`{${token}}`, replacements[token]);
  });
  
  return text;
}

// Apply Selected Language translation to the static elements in the DOM
function applyLanguage(lang) {
  appState.lang = lang;
  localStorage.setItem('stocksync_lang', lang);

  // Update Toggle active button visuals
  if (lang === 'en') {
    elements.btnLangEn.style.color = 'var(--accent-cyan)';
    elements.btnLangEn.style.background = 'var(--bg-tertiary)';
    elements.btnLangIt.style.color = 'var(--text-muted)';
    elements.btnLangIt.style.background = 'none';
  } else {
    elements.btnLangIt.style.color = 'var(--accent-cyan)';
    elements.btnLangIt.style.background = 'var(--bg-tertiary)';
    elements.btnLangEn.style.color = 'var(--text-muted)';
    elements.btnLangEn.style.background = 'none';
  }

  // Iterate and translate all elements with data-i18n attributes
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  // Dynamic values update
  renderConnectionBadges();
}

// Setup Dashboard Interactions
function setupEventListeners() {
  // Language Switch Click Handles
  elements.btnLangEn.addEventListener('click', () => {
    applyLanguage('en');
    renderDashboard();
    addLog("Dashboard language changed to English.", "info");
  });
  
  elements.btnLangIt.addEventListener('click', () => {
    applyLanguage('it');
    renderDashboard();
    addLog("Lingua del pannello modificata in Italiano.", "info");
  });

  // Modals Open / Close
  elements.openSettingsBtn.addEventListener('click', () => openModal(elements.settingsModal));
  elements.closeSettingsBtn.addEventListener('click', () => closeModal(elements.settingsModal));
  
  elements.openAddMappingBtn.addEventListener('click', () => openModal(elements.addMappingModal));
  elements.closeAddMappingBtn.addEventListener('click', () => closeModal(elements.addMappingModal));
  
  // Credentials Form Submit
  elements.apiSettingsForm.addEventListener('submit', handleCredentialsSubmit);
  
  // Mappings Form Submit
  elements.addMappingForm.addEventListener('submit', handleAddMappingSubmit);
  
  // Buffer Slider Live Dragging
  elements.bufferSlider.addEventListener('input', handleBufferChange);
  
  // Clear Logs
  elements.clearLogsBtn.addEventListener('click', () => {
    elements.logsContainer.innerHTML = '';
    appState.logs = [];
    addLog(t('log_clear_console'), "info");
  });
  
  // Close modals when clicking on background overlay
  window.addEventListener('click', (e) => {
    if (e.target === elements.settingsModal) closeModal(elements.settingsModal);
    if (e.target === elements.addMappingModal) closeModal(elements.addMappingModal);
  });
}

// Render all aspects of the dynamic dashboard
function renderDashboard() {
  renderConnectionBadges();
  renderMappingsTable();
}

// Update connection tags
function renderConnectionBadges() {
  if (appState.credentials) {
    elements.shopifyBadge.textContent = t('shopify_connected');
    elements.shopifyBadge.className = "badge badge-connected";
    elements.ebayBadge.textContent = t('ebay_connected');
    elements.ebayBadge.className = "badge badge-connected";
    elements.sysStatusDot.className = "status-dot active";
    elements.sysStatusText.textContent = t('system_status_listening');
  } else {
    elements.shopifyBadge.textContent = t('shopify_disconnected');
    elements.shopifyBadge.className = "badge badge-disconnected";
    elements.ebayBadge.textContent = t('ebay_disconnected');
    elements.ebayBadge.className = "badge badge-disconnected";
    elements.sysStatusDot.className = "status-dot";
    elements.sysStatusText.textContent = t('system_status_waiting');
  }
}

// Re-render SKU Table
function renderMappingsTable() {
  elements.skuTableBody.innerHTML = '';
  
  if (appState.mappings.length === 0) {
    elements.tableEmptyState.style.display = 'block';
    return;
  }
  
  elements.tableEmptyState.style.display = 'none';
  
  appState.mappings.forEach((mapping, index) => {
    const row = document.createElement('tr');
    
    // Calculate eBay Qty applying safety buffer stock
    const ebayQty = Math.max(0, mapping.shopifyQty - appState.bufferValue);
    
    row.innerHTML = `
      <td>
        <div style="font-weight: 700;">${mapping.sku}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">
          Shpf: ${mapping.shopifyId.substring(0, 20)}... | eBay: ${mapping.ebayId}
        </div>
      </td>
      <td>
        <div class="stock-value">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#96bf48" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" height="20" width="20" y="2" rx="5" ry="5"/>
          </svg>
          ${mapping.shopifyQty}
        </div>
      </td>
      <td>
        <div style="color: var(--text-muted); font-weight: 600;">-${appState.bufferValue}</div>
      </td>
      <td>
        <div class="stock-value" style="color: var(--accent-cyan);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
          </svg>
          <span id="ebayQty-${mapping.sku}">${ebayQty}</span>
        </div>
      </td>
      <td id="syncTime-${mapping.sku}" style="color: var(--text-secondary); font-size: 0.85rem;">
        ${mapping.lastSync}
      </td>
      <td class="actions-cell">
        <button class="action-btn-sm sync-btn" data-sku="${mapping.sku}" data-index="${index}" title="Sincronizza ora">
          <!-- Refresh icon -->
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
        </button>
        <button class="action-btn-sm delete-btn" data-sku="${mapping.sku}" data-index="${index}" title="Elimina mappatura" style="color: var(--danger);">
          <!-- Trash icon -->
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </td>
    `;
    
    elements.skuTableBody.appendChild(row);
  });
  
  // Attach Event Listeners to actions buttons
  document.querySelectorAll('.sku-table .sync-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const btnEl = e.currentTarget;
      const sku = btnEl.getAttribute('data-sku');
      const idx = parseInt(btnEl.getAttribute('data-index'), 10);
      handleManualSync(sku, idx, btnEl);
    });
  });

  document.querySelectorAll('.sku-table .delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
      const sku = e.currentTarget.getAttribute('data-sku');
      handleDeleteMapping(sku, idx);
    });
  });
}

// Credentials Submit Management
async function handleCredentialsSubmit(e) {
  e.preventDefault();
  
  const shopify = {
    shopName: elements.shopName.value.trim(),
    token: elements.shopifyToken.value.trim()
  };
  const ebay = {
    clientId: elements.ebayClientId.value.trim(),
    clientSecret: elements.ebayClientSecret.value.trim(),
    refreshToken: elements.ebayRefreshToken.value.trim()
  };
  
  addLog(t('log_creds_validating'), "info");
  
  const result = await ApiClient.saveCredentials(shopify, ebay);
  
  if (result.success) {
    appState.credentials = { shopify, ebay };
    localStorage.setItem('stocksync_creds', JSON.stringify(appState.credentials));
    
    renderConnectionBadges();
    closeModal(elements.settingsModal);
    showNotification(t('notif_creds_saved'), "success");
    addLog("[SUCCESS] " + t('log_creds_success'), "success");
  } else {
    showNotification(t('notif_creds_failed'), "error");
    addLog("[ERROR] " + t('log_creds_failed'), "error");
  }
}

// Add Mapping Submit Management
function handleAddMappingSubmit(e) {
  e.preventDefault();
  
  const sku = elements.mappingSku.value.trim().toUpperCase();
  const shopifyId = elements.shopifyProductId.value.trim();
  const ebayId = elements.ebayItemId.value.trim();
  
  // Validate duplicate SKU
  if (appState.mappings.some(m => m.sku === sku)) {
    showNotification(t('notif_sku_exists'), "error");
    return;
  }
  
  // Create mapping with initial random stock level
  const initialStock = Math.floor(Math.random() * 25) + 6; 
  
  const newMapping = {
    sku,
    shopifyId,
    ebayId,
    shopifyQty: initialStock,
    lastSync: "-"
  };
  
  appState.mappings.push(newMapping);
  saveState();
  renderMappingsTable();
  closeModal(elements.addMappingModal);
  
  elements.addMappingForm.reset();
  showNotification(t('notif_mapping_created'), "success");
  addLog(t('log_mapping_inserted', { sku: sku, stock: initialStock }), "info");
}

// Delete product mapping
function handleDeleteMapping(sku, index) {
  if (confirm(t('confirm_delete') + sku + "?")) {
    appState.mappings.splice(index, 1);
    saveState();
    renderMappingsTable();
    showNotification(t('notif_mapping_removed'), "success");
    addLog(t('log_mapping_deleted', { sku: sku }), "warning");
  }
}

// Manual Sychronization click trigger
async function handleManualSync(sku, index, buttonElement) {
  buttonElement.style.pointerEvents = 'none';
  buttonElement.style.opacity = '0.5';
  addLog(t('log_manual_sync', { sku: sku }), "info");
  
  const product = appState.mappings[index];
  const response = await ApiClient.syncInventory(sku, product.shopifyQty, appState.bufferValue);
  
  if (response.success) {
    product.lastSync = response.timestamp;
    saveState();
    
    // Update visual cells
    document.getElementById(`ebayQty-${sku}`).textContent = response.calculatedEbayQty;
    document.getElementById(`syncTime-${sku}`).textContent = response.timestamp;
    
    addLog("[SUCCESS] " + t('log_sync_success', { 
      sku: sku, 
      ebayQty: response.calculatedEbayQty, 
      shpfQty: product.shopifyQty, 
      buffer: appState.bufferValue 
    }), "success");
    showNotification(t('notif_sync_success'), "success");
  } else {
    addLog("[ERROR] " + t('log_sync_failed', { sku: sku }), "error");
    showNotification(t('notif_sync_failed'), "error");
  }
  
  buttonElement.style.pointerEvents = 'auto';
  buttonElement.style.opacity = '1';
}

// Buffer Stock Dynamic Slider management
function handleBufferChange(e) {
  appState.bufferValue = parseInt(e.target.value, 10);
  elements.bufferVal.textContent = appState.bufferValue;
  saveState();
  
  // Instantly recalculate and update all eBay stock values in the DOM
  appState.mappings.forEach(mapping => {
    const calculatedEbayQty = Math.max(0, mapping.shopifyQty - appState.bufferValue);
    const cell = document.getElementById(`ebayQty-${mapping.sku}`);
    if (cell) {
      cell.textContent = calculatedEbayQty;
    }
  });
  
  addLog(t('log_buffer_updated', { buffer: appState.bufferValue }), "info");
}

// Visual simulation of background sale webhooks
function simulateBackgroundActivity() {
  if (appState.mappings.length === 0) return;
  
  // Pick a random product SKU to sell
  const randomIdx = Math.floor(Math.random() * appState.mappings.length);
  const product = appState.mappings[randomIdx];
  
  // Prevent simulating sales if stock is already zero
  if (product.shopifyQty <= 1) return;
  
  // Trigger simulation call
  const event = ApiClient.simulateSaleWebhook(product.sku, product.shopifyQty);
  
  // Visual pulse alert on status indicator
  elements.sysStatusDot.style.boxShadow = "0 0 20px var(--accent-purple)";
  setTimeout(() => {
    elements.sysStatusDot.style.boxShadow = "0 0 10px var(--success)";
  }, 1000);
  
  addLog(t('log_webhook_received', { 
    sku: product.sku, 
    sold: event.itemsSold, 
    old: event.oldQty, 
    new: event.newShopifyQty 
  }), "info");
  
  // Apply update to state
  product.shopifyQty = event.newShopifyQty;
  product.lastSync = event.timestamp;
  saveState();
  
  // Dynamic update rendering of the SKU row in the interface
  renderMappingsTable();
  
  // Trigger automatic downstream update to eBay applying the buffer stock
  const ebayQty = Math.max(0, product.shopifyQty - appState.bufferValue);
  setTimeout(() => {
    addLog(t('log_webhook_sync', { 
      sku: product.sku, 
      ebayQty: ebayQty, 
      buffer: appState.bufferValue 
    }), "success");
    showNotification(t('notif_sync_success'), "success");
  }, 1200);
}

// Modal View Utilities
function openModal(modal) {
  modal.classList.add('show');
}

function closeModal(modal) {
  modal.classList.remove('show');
}

// Visual Console Log Helper
function addLog(message, type = "info") {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry log-${type}`;
  logEntry.innerHTML = `<span class="log-timestamp">[${timestamp}]</span> ${message}`;
  
  elements.logsContainer.appendChild(logEntry);
  elements.logsContainer.scrollTop = elements.logsContainer.scrollHeight;
  
  // Keep logs in memory capped
  appState.logs.push({ timestamp, message, type });
  if (appState.logs.length > 50) {
    appState.logs.shift();
  }
}

// Popup notification helper
function showNotification(message, type = "success") {
  elements.notificationMessage.textContent = message;
  
  if (type === "success") {
    elements.notificationBanner.className = "notification notification-success show";
    elements.notificationIcon.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2.5">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    `;
  } else {
    elements.notificationBanner.className = "notification notification-error show";
    elements.notificationIcon.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2.5">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    `;
  }
  
  // Send native browser notification for sync events
  if (type === "success") {
    sendBrowserNotification('✅ StockSync Lite — Sync Complete', message);
    ringBell();
  } else if (type === "error") {
    sendBrowserNotification('⚠️ StockSync Lite — Sync Error', message);
    ringBell();
  }
  
  setTimeout(() => {
    elements.notificationBanner.classList.remove('show');
  }, 3500);
}

// Auto-run on DOM content loaded
document.addEventListener('DOMContentLoaded', init);

// =============================================
// FEATURE: Dark / Light Theme Toggle
// =============================================

/**
 * Initializes the dark/light mode toggle.
 * Reads saved preference from localStorage and applies it immediately.
 * Persists user preference on every click.
 */
function setupThemeToggle() {
  const savedTheme = localStorage.getItem('stocksync_theme') || 'dark';
  applyTheme(savedTheme);

  elements.themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    localStorage.setItem('stocksync_theme', newTheme);
    addLog(`Theme switched to ${newTheme} mode.`, 'info');
  });
}

/**
 * Applies a theme ('dark' or 'light') to the root html element.
 * All CSS custom properties defined under [data-theme="light"] are automatically applied.
 */
function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    elements.themeToggleBtn.title = 'Switch to dark mode';
  } else {
    document.documentElement.removeAttribute('data-theme');
    elements.themeToggleBtn.title = 'Switch to light mode';
  }
}

// =============================================
// FEATURE: Browser Push Notifications
// =============================================

/**
 * Initializes the browser notification bell button.
 * Updates button visual state based on current Notification.permission.
 * Requests permission on click if not already granted or denied.
 */
function setupBrowserNotifications() {
  // Notifications API not supported (e.g. file:// protocol or old browser)
  if (!('Notification' in window)) {
    elements.notifBellBtn.style.display = 'none';
    return;
  }

  updateBellState(Notification.permission);

  elements.notifBellBtn.addEventListener('click', async () => {
    if (Notification.permission === 'denied') {
      addLog('[WARN] Browser notifications are blocked. Please allow them in browser settings.', 'warning');
      return;
    }

    if (Notification.permission === 'granted') {
      // Show a test notification
      sendBrowserNotification('🔔 StockSync Lite', 'Browser notifications are active!');
      // Animate bell
      ringBell();
      return;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    updateBellState(permission);

    if (permission === 'granted') {
      addLog('[INFO] Browser notifications enabled.', 'success');
      sendBrowserNotification('🔔 StockSync Lite', 'Notifications enabled! You will be alerted on every sync.');
    } else {
      addLog('[WARN] Browser notification permission denied.', 'warning');
    }
  });
}

/**
 * Updates the visual state of the bell button based on permission level.
 * @param {'default'|'granted'|'denied'} permission - The current Notification.permission value.
 */
function updateBellState(permission) {
  const btn = elements.notifBellBtn;
  btn.classList.remove('notif-granted', 'notif-denied');

  if (permission === 'granted') {
    btn.classList.add('notif-granted');
    btn.title = 'Notifications active — click to test';
  } else if (permission === 'denied') {
    btn.classList.add('notif-denied');
    btn.title = 'Notifications blocked in browser settings';
  } else {
    btn.title = 'Click to enable browser notifications';
  }
}

/**
 * Sends a native browser notification if permission is granted.
 * @param {string} title - Notification title
 * @param {string} body  - Notification body text
 */
function sendBrowserNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      icon: 'https://stocksync-lite.vercel.app/favicon.ico',
      badge: 'https://stocksync-lite.vercel.app/favicon.ico',
      tag: 'stocksync-sync',   // replaces previous notification instead of stacking
      silent: false
    });
  } catch (e) {
    // Silently fail if notifications are blocked at OS level
  }
}

/**
 * Triggers the CSS bell-ring animation on the bell icon.
 */
function ringBell() {
  const bellIcon = document.getElementById('bellIcon');
  bellIcon.classList.remove('bell-ring');
  // Force reflow to restart animation
  void bellIcon.offsetWidth;
  bellIcon.classList.add('bell-ring');
  setTimeout(() => bellIcon.classList.remove('bell-ring'), 800);
}
