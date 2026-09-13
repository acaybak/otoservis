const { contextBridge, ipcRenderer, webFrame } = require('electron');

// Restore the user's preferred zoom before the UI renders (avoids a flash at 100%).
// localStorage may be unavailable in sandboxed preload contexts; React restores it on mount as well.
try {
  const savedZoom = parseFloat(localStorage.getItem('otoservis:zoomFactor') || '');
  if (savedZoom >= 0.5 && savedZoom <= 2) webFrame.setZoomFactor(savedZoom);
} catch (_) { /* not available in this context */ }


// Secure bridge: renderer can only call these whitelisted operations.
contextBridge.exposeInMainWorld('otoservis', {
  // App info
  info: () => ipcRenderer.invoke('app:info'),

  // Server configuration
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (cfg) => ipcRenderer.invoke('config:set', cfg),

  // Auth
  login: (email, password) => ipcRenderer.invoke('auth:login', email, password),
  logout: () => ipcRenderer.invoke('auth:logout'),
  currentUser: () => ipcRenderer.invoke('auth:current'),

  // Local offline-first store
  list: (entity, opts) => ipcRenderer.invoke('store:list', entity, opts),
  get: (entity, id) => ipcRenderer.invoke('store:get', entity, id),
  create: (entity, data) => ipcRenderer.invoke('store:create', entity, data),
  update: (entity, id, data) => ipcRenderer.invoke('store:update', entity, id, data),
  remove: (entity, id) => ipcRenderer.invoke('store:remove', entity, id),
  stats: () => ipcRenderer.invoke('store:stats'),

  // Service order sub-entities (parts, labor, notes)
  listParts: (serviceOrderId) => ipcRenderer.invoke('so:listParts', serviceOrderId),
  addPart: (serviceOrderId, data) => ipcRenderer.invoke('so:addPart', serviceOrderId, data),
  removePart: (partId) => ipcRenderer.invoke('so:removePart', partId),
  listLabor: (serviceOrderId) => ipcRenderer.invoke('so:listLabor', serviceOrderId),
  addLabor: (serviceOrderId, data) => ipcRenderer.invoke('so:addLabor', serviceOrderId, data),
  removeLabor: (laborId) => ipcRenderer.invoke('so:removeLabor', laborId),
  listNotes: (serviceOrderId) => ipcRenderer.invoke('so:listNotes', serviceOrderId),
  addNote: (serviceOrderId, content) => ipcRenderer.invoke('so:addNote', serviceOrderId, content),

  // Sync
  syncStatus: () => ipcRenderer.invoke('sync:status'),
  syncNow: () => ipcRenderer.invoke('sync:now'),
  onSyncStatus: (callback) => {
    const handler = (_event, status) => callback(status);
    ipcRenderer.on('sync:status', handler);
    return () => ipcRenderer.removeListener('sync:status', handler);
  },

  // Plate search
  searchPlate: (plate) => ipcRenderer.invoke('search:plate', plate),

  // Maintenance records
  maintList: () => ipcRenderer.invoke('maint:list'),
  maintGet: (id) => ipcRenderer.invoke('maint:getOne', id),
  maintCreate: (data) => ipcRenderer.invoke('maint:create', data),
  maintUpdate: (id, data) => ipcRenderer.invoke('maint:update', id, data),
  maintDelete: (id) => ipcRenderer.invoke('maint:delete', id),
  maintListItems: (recordId) => ipcRenderer.invoke('maint:listItems', recordId),
  maintAddItem: (recordId, data) => ipcRenderer.invoke('maint:addItem', recordId, data),
  maintRemoveItem: (itemId) => ipcRenderer.invoke('maint:removeItem', itemId),
  maintSchedule: (vehicleId) => ipcRenderer.invoke('maint:schedule', vehicleId),
  maintUpdateInterval: (vehicleId, maintenanceTypeId, data) => ipcRenderer.invoke('maint:updateInterval', vehicleId, maintenanceTypeId, data),
  maintLogInterval: (vehicleId, maintenanceTypeId, km, performedAt) => ipcRenderer.invoke('maint:logInterval', vehicleId, maintenanceTypeId, km, performedAt),

  // Vehicle full history by plate
  vehicleHistory: (plate) => ipcRenderer.invoke('vehicle:history', plate),

  // Dashboard widgets
  todayAppointments: () => ipcRenderer.invoke('dashboard:today-appointments'),
  activeOrders: () => ipcRenderer.invoke('dashboard:active-orders'),
  recentMaintenance: () => ipcRenderer.invoke('dashboard:recent-maintenance'),
  revenue: () => ipcRenderer.invoke('dashboard:revenue'),

  // Service orders with vehicle info
  allOrdersWithVehicle: () => ipcRenderer.invoke('so:all-with-vehicle'),

  // Print receipt
  print: (htmlContent) => ipcRenderer.invoke('app:print', htmlContent),

  // Zoom (menu accelerators are physical-key based and miss some layouts, e.g. Turkish)
  getZoomFactor: () => webFrame.getZoomFactor(),
  setZoomFactor: (factor) => webFrame.setZoomFactor(factor),
});
