import React, { useState } from 'react';
import { Camera, CheckCircle, Clock, Printer, Trash2, Edit3, Image as ImageIcon } from 'lucide-react';
import { AppData, LogEntry } from '../types';
import { compressImage } from '../lib/phoneStorage';

interface Props {
  data: AppData;
  onUpdateBatchImage: (batchId: string, imageBase64: string) => void;
  onEditBatch: (batchId: string) => void;
  onDeleteBatch: (batchId: string) => void;
  onOpenPrint: (batchId: string) => void;
}

export const OrdersFollowupView: React.FC<Props> = ({
  data,
  onUpdateBatchImage,
  onEditBatch,
  onDeleteBatch,
  onOpenPrint,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<{ [batchId: string]: string }>({});
  const [loadingBatch, setLoadingBatch] = useState<string | null>(null);

  // Group outward logs by batchId
  const outwardBatches: Record<string, LogEntry[]> = {};
  data.logs
    .filter((l) => l.type === 'منصرف')
    .forEach((l) => {
      if (!outwardBatches[l.batchId]) {
        outwardBatches[l.batchId] = [];
      }
      outwardBatches[l.batchId].push(l);
    });

  // Filter pending: batches with no order image attached
  const pendingBatches = Object.values(outwardBatches).filter(
    (batch) => !batch.some((l) => l.orderImage)
  );

  const handleCaptureImage = async (batchId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoadingBatch(batchId);
      const compressed = await compressImage(file, 1200, 0.78);
      onUpdateBatchImage(batchId, compressed);
      setSelectedPhoto((prev) => ({ ...prev, [batchId]: compressed }));
    } catch {
      alert('تعذر قراءة أو ضغط صورة الأمر');
    } finally {
      setLoadingBatch(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header card with pending count */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span>متابعة أوامر الصرف المتبقية بدون صور</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            الأوامر المسجلة التي تنتظر إرفاق صورة السند الورقي المختوم. بعد تصوير السند تختفي تلقائياً.
          </p>
        </div>
        <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full font-bold text-xs sm:text-sm">
          {pendingBatches.length} أوامر قيد المتابعة
        </span>
      </div>

      {pendingBatches.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h4 className="font-bold text-slate-900 text-base sm:text-lg mb-1">
            رائع! جميع أوامر الصرف مكتملة وموثقة بالصور
          </h4>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            لا توجد أي أوامر صرف معلقة بدون صورة. جميع السندات موثقة ومحفوظة بالكامل في ذاكرة الهاتف.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingBatches.map((batch) => {
            const first = batch[0];
            const itemsSummary = batch.map((l) => `${l.item} (${l.qty})`).join('، ');

            return (
              <div
                key={first.batchId}
                className="bg-white rounded-xl border border-amber-200 shadow-xs p-4 sm:p-5 space-y-3.5 hover:border-amber-400 transition"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded text-xs">
                      {first.batchId}
                    </span>
                    <span className="text-xs text-slate-500">{first.date}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                    بانتظار الصورة
                  </span>
                </div>

                <div className="text-xs sm:text-sm space-y-1.5 text-slate-700">
                  <div>
                    <span className="text-slate-400">الجهة المستلمة: </span>
                    <strong className="text-slate-900">{first.recipient || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">اسم المستلم: </span>
                    <strong className="text-slate-800">{first.receiverName || 'غير مدخل'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">المخزن الأساسي: </span>
                    <span>{first.store}</span>
                  </div>
                  {first.docNo && (
                    <div>
                      <span className="text-slate-400">رقم سند الاستلام: </span>
                      <span className="font-mono font-bold">{first.docNo}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400">الأصناف: </span>
                    <span className="font-medium text-slate-900">{itemsSummary}</span>
                  </div>
                </div>

                {/* Upload Action */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs">
                    <Camera className="w-4 h-4" />
                    <span>{loadingBatch === first.batchId ? 'جارٍ الحفظ...' : 'تصوير السند بالهاتف'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      disabled={loadingBatch === first.batchId}
                      onChange={(e) => handleCaptureImage(first.batchId, e)}
                      className="hidden"
                    />
                  </label>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenPrint(first.batchId)}
                      title="طباعة السند"
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditBatch(first.batchId)}
                      title="تعديل العملية"
                      className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteBatch(first.batchId)}
                      title="حذف العملية"
                      className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
