export interface ItemDef {
  name: string;
  hasSN: 'yes' | 'no';
}

export interface SystemConfig {
  sysName: string;
  printAddress: string;
  logoBase64: string;
  colorPrimary: string;
  colorAccent: string;
  lastRefNo: number;
  backupInterval: number;
}

export interface LogEntry {
  batchId: string;
  date: string;
  type: 'وارد' | 'منصرف' | 'تحويل';
  sub?: string; // مشتريات | مرتجع | بدل تالف | etc.
  item: string;
  sn: string;
  qty: number;
  cond: 'جديد' | 'مستخدم' | 'تالف';
  store: string;
  toStore?: string | null;
  recipient?: string;
  receiverName?: string;
  issueSubtype?: string; // اضافي | بدل تالف
  docNo?: string;
  emp?: string;
  notes?: string;
  orderImage?: string;
  damagedReturn?: boolean;
}

export interface TempBatchItem {
  item: string;
  sn: string;
  qty: number;
  cond: 'جديد' | 'مستخدم' | 'تالف';
  returnFrom?: string;
}

export interface DamagedBatchItem {
  item: string;
  sn: string;
  qty: number;
  cond: 'جديد' | 'مستخدم' | 'تالف';
  notes?: string;
}

export interface AppData {
  config: SystemConfig;
  stores: string[];
  authorized: string[];
  items: ItemDef[];
  logs: LogEntry[];
  lastBackupDate: number;
}

export interface StorageStatus {
  isPersistent: boolean;
  usageBytes: number;
  quotaBytes: number;
  formattedUsage: string;
  entryCount: number;
  lastSavedText: string;
}
