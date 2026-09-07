import { AppData, StorageStatus } from '../types';

const DB_NAME = 'phone_warehouse_db';
const STORE_NAME = 'warehouse_store';
const DB_VERSION = 1;
const LOCALSTORAGE_KEY = 'sys_db_v5';

export const defaultItems = [
  { name: 'جهاز موتورولا', hasSN: 'yes' as const },
  { name: 'جهاز عمري', hasSN: 'yes' as const },
  { name: 'جهاز تابلت (ايباد)', hasSN: 'no' as const },
  { name: 'توابع أجهزة (شاحن/كابل)', hasSN: 'no' as const },
];

export const defaultAppData: AppData = {
  config: {
    sysName: 'يمن لاند',
    printAddress: 'قطاع الدعم الفني - إدارة العهد والمخازن',
    logoBase64: '',
    colorPrimary: '#0f172a',
    colorAccent: '#2563eb',
    lastRefNo: 1000,
    backupInterval: 7,
  },
  stores: ['المخزن الرئيسي', 'مخزن التالف'],
  authorized: ['قسم المبيعات', 'قسم الصيانة', 'إدارة العمليات', 'قسم تقنية المعلومات'],
  items: defaultItems,
  logs: [],
  lastBackupDate: Date.now(),
};

// Open or create phone IndexedDB
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB غير مدعوم في هذا المتصفح'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Load data from Phone Memory (IndexedDB -> AndroidStorage -> LocalStorage -> Default)
export async function loadDataFromPhone(): Promise<AppData> {
  // 1. Check native Android Bridge if available
  const nativeAndroid = (window as unknown as { AndroidStorage?: { loadData: () => string } }).AndroidStorage;
  if (nativeAndroid && typeof nativeAndroid.loadData === 'function') {
    try {
      const raw = nativeAndroid.loadData();
      if (raw) {
        const parsed = JSON.parse(raw);
        return sanitizeLoadedData(parsed);
      }
    } catch (e) {
      console.warn('Failed to load from AndroidStorage', e);
    }
  }

  // 2. Load from IndexedDB (High capacity phone storage)
  try {
    const db = await openIndexedDB();
    const result = await new Promise<AppData | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('current_app_data');
      req.onsuccess = () => resolve(req.result as AppData || null);
      req.onerror = () => reject(req.error);
    });

    if (result && result.logs) {
      return sanitizeLoadedData(result);
    }
  } catch (e) {
    console.warn('IndexedDB read failed, falling back to LocalStorage', e);
  }

  // 3. Fallback to LocalStorage
  try {
    const local = localStorage.getItem(LOCALSTORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      return sanitizeLoadedData(parsed);
    }
  } catch (e) {
    console.warn('LocalStorage read failed', e);
  }

  // 4. Return default initial data
  return JSON.parse(JSON.stringify(defaultAppData));
}

function sanitizeLoadedData(raw: Partial<AppData>): AppData {
  const merged: AppData = {
    config: { ...defaultAppData.config, ...(raw.config || {}) },
    stores: Array.isArray(raw.stores) && raw.stores.length > 0 ? raw.stores : defaultAppData.stores,
    authorized: Array.isArray(raw.authorized) && raw.authorized.length > 0 ? raw.authorized : defaultAppData.authorized,
    items: Array.isArray(raw.items) && raw.items.length > 0 ? raw.items : defaultAppData.items,
    logs: Array.isArray(raw.logs) ? raw.logs : [],
    lastBackupDate: raw.lastBackupDate || Date.now(),
  };

  // Ensure "مخزن التالف" is present
  if (!merged.stores.includes('مخزن التالف')) {
    merged.stores.push('مخزن التالف');
  }

  return merged;
}

// Save data into Phone Memory
export async function saveDataToPhone(data: AppData): Promise<boolean> {
  const serialized = JSON.stringify(data);

  // 1. Android native storage bridge
  const nativeAndroid = (window as unknown as { AndroidStorage?: { saveData: (val: string) => void } }).AndroidStorage;
  if (nativeAndroid && typeof nativeAndroid.saveData === 'function') {
    try {
      nativeAndroid.saveData(serialized);
    } catch (e) {
      console.warn('AndroidStorage save failed', e);
    }
  }

  // 2. Primary: IndexedDB (Supports large logs, high-res photos, no 5MB limit)
  let idbSuccess = false;
  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(data, 'current_app_data');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    idbSuccess = true;
  } catch (e) {
    console.error('IndexedDB save error', e);
  }

  // 3. Secondary: LocalStorage (with try-catch in case photos exceed quota)
  try {
    localStorage.setItem(LOCALSTORAGE_KEY, serialized);
  } catch (e) {
    console.warn('LocalStorage quota exceeded (safely stored in phone IndexedDB)', e);
  }

  return idbSuccess;
}

// Request persistent storage so mobile OS does not wipe the database
export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      return isPersisted;
    } catch (e) {
      console.warn('Persistent storage request error', e);
      return false;
    }
  }
  return false;
}

// Check storage stats
export async function getStorageStats(logCount: number): Promise<StorageStatus> {
  let isPersistent = false;
  let usageBytes = 0;
  let quotaBytes = 0;

  if (navigator.storage && navigator.storage.persisted) {
    try {
      isPersistent = await navigator.storage.persisted();
    } catch {
      isPersistent = false;
    }
  }

  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      usageBytes = estimate.usage || 0;
      quotaBytes = estimate.quota || 0;
    } catch {
      usageBytes = 0;
    }
  }

  // If estimate returns 0, approximate based on current LocalStorage / JSON size
  if (usageBytes === 0) {
    try {
      const local = localStorage.getItem(LOCALSTORAGE_KEY);
      if (local) {
        usageBytes = new Blob([local]).size;
      }
    } catch {
      usageBytes = 0;
    }
  }

  const formattedUsage = formatBytes(usageBytes);
  const now = new Date();
  const lastSavedText = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return {
    isPersistent,
    usageBytes,
    quotaBytes,
    formattedUsage,
    entryCount: logCount,
    lastSavedText,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 كيلوبايت';
  const k = 1024;
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return `${val} ${sizes[i] || 'بايت'}`;
}

// Export database directly to a downloadable file on the phone
export function exportDataToFile(data: AppData): void {
  const cloned = { ...data, lastBackupDate: Date.now() };
  const jsonStr = JSON.stringify(cloned, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `نسخة_احتياطية_مخازن_${dateStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Share backup file via mobile Web Share API if supported
export async function shareDataFile(data: AppData): Promise<boolean> {
  const jsonStr = JSON.stringify(data, null, 2);
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `نسخة_احتياطية_مخازن_${dateStr}.json`;
  const file = new File([jsonStr], filename, { type: 'application/json' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: 'نسخة احتياطية لقاعدة بيانات المخازن',
        text: `نسخة احتياطية للنظام الإداري والمخازن - ${dateStr}`,
        files: [file],
      });
      return true;
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        console.warn('Share error', e);
      }
      return false;
    }
  }
  return false;
}

// Compress camera photo for fast storage in phone memory
export function compressImage(file: File, maxDim = 1280, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذر قراءة ملف الصورة'));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('فشل معالجة أبعاد الصورة'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('صيغة الصورة غير صالحة'));
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
