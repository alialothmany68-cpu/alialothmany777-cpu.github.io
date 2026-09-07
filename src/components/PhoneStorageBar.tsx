import React, { useState } from 'react';
import { Smartphone, HardDrive, ShieldCheck, Download, Share2, AlertCircle } from 'lucide-react';
import { StorageStatus, AppData } from '../types';
import { exportDataToFile, shareDataFile, requestPersistentStorage } from '../lib/phoneStorage';

interface Props {
  status: StorageStatus;
  data: AppData;
  onRefreshStatus: () => void;
}

export const PhoneStorageBar: React.FC<Props> = ({
  status,
  data,
  onRefreshStatus,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [copiedAlert, setCopiedAlert] = useState<string | null>(null);

  const handleExport = () => {
    exportDataToFile(data);
    setCopiedAlert('تم تنزيل النسخة الاحتياطية إلى ملفات هاتفك (مجلد التنزيلات)');
    setTimeout(() => setCopiedAlert(null), 4000);
  };

  const handleShare = async () => {
    const success = await shareDataFile(data);
    if (!success) {
      handleExport();
    }
  };

  const handleEnablePersistence = async () => {
    const granted = await requestPersistentStorage();
    onRefreshStatus();
    if (granted) {
      setCopiedAlert('تم تفعيل الحفظ الدائم في الهاتف بنجاح! لن يقوم الهاتف بحذف بياناتك.');
    } else {
      setCopiedAlert('الحفظ المحلي نشط ومفعل في ذاكرة الهاتف.');
    }
    setTimeout(() => setCopiedAlert(null), 4000);
  };

  return (
    <div className="no-print bg-slate-900 text-slate-100 border-b border-slate-800 px-4 py-2.5 shadow-sm text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Storage State Indicator */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
            <Smartphone className="w-3.5 h-3.5" />
            <span>الحفظ المباشر: ذاكرة الهاتف</span>
          </span>

          <span className="hidden sm:inline-flex items-center gap-1 text-slate-300">
            <HardDrive className="w-3.5 h-3.5 text-blue-400" />
            <span>المساحة: <strong>{status.formattedUsage}</strong></span>
          </span>

          <span className="hidden md:inline-flex items-center gap-1 text-slate-300">
            <span>العمليات: <strong>{status.entryCount}</strong></span>
          </span>

          {status.isPersistent ? (
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">حفظ دائم محمي من الحذف</span>
            </span>
          ) : (
            <button
              onClick={handleEnablePersistence}
              className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 underline underline-offset-2 cursor-pointer"
              title="انقر لتفعيل حماية الذاكرة من التنظيف التلقائي للهاتف"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>تأكيد الحفظ الدائم</span>
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition cursor-pointer shadow-xs"
            title="تنزيل ملف النسخة الاحتياطية وحفظه في مجلد التنزيلات بالهاتف"
          >
            <Download className="w-3.5 h-3.5" />
            <span>نسخة بالهاتف</span>
          </button>

          {typeof navigator !== 'undefined' && 'canShare' in navigator && (
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition cursor-pointer"
              title="مشاركة أو إرسال ملف البيانات إلى الواتساب أو مدير الملفات"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">مشاركة</span>
            </button>
          )}

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-xs transition cursor-pointer"
          >
            {showDetails ? 'إغلاق' : 'معلومات الذاكرة'}
          </button>
        </div>
      </div>

      {/* Alert toast message */}
      {copiedAlert && (
        <div className="mt-2 p-2 bg-emerald-900/80 border border-emerald-500/50 text-emerald-200 text-xs rounded text-center animate-fade-in">
          {copiedAlert}
        </div>
      )}

      {/* Expanded Memory details panel */}
      {showDetails && (
        <div className="mt-2.5 p-3 bg-slate-800/90 rounded-lg border border-slate-700 text-xs text-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2 animate-fade-in">
          <div>
            <div className="text-slate-400">تقنية التخزين على الجهاز:</div>
            <div className="font-semibold text-white">IndexedDB عالي السعة + LocalStorage</div>
          </div>
          <div>
            <div className="text-slate-400">حجم البيانات المخزنة:</div>
            <div className="font-semibold text-emerald-400">{status.formattedUsage} ({status.entryCount} سجل مخزني)</div>
          </div>
          <div>
            <div className="text-slate-400">آخر تحديث في ذاكرة الهاتف:</div>
            <div className="font-semibold text-blue-300">{status.lastSavedText} (حفظ فوري تلقائي)</div>
          </div>
        </div>
      )}
    </div>
  );
};
