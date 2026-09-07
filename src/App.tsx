import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, ArrowRightLeft, Clock, Filter, History, Users,
  Package, Settings, Menu, X, Smartphone, ShieldCheck
} from 'lucide-react';
import { AppData, LogEntry, ItemDef, StorageStatus } from './types';
import {
  loadDataFromPhone, saveDataToPhone, getStorageStats, defaultAppData
} from './lib/phoneStorage';

import { PhoneStorageBar } from './components/PhoneStorageBar';
import { AnalyticsView } from './components/AnalyticsView';
import { TransactionsView } from './components/TransactionsView';
import { OrdersFollowupView } from './components/OrdersFollowupView';
import { InventoryView } from './components/InventoryView';
import { LogsView } from './components/LogsView';
import { AuthorizedView } from './components/AuthorizedView';
import { ItemsAndStoresView } from './components/ItemsAndStoresView';
import { SettingsView } from './components/SettingsView';
import { PrintModal } from './components/PrintModal';
import { useOnlineStatus } from './hooks/useOnlineStatus';

export default function App() {
  const [data, setData] = useState<AppData>(defaultAppData);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('trans');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Print modal state
  const [printingBatchId, setPrintingBatchId] = useState<string | null>(null);

  // Edit batch state
  const [editingBatch, setEditingBatch] = useState<LogEntry[] | null>(null);

  // Phone storage health & status
  const [storageStatus, setStorageStatus] = useState<StorageStatus>({
    isPersistent: false,
    usageBytes: 0,
    quotaBytes: 0,
    formattedUsage: '0 كيلوبايت',
    entryCount: 0,
    lastSavedText: '',
  });

  // Backup reminder state
  const [showBackupAlert, setShowBackupAlert] = useState(false);

  // Network offline status
  const isOnline = useOnlineStatus();

  // Haptic trigger for mobile touch feedback
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(20);
      } catch {}
    }
  };

  // Load from Phone Memory on mount
  useEffect(() => {
    async function initPhoneData() {
      const loaded = await loadDataFromPhone();
      setData(loaded);
      setIsLoaded(true);

      const stats = await getStorageStats(loaded.logs.length);
      setStorageStatus(stats);

      // Check backup reminder interval
      const intervalDays = loaded.config.backupInterval || 7;
      const daysPassed = (Date.now() - (loaded.lastBackupDate || Date.now())) / (1000 * 60 * 60 * 24);
      if (daysPassed >= intervalDays && loaded.logs.length > 0) {
        setShowBackupAlert(true);
      }
    }
    initPhoneData();
  }, []);

  // Update and commit to Phone Storage (IndexedDB + LocalStorage)
  const commitToPhone = useCallback(async (updated: AppData) => {
    setData(updated);
    await saveDataToPhone(updated);
    const stats = await getStorageStats(updated.logs.length);
    setStorageStatus(stats);
  }, []);

  // Handle saving new or edited batch of transactions
  const handleSaveBatch = (
    newLogs: LogEntry[],
    batchId: string,
    isEdit: boolean,
    oldBatchId?: string
  ) => {
    let nextLogs = [...data.logs];

    if (isEdit && oldBatchId) {
      nextLogs = nextLogs.filter((l) => l.batchId !== oldBatchId);
    }

    nextLogs = [...nextLogs, ...newLogs];

    const currentLastRef = data.config.lastRefNo || 1000;
    const refNum = parseInt(batchId.replace('REF-', '')) || currentLastRef;
    const nextLastRef = Math.max(currentLastRef, refNum);

    const updatedData: AppData = {
      ...data,
      logs: nextLogs,
      config: {
        ...data.config,
        lastRefNo: nextLastRef,
      },
    };

    commitToPhone(updatedData);
    setEditingBatch(null);
  };

  // Edit batch
  const handleEditBatch = (batchId: string) => {
    const logsToEdit = data.logs.filter((l) => l.batchId === batchId);
    if (logsToEdit.length > 0) {
      setEditingBatch(logsToEdit);
      setActiveTab('trans');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Delete batch
  const handleDeleteBatch = (batchId: string) => {
    const target = data.logs.filter((l) => l.batchId === batchId);
    if (target.length === 0) return;
    if (
      !confirm(
        `هل أنت متأكد من حذف العملية (${batchId}) بالكامل؟\nسيتم حذف كافة بنودها وإعادة احتساب الرصيد في ذاكرة الهاتف.`
      )
    ) {
      return;
    }

    const updatedData: AppData = {
      ...data,
      logs: data.logs.filter((l) => l.batchId !== batchId),
    };
    commitToPhone(updatedData);
  };

  // Update order slip image
  const handleUpdateBatchImage = (batchId: string, imageBase64: string) => {
    const nextLogs = data.logs.map((l) => {
      if (l.batchId === batchId && l.type === 'منصرف') {
        return { ...l, orderImage: imageBase64 };
      }
      return l;
    });

    const updatedData: AppData = {
      ...data,
      logs: nextLogs,
    };
    commitToPhone(updatedData);
  };

  // Add/Remove Stores
  const handleAddStore = (name: string) => {
    const updatedData: AppData = {
      ...data,
      stores: [...data.stores, name],
    };
    commitToPhone(updatedData);
  };

  const handleRemoveStore = (index: number) => {
    const nextStores = [...data.stores];
    nextStores.splice(index, 1);
    commitToPhone({ ...data, stores: nextStores });
  };

  // Add/Remove Items
  const handleAddItem = (item: ItemDef) => {
    const updatedData: AppData = {
      ...data,
      items: [...data.items, item],
    };
    commitToPhone(updatedData);
  };

  const handleRemoveItem = (index: number) => {
    const nextItems = [...data.items];
    nextItems.splice(index, 1);
    commitToPhone({ ...data, items: nextItems });
  };

  // Add/Remove Authorized
  const handleAddAuthorized = (name: string) => {
    const updatedData: AppData = {
      ...data,
      authorized: [...data.authorized, name],
    };
    commitToPhone(updatedData);
  };

  const handleRemoveAuthorized = (index: number) => {
    const nextAuth = [...data.authorized];
    nextAuth.splice(index, 1);
    commitToPhone({ ...data, authorized: nextAuth });
  };

  // Update Config
  const handleUpdateConfig = (newConfig: AppData['config']) => {
    commitToPhone({ ...data, config: newConfig });
  };

  // Restore Backup
  const handleRestoreBackup = (importedData: AppData) => {
    commitToPhone(importedData);
    setShowBackupAlert(false);
  };

  // Reset to initial
  const handleResetData = () => {
    commitToPhone(JSON.parse(JSON.stringify(defaultAppData)));
  };

  // Refresh status
  const refreshStorageStats = async () => {
    const stats = await getStorageStats(data.logs.length);
    setStorageStatus(stats);
  };

  // Pending orders count for badge
  const pendingOrdersMap: Record<string, LogEntry[]> = {};
  data.logs
    .filter((l) => l.type === 'منصرف')
    .forEach((l) => {
      if (!pendingOrdersMap[l.batchId]) {
        pendingOrdersMap[l.batchId] = [];
      }
      pendingOrdersMap[l.batchId].push(l);
    });

  const pendingOrdersCount = Object.values(pendingOrdersMap).filter(
    (batch: LogEntry[]) => !batch.some((l) => l.orderImage)
  ).length;

  const navItems = [
    { id: 'trans', label: 'حركة وتحويل العهد', icon: ArrowRightLeft },
    { id: 'orders', label: 'متابعة الأوامر', icon: Clock, badge: pendingOrdersCount },
    { id: 'analytics', label: 'تحليل المخزون', icon: TrendingUp },
    { id: 'inv', label: 'الجرد والفلترة', icon: Filter },
    { id: 'logs', label: 'سجل العمليات', icon: History },
    { id: 'auth', label: 'المخولين بالاستلام', icon: Users },
    { id: 'items', label: 'الأصناف والمخازن', icon: Package },
    { id: 'settings', label: 'إعدادات النظام والذاكرة', icon: Settings },
  ];

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
        <div className="text-center space-y-3">
          <Smartphone className="w-12 h-12 text-blue-400 animate-bounce mx-auto" />
          <h2 className="text-lg font-bold">جارٍ تحميل قاعدة البيانات من ذاكرة الهاتف...</h2>
          <p className="text-xs text-slate-400">تطبيق إدارة العهد والمخازن يعمل محلياً بالكامل دون اتصال</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800 selection:bg-blue-600 selection:text-white">
      
      {/* Top Phone Memory Status Bar */}
      <PhoneStorageBar
        status={storageStatus}
        data={data}
        onRefreshStatus={refreshStorageStats}
      />

      {/* Offline Status Indicator if disconnected */}
      {!isOnline && (
        <div className="no-print bg-slate-800 text-amber-300 border-b border-amber-500/30 px-3 py-1.5 text-xs flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          <span>وضع العمل دون اتصال — قاعدة البيانات وحفظ السجلات تعمل محلياً بذاكرة الهاتف بنسبة 100%</span>
        </div>
      )}

      {/* Backup Alert Banner if interval reached */}
      {showBackupAlert && (
        <div className="no-print bg-amber-500 text-slate-950 px-4 py-2.5 shadow-sm text-xs sm:text-sm font-bold flex items-center justify-between gap-3">
          <span>
            🔔 تنبيه النسخ الاحتياطي: حان موعد حفظ نسخة احتياطية من بيانات المخازن إلى ملفات هاتفك.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('settings');
                setShowBackupAlert(false);
              }}
              className="px-2.5 py-1 bg-slate-950 text-white rounded text-xs hover:bg-slate-800 transition cursor-pointer"
            >
              فتح الإعدادات والتنزيل
            </button>
            <button
              onClick={() => setShowBackupAlert(false)}
              className="px-2 py-1 text-slate-950 hover:bg-amber-600 rounded text-xs"
            >
              إخفاء
            </button>
          </div>
        </div>
      )}

      {/* Mobile Top Header */}
      <header className="no-print lg:hidden bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
          {data.config.logoBase64 ? (
            <img src={data.config.logoBase64} alt="شعار" className="h-7 w-7 object-contain rounded" />
          ) : (
            <Package className="w-6 h-6 text-blue-400" />
          )}
          <span className="font-extrabold text-sm sm:text-base tracking-wide">
            {data.config.sysName || 'نظام إدارة العهد والمخازن'}
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:text-white cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="no-print lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-slate-900 text-white rounded-t-2xl p-4 space-y-2 max-h-[80vh] overflow-y-auto border-t border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-bold text-sm text-slate-300">قائمة أقسام النظام</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      triggerHaptic();
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`p-3 rounded-xl text-right flex items-center gap-2.5 text-xs font-bold transition cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {!!item.badge && item.badge > 0 && (
                      <span className="mr-auto bg-amber-500 text-slate-950 font-mono text-[10px] px-1.5 py-0.2 rounded-full font-black">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Layout (Sidebar + Content) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Desktop Sidebar */}
        <aside className="no-print hidden lg:flex flex-col w-64 bg-slate-900 text-slate-200 border-l border-slate-800 p-4 shrink-0 shadow-lg select-none">
          {/* Brand header */}
          <div className="pb-4 mb-3 border-b border-slate-800/80 flex items-center gap-3">
            {data.config.logoBase64 ? (
              <img src={data.config.logoBase64} alt="شعار" className="h-10 w-10 object-contain rounded p-1 bg-white/5" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Package className="w-6 h-6" />
              </div>
            )}
            <div className="overflow-hidden">
              <h2 className="font-extrabold text-sm text-white tracking-wide truncate">
                {data.config.sysName || 'نظام إدارة العهد'}
              </h2>
              <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3" />
                <span>محفوظ بذاكرة الهاتف</span>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                  }}
                  className={`w-full p-2.5 rounded-xl text-right flex items-center justify-between text-xs sm:text-sm font-bold transition cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 translate-x-[-2px]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {!!item.badge && item.badge > 0 && (
                    <span className="bg-amber-500 text-slate-950 font-mono text-[10px] px-2 py-0.5 rounded-full font-black">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer credit */}
          <div className="pt-4 mt-auto border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-400">إدارة الاتصالات</p>
            <p>إعداد المساعد أول. <strong className="text-slate-300">علي العثماني</strong></p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto pb-24 lg:pb-10">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {activeTab === 'analytics' && <AnalyticsView data={data} />}

            {activeTab === 'trans' && (
              <TransactionsView
                data={data}
                onSaveBatch={handleSaveBatch}
                editingBatch={editingBatch}
                onCancelEdit={() => setEditingBatch(null)}
                onOpenPrint={(bId) => setPrintingBatchId(bId)}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersFollowupView
                data={data}
                onUpdateBatchImage={handleUpdateBatchImage}
                onEditBatch={handleEditBatch}
                onDeleteBatch={handleDeleteBatch}
                onOpenPrint={(bId) => setPrintingBatchId(bId)}
              />
            )}

            {activeTab === 'inv' && <InventoryView data={data} />}

            {activeTab === 'logs' && (
              <LogsView
                data={data}
                onEditBatch={handleEditBatch}
                onDeleteBatch={handleDeleteBatch}
                onOpenPrint={(bId) => setPrintingBatchId(bId)}
              />
            )}

            {activeTab === 'auth' && (
              <AuthorizedView
                data={data}
                onAddAuthorized={handleAddAuthorized}
                onRemoveAuthorized={handleRemoveAuthorized}
              />
            )}

            {activeTab === 'items' && (
              <ItemsAndStoresView
                data={data}
                onAddStore={handleAddStore}
                onRemoveStore={handleRemoveStore}
                onAddItem={handleAddItem}
                onRemoveItem={handleRemoveItem}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                data={data}
                storageStatus={storageStatus}
                onUpdateConfig={handleUpdateConfig}
                onRestoreBackup={handleRestoreBackup}
                onResetData={handleResetData}
                onRefreshStorageStatus={refreshStorageStats}
              />
            )}

            {/* Official System Footer */}
            <footer className="no-print mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-500 leading-relaxed bg-white p-4 rounded-xl shadow-xs border">
              <p className="font-bold text-slate-700">إدارة الاتصالات.</p>
              <p className="mt-1">
                اعداد. المساعد اول. <strong className="text-slate-900 font-extrabold">علي العثماني</strong> &nbsp;|&nbsp; جميع الحقوق محفوظة
              </p>
              <p className="mt-1 text-[11px] text-emerald-700 font-semibold">
                جميع بيانات وسجلات المخازن والعهد والتوثيق الفوتوغرافي محفوظة محلياً في ذاكرة هذا الهاتف بشكل دائم
              </p>
            </footer>

          </div>
        </main>
      </div>

      {/* Mobile Bottom Quick-Navigation Bar */}
      <div className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around text-white">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                triggerHaptic();
                setActiveTab(item.id);
              }}
              className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[11px] font-semibold transition relative cursor-pointer ${
                isActive ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate max-w-[62px]">{item.label.split(' ')[0]}</span>
              {!!item.badge && item.badge > 0 && (
                <span className="absolute top-0 right-1 bg-amber-500 text-slate-950 font-mono text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
        <button
          onClick={() => {
            triggerHaptic();
            setMobileMenuOpen(true);
          }}
          className="flex flex-col items-center gap-0.5 p-1.5 text-slate-400 hover:text-slate-200 text-[11px] font-semibold cursor-pointer"
        >
          <Menu className="w-4 h-4" />
          <span>المزيد</span>
        </button>
      </div>

      {/* Printable Receipt / Voucher Modal */}
      {printingBatchId && (
        <PrintModal
          batchId={printingBatchId}
          logs={data.logs}
          config={data.config}
          onClose={() => setPrintingBatchId(null)}
        />
      )}

    </div>
  );
}
