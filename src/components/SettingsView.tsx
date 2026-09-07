import React, { useState } from 'react';
import {
  Settings, Download, Upload, Smartphone, ShieldCheck,
  AlertTriangle, Image as ImageIcon, Save, CheckCircle, RefreshCw, HardDrive
} from 'lucide-react';
import { AppData, StorageStatus } from '../types';
import { exportDataToFile, shareDataFile, requestPersistentStorage } from '../lib/phoneStorage';

interface Props {
  data: AppData;
  storageStatus: StorageStatus;
  onUpdateConfig: (newConfig: AppData['config']) => void;
  onRestoreBackup: (importedData: AppData) => void;
  onResetData: () => void;
  onRefreshStorageStatus: () => void;
}

export const SettingsView: React.FC<Props> = ({
  data,
  storageStatus,
  onUpdateConfig,
  onRestoreBackup,
  onResetData,
  onRefreshStorageStatus,
}) => {
  const [sysName, setSysName] = useState(data.config.sysName || 'يمن لاند');
  const [printAddress, setPrintAddress] = useState(data.config.printAddress || '');
  const [colorPrimary, setColorPrimary] = useState(data.config.colorPrimary || '#0f172a');
  const [colorAccent, setColorAccent] = useState(data.config.colorAccent || '#2563eb');
  const [backupInterval, setBackupInterval] = useState(data.config.backupInterval || 7);
  const [logoBase64, setLogoBase64] = useState(data.config.logoBase64 || '');
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLogoBase64(reader.result as string);
      setAlertMsg('تم تحميل الشعار بنجاح (انقر "حفظ الإعدادات" لتثبيته في الهاتف)');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveConfig = () => {
    onUpdateConfig({
      ...data.config,
      sysName: sysName.trim() || 'يمن لاند',
      printAddress: printAddress.trim(),
      colorPrimary,
      colorAccent,
      backupInterval: Number(backupInterval) || 7,
      logoBase64,
    });
    setAlertMsg('تم حفظ الإعدادات وتخصيصات الطباعة في ذاكرة الهاتف بنجاح!');
    setTimeout(() => setAlertMsg(null), 3500);
  };

  const handleExport = () => {
    exportDataToFile(data);
    setAlertMsg('تم تنزيل النسخة الاحتياطية إلى هاتفك (مجلد Downloads)');
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const handleShare = async () => {
    const success = await shareDataFile(data);
    if (!success) handleExport();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (parsed.items && Array.isArray(parsed.logs)) {
          if (
            confirm(
              `تم التحقق من ملف النسخة الاحتياطية بنجاح ويحتوي على (${parsed.logs.length} عملية).\nهل تريد استعادة البيانات والكتابة فوق البيانات الحالية؟`
            )
          ) {
            onRestoreBackup(parsed);
            setAlertMsg('تمت استعادة النسخة الاحتياطية بنجاح إلى ذاكرة الهاتف!');
          }
        } else {
          alert('ملف النسخة الاحتياطية غير متوافق أو تالف!');
        }
      } catch {
        alert('حدث خطأ أثناء قراءة ملف النسخة الاحتياطية');
      }
    };
    reader.readAsText(file);
  };

  const handleRequestPersistent = async () => {
    const granted = await requestPersistentStorage();
    onRefreshStorageStatus();
    if (granted) {
      setAlertMsg('تم تفعيل حماية الحفظ الدائم في الهاتف بنجاح!');
    } else {
      setAlertMsg('الحفظ المباشر يعمل بنجاح في ذاكرة الهاتف.');
    }
    setTimeout(() => setAlertMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Alert toast message */}
      {alertMsg && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{alertMsg}</span>
        </div>
      )}

      {/* Phone Storage & Memory Center */}
      <div className="bg-slate-900 text-white rounded-xl shadow-md p-4 sm:p-6 space-y-4 border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-blue-400" />
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">مركز إدارة ذاكرة الهاتف والنسخ الاحتياطي</h3>
              <p className="text-xs text-slate-400">
                حفظ محلي آمن داخل مساحة تخزين هاتفك بدون الحاجة لأي خوادم خارجية
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full font-bold text-xs border border-emerald-500/30">
            حفظ تلقائي مستمر
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <div className="text-slate-400 flex items-center gap-1.5 mb-1">
              <HardDrive className="w-3.5 h-3.5 text-blue-400" />
              <span>مساحة التخزين المستهلكة بالهاتف</span>
            </div>
            <div className="text-lg font-black text-emerald-400">{storageStatus.formattedUsage}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">سعة IndexedDB المتاحة لملايين السجلات</div>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <div className="text-slate-400 flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>حالة حماية الحفظ الدائم</span>
            </div>
            <div className="text-sm font-bold text-slate-100">
              {storageStatus.isPersistent ? 'محمي ضد التنظيف التلقائي' : 'حفظ قياسي على الهاتف'}
            </div>
            {!storageStatus.isPersistent && (
              <button
                onClick={handleRequestPersistent}
                className="mt-1 text-[11px] text-blue-400 hover:text-blue-300 underline cursor-pointer"
              >
                تفعيل الحماية الدائمة للهاتف
              </button>
            )}
          </div>

          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <div className="text-slate-400 mb-1">آخر عملية حفظ في الهاتف</div>
            <div className="text-sm font-bold text-blue-300">{storageStatus.lastSavedText}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">يتم الحفظ تلقائياً مع كل حركة</div>
          </div>
        </div>

        {/* Download & Import Actions */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>تنزيل نسخة احتياطية إلى ملفات الهاتف (.json)</span>
          </button>

          {typeof navigator !== 'undefined' && 'canShare' in navigator && (
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer"
            >
              <span>مشاركة ملف النسخة</span>
            </button>
          )}

          <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer shadow-sm">
            <Upload className="w-4 h-4" />
            <span>استعادة نسخة سابقة من ملفات الهاتف</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Official Print Header and Branding Settings */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
          <Settings className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-base sm:text-lg">تخصيص الترويسة والشعار للطباعة الرسمية</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              اسم المؤسسة / الشركة (يمين الترويسة)
            </label>
            <input
              type="text"
              value={sysName}
              onChange={(e) => setSysName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-hidden"
              placeholder="مثال: يمن لاند"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              العنوان / الوصف الفرعي
            </label>
            <input
              type="text"
              value={printAddress}
              onChange={(e) => setPrintAddress(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
              placeholder="مثال: قطاع الدعم الفني - إدارة العهد"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              شعار المؤسسة (يظهر في منتصف السندات الرسمية)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="text-xs file:mr-2 file:py-2 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
              />
              {logoBase64 && (
                <img
                  src={logoBase64}
                  alt="شعار المؤسسة"
                  className="h-10 w-16 object-contain border border-slate-200 rounded p-1"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              تذكير النسخ الاحتياطي الدوري
            </label>
            <select
              value={backupInterval}
              onChange={(e) => setBackupInterval(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
              <option value={1}>يومياً</option>
              <option value={3}>كل 3 أيام</option>
              <option value={7}>أسبوعياً (كل 7 أيام)</option>
              <option value={30}>شهرياً (كل 30 يوماً)</option>
            </select>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={handleSaveConfig}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition cursor-pointer shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>حفظ الإعدادات في الهاتف</span>
          </button>
        </div>
      </div>

      {/* Danger Zone: Reset Data */}
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <span>إعادة ضبط المصنع ومسح البيانات</span>
        </div>
        <p className="text-xs text-rose-700 leading-relaxed">
          تحذير: سيؤدي هذا الإجراء إلى مسح كافة سجلات العمليات والأصناف المضافة وإعادة التطبيق إلى حالته الأصلية الأولى. يرجى أخذ نسخة احتياطية قبل المتابعة.
        </p>
        <button
          onClick={() => {
            if (
              confirm('تحذير نهائي:\nهل أنت متأكد تماماً من رغبتك في حذف جميع بيانات المخازن من ذاكرة الهاتف؟')
            ) {
              onResetData();
              setAlertMsg('تمت إعادة ضبط البيانات بنجاح.');
            }
          }}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
        >
          مسح وإعادة ضبط البيانات
        </button>
      </div>

    </div>
  );
};
