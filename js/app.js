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
  lowStockThreshold: 5,
  syncHistory: [],   // [{hour, count}] for the chart
  logs: [],
  lang: 'en'         // Default language is English (global B2B standard)
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

  // Low Stock Alert Slider
  lowStockSlider: document.getElementById('lowStockSlider'),
  lowStockVal: document.getElementById('lowStockVal'),

  // SKU Search
  skuSearchInput: document.getElementById('skuSearchInput'),

  // CSV Import
  importCsvBtn: document.getElementById('importCsvBtn'),
  csvFileInput: document.getElementById('csvFileInput'),
  
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
  notificationIcon: document.getElementById('notificationIcon'),

  // Data & Backup
  exportConfigBtn: document.getElementById('exportConfigBtn'),
  importConfigBtn: document.getElementById('importConfigBtn'),
  jsonConfigInput: document.getElementById('jsonConfigInput')
};

// Initialize Application
function init() {
  loadDataFromStorage();
  setupEventListeners();
  applyLanguage(appState.lang);
  setupThemeToggle();           // Dark/Light Mode
  setupBrowserNotifications();  // Browser Push Notifications
  setupLowStockAlert();         // Low Stock Alert Slider
  setupSkuSearch();             // Live SKU Search
  setupCsvImport();             // CSV Import
  setupStatsPanel();            // Statistics Chart
  setupDataBackup();            // NEW: Export / Import JSON Config
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

  const savedLowStock = localStorage.getItem('stocksync_lowstock');
  if (savedLowStock) {
    appState.lowStockThreshold = parseInt(savedLowStock, 10);
    elements.lowStockSlider.value = appState.lowStockThreshold;
    elements.lowStockVal.textContent = appState.lowStockThreshold;
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

  // Translate placeholder attributes (data-i18n-placeholder)
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
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

// Re-render SKU Table (respects current search filter)
function renderMappingsTable() {
  const query = (elements.skuSearchInput ? elements.skuSearchInput.value.trim().toUpperCase() : '');
  const filtered = query
    ? appState.mappings.filter(m => m.sku.includes(query))
    : appState.mappings;

  elements.skuTableBody.innerHTML = '';
  
  if (filtered.length === 0) {
    elements.tableEmptyState.style.display = 'block';
    return;
  }
  
  elements.tableEmptyState.style.display = 'none';
  
  filtered.forEach((mapping, index) => {
    // Find real index in the full appState.mappings array for actions
    const realIndex = appState.mappings.indexOf(mapping);
    const row = document.createElement('tr');
    
    // Calculate eBay Qty applying safety buffer stock
    const ebayQty = Math.max(0, mapping.shopifyQty - appState.bufferValue);
    
    // Low stock badge
    const isLowStock = mapping.shopifyQty <= appState.lowStockThreshold;
    const lowStockBadge = isLowStock
      ? `<span class="badge-low-stock">
           <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
             <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
             <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
           </svg>
           LOW
         </span>`
      : '';
    
    row.innerHTML = `
      <td>
        <div style="font-weight: 700;">${mapping.sku}${lowStockBadge}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">
          Shpf: ${mapping.shopifyId.substring(0, 20)}... | eBay: ${mapping.ebayId}
        </div>
      </td>
      <td>
        <div class="stock-value" style="${isLowStock ? 'color: var(--warning);' : ''}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${isLowStock ? 'var(--warning)' : '#96bf48'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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
        <button class="action-btn-sm sync-btn" data-sku="${mapping.sku}" data-index="${realIndex}" title="Sincronizza ora">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
        </button>
        <button class="action-btn-sm delete-btn" data-sku="${mapping.sku}" data-index="${realIndex}" title="Elimina mappatura" style="color: var(--danger);">
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

  // Check for low stock alert
  if (product.shopifyQty <= appState.lowStockThreshold) {
    setTimeout(() => {
      const alertMsg = `⚠️ LOW STOCK: ${product.sku} — solo ${product.shopifyQty} unità rimaste su Shopify!`;
      addLog(alertMsg, 'warning');
      sendBrowserNotification('⚠️ StockSync Lite — Scorta Bassa', `${product.sku}: ${product.shopifyQty} unità rimaste`);
    }, 1500);
  }

  // Update stats chart
  updateStats();
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
  // Redraw chart with updated CSS color variables
  setTimeout(drawChart, 50);
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

// =============================================
// FEATURE: Low Stock Alert Slider
// =============================================

/**
 * Wires up the Low Stock Alert slider.
 * Updates appState.lowStockThreshold and persists to localStorage.
 * Re-renders the table immediately so badges appear/disappear in real time.
 */
function setupLowStockAlert() {
  elements.lowStockSlider.addEventListener('input', (e) => {
    appState.lowStockThreshold = parseInt(e.target.value, 10);
    elements.lowStockVal.textContent = appState.lowStockThreshold;
    localStorage.setItem('stocksync_lowstock', appState.lowStockThreshold.toString());
    renderMappingsTable();
    updateStats();
    addLog(`Low-stock alert threshold updated to ${appState.lowStockThreshold} units.`, 'info');
  });
}

// =============================================
// FEATURE: Live SKU Search
// =============================================

/**
 * Wires up the SKU search input field.
 * Filters the table in real time as the user types.
 */
function setupSkuSearch() {
  elements.skuSearchInput.addEventListener('input', () => {
    renderMappingsTable();
  });
}

// =============================================
// FEATURE: CSV Import
// =============================================

/**
 * Wires up the Import CSV button and hidden file input.
 * Expected CSV format (with header row):
 *   sku,shopifyId,ebayId
 *   MY-SKU-001,gid://shopify/ProductVariant/12345,987654321
 */
function setupCsvImport() {
  elements.importCsvBtn.addEventListener('click', () => {
    elements.csvFileInput.click();
  });

  elements.csvFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = parseCsv(ev.target.result);
      if (result.errors.length > 0) {
        showNotification(`CSV Error: ${result.errors[0]}`, 'error');
        addLog(`[ERROR] CSV import failed: ${result.errors[0]}`, 'error');
        return;
      }
      let imported = 0;
      let skipped = 0;
      result.rows.forEach(row => {
        if (appState.mappings.some(m => m.sku === row.sku)) {
          skipped++;
          return;
        }
        appState.mappings.push({
          sku: row.sku,
          shopifyId: row.shopifyId,
          ebayId: row.ebayId,
          shopifyQty: Math.floor(Math.random() * 20) + 5,
          lastSync: '-'
        });
        imported++;
      });
      saveState();
      renderMappingsTable();
      updateStats();
      const msg = `CSV imported: ${imported} added, ${skipped} skipped (duplicate SKU).`;
      addLog(`[INFO] ${msg}`, 'info');
      showNotification(`${imported} mapping${imported !== 1 ? 's' : ''} importati!`, 'success');
    };
    reader.readAsText(file);
    // Reset so the same file can be re-imported if needed
    e.target.value = '';
  });
}

/**
 * Parses a CSV string.
 * Supports comma and semicolon delimiters.
 * Expected columns (case-insensitive): sku, shopifyid, ebayid
 * @param {string} text - Raw CSV file content
 * @returns {{ rows: Array, errors: string[] }}
 */
function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) {
    return { rows: [], errors: ['File CSV vuoto o senza righe dati.'] };
  }

  // Auto-detect delimiter
  const delimiter = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/\s/g, ''));

  const skuIdx      = headers.indexOf('sku');
  const shopifyIdx  = headers.findIndex(h => h === 'shopifyid' || h === 'shopify_id' || h === 'shopifyproductid');
  const ebayIdx     = headers.findIndex(h => h === 'ebayid' || h === 'ebay_id' || h === 'ebayitemid');

  if (skuIdx === -1 || shopifyIdx === -1 || ebayIdx === -1) {
    return { rows: [], errors: ['Colonne richieste: sku, shopifyId, ebayId. Controlla l\'intestazione del CSV.'] };
  }

  const rows = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
    const sku      = (cols[skuIdx]     || '').toUpperCase();
    const shopifyId = cols[shopifyIdx] || '';
    const ebayId    = cols[ebayIdx]    || '';

    if (!sku || !shopifyId || !ebayId) {
      errors.push(`Riga ${i + 1} ignorata: dati mancanti.`);
      continue;
    }
    rows.push({ sku, shopifyId, ebayId });
  }

  return { rows, errors };
}

// =============================================
// FEATURE: Statistics Panel (Canvas Chart)
// =============================================

/**
 * Initializes the stats panel.
 * Seeds syncHistory with simulated data for the last 12 hours
 * so the chart is never empty on first load.
 */
function setupStatsPanel() {
  // Seed with 12h of simulated history for a better initial visual
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const h = new Date(now);
    h.setHours(now.getHours() - i, 0, 0, 0);
    appState.syncHistory.push({
      label: h.getHours() + ':00',
      count: Math.floor(Math.random() * 8)
    });
  }
  updateStats();

  // Redraw chart on window resize for responsiveness
  window.addEventListener('resize', () => drawChart());
}

/**
 * Updates the 3 KPI counters and redraws the chart.
 * Increments the current-hour bucket on every call.
 */
function updateStats() {
  // Increment current hour bucket
  const currentHourLabel = new Date().getHours() + ':00';
  const bucket = appState.syncHistory.find(b => b.label === currentHourLabel);
  if (bucket) {
    bucket.count++;
  } else {
    appState.syncHistory.push({ label: currentHourLabel, count: 1 });
    // Keep only the last 24h
    if (appState.syncHistory.length > 24) {
      appState.syncHistory.shift();
    }
  }

  // KPI: total syncs in history
  const totalSyncs = appState.syncHistory.reduce((s, b) => s + b.count, 0);
  document.getElementById('kpiTotalSyncs').textContent = totalSyncs;

  // KPI: products below low-stock threshold
  const lowStockCount = appState.mappings.filter(m => m.shopifyQty <= appState.lowStockThreshold).length;
  document.getElementById('kpiLowStock').textContent = lowStockCount;

  // KPI: average Shopify stock across all products
  const avg = appState.mappings.length > 0
    ? Math.round(appState.mappings.reduce((s, m) => s + m.shopifyQty, 0) / appState.mappings.length)
    : 0;
  document.getElementById('kpiAvgStock').textContent = avg;

  drawChart();
}

/**
 * Draws the bar chart on the <canvas id="syncChart"> element.
 * Uses only native Canvas 2D API — zero external dependencies.
 */
function drawChart() {
  const canvas = document.getElementById('syncChart');
  if (!canvas) return;

  // Resolve CSS variable values for theming
  const style = getComputedStyle(document.documentElement);
  const accentCyan   = style.getPropertyValue('--accent-cyan').trim()   || '#00d4ff';
  const accentPurple = style.getPropertyValue('--accent-purple').trim() || '#7b1ffa';
  const textMuted    = style.getPropertyValue('--text-muted').trim()    || '#606880';
  const borderColor  = style.getPropertyValue('--border-color').trim()  || 'rgba(100,110,140,0.4)';

  // Match canvas pixel dimensions to CSS layout dimensions
  const rect = canvas.getBoundingClientRect();
  canvas.width  = rect.width  * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  const ctx = canvas.getContext('2d');
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  const W = rect.width;
  const H = rect.height;
  const data = appState.syncHistory;
  const maxVal = Math.max(...data.map(d => d.count), 1);

  const padLeft = 28, padRight = 8, padTop = 8, padBottom = 22;
  const chartW = W - padLeft - padRight;
  const chartH = H - padTop - padBottom;
  const barCount = data.length;
  const gap = 3;
  const barW = (chartW - gap * (barCount - 1)) / barCount;

  ctx.clearRect(0, 0, W, H);

  // Draw Y axis guidelines (3 horizontal lines)
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 0.5;
  for (let i = 1; i <= 3; i++) {
    const y = padTop + chartH - (chartH * (i / 3));
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(W - padRight, y);
    ctx.stroke();
  }

  // Draw bars with gradient
  data.forEach((d, i) => {
    const barH   = (d.count / maxVal) * chartH;
    const x      = padLeft + i * (barW + gap);
    const y      = padTop + chartH - barH;

    // Gradient: cyan at top → purple at bottom
    const grad = ctx.createLinearGradient(x, y, x, y + barH);
    grad.addColorStop(0, accentCyan);
    grad.addColorStop(1, accentPurple);

    ctx.fillStyle = grad;
    ctx.beginPath();
    // Rounded top corners on bars
    const r = Math.min(3, barW / 2, barH);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + barW - r, y);
    ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
    ctx.lineTo(x + barW, y + barH);
    ctx.lineTo(x, y + barH);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();

    // X axis label (every 3 bars to avoid crowding)
    if (i % 3 === 0) {
      ctx.fillStyle = textMuted;
      ctx.font = `${10 * (window.devicePixelRatio > 1 ? 0.85 : 1)}px Plus Jakarta Sans, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(d.label, x + barW / 2, H - 4);
    }
  });
}

// =============================================
// FEATURE: Data & Backup (Export / Import JSON)
// =============================================

/** localStorage keys managed by StockSync Lite — all included in backup */
const BACKUP_KEYS = [
  'stocksync_mappings',
  'stocksync_creds',
  'stocksync_buffer',
  'stocksync_lowstock',
  'stocksync_lang'
];

/**
 * Wires up the Export Config and Import Config buttons.
 */
function setupDataBackup() {
  elements.exportConfigBtn.addEventListener('click', exportConfig);
  elements.importConfigBtn.addEventListener('click', () => elements.jsonConfigInput.click());
  elements.jsonConfigInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    importConfig(file);
    e.target.value = '';
  });
}

/**
 * Exports all StockSync Lite localStorage data as a .json backup file.
 * Downloaded directly by the browser — no server required.
 */
function exportConfig() {
  const backup = {
    _version: '1.0',
    _app: 'StockSync Lite',
    _exported_at: new Date().toISOString(),
    data: {}
  };

  BACKUP_KEYS.forEach(key => {
    const value = localStorage.getItem(key);
    if (value !== null) {
      try { backup.data[key] = JSON.parse(value); }
      catch { backup.data[key] = value; }
    }
  });

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `stocksync-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  addLog(`[BACKUP] Configuration exported: stocksync-backup-${date}.json`, 'success');
  showNotification(t('backup_export_success'), 'success');
}

/**
 * Imports a StockSync Lite backup JSON file and restores all settings.
 * Validates structure before writing anything to localStorage.
 * @param {File} file
 */
function importConfig(file) {
  const reader = new FileReader();
  reader.onload = (ev) => {
    let backup;
    try { backup = JSON.parse(ev.target.result); }
    catch {
      showNotification(t('backup_import_error'), 'error');
      addLog('[BACKUP ERROR] Could not parse JSON file.', 'error');
      return;
    }

    if (!backup._app || backup._app !== 'StockSync Lite' || !backup.data) {
      showNotification(t('backup_import_error'), 'error');
      addLog('[BACKUP ERROR] Invalid StockSync Lite backup structure.', 'error');
      return;
    }

    Object.entries(backup.data).forEach(([key, value]) => {
      if (BACKUP_KEYS.includes(key)) {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      }
    });

    addLog(`[BACKUP] Configuration restored (exported on ${backup._exported_at || 'unknown'}).`, 'success');
    showNotification(t('backup_import_success'), 'success');

    setTimeout(() => {
      loadDataFromStorage();
      applyLanguage(appState.lang);
      renderDashboard();
      updateStats();
    }, 800);
  };
  reader.readAsText(file);
}
