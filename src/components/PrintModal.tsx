import React from 'react';
import { Printer, X } from 'lucide-react';
import { LogEntry, SystemConfig } from '../types';

interface Props {
  batchId: string;
  logs: LogEntry[];
  config: SystemConfig;
  onClose: () => void;
}

export const PrintModal: React.FC<Props> = ({ batchId, logs, config, onClose }) => {
  const batchLogs = logs.filter((l) => l.batchId === batchId);
  if (batchLogs.length === 0) return null;

  const first = batchLogs[0];
  const issuedOps = batchLogs.filter((o) => !o.damagedReturn);
  const damagedOps = batchLogs.filter((o) => o.damagedReturn);
  const totalIssuedQty = issuedOps.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);

  const docTypeName =
    first.type === 'وارد'
      ? 'سند توريد مخزني'
      : first.type === 'تحويل'
      ? 'أمر تحويل بين المخازن'
      : 'سند صرف عهدة';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white text-slate-900 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden my-6 border border-slate-300">
        
        {/* Controls Header (Hidden during actual print) */}
        <div className="no-print bg-slate-900 text-white p-3 sm:p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base sm:text-lg">معاينة السند الرسمي للطباعة والتصدير</span>
            <span className="font-mono bg-blue-600 px-2 py-0.5 rounded text-xs text-white">{batchId}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة A4</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Formal Document Body */}
        <div id="print_zone" className="p-6 sm:p-10 bg-white min-h-[297mm] text-slate-900 selection:bg-slate-200">
          
          {/* Header */}
          <div className="flex justify-between items-center pb-5 border-b-2 border-slate-900 mb-6 gap-4">
            <div className="text-right flex-1">
              <h1 className="text-2xl font-black text-slate-900 mb-1">{config.sysName || 'يمن لاند'}</h1>
              <p className="text-xs font-semibold text-slate-600">{config.printAddress || 'إدارة العهد والمخازن'}</p>
            </div>

            <div className="text-center flex-1 flex justify-center">
              {config.logoBase64 ? (
                <img
                  src={config.logoBase64}
                  alt="شعار المؤسسة"
                  className="max-h-20 max-w-[130px] object-contain"
                />
              ) : (
                <div className="w-24 h-16 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-xs text-slate-400">
                  شعار المؤسسة
                </div>
              )}
            </div>

            <div className="text-left flex-1 text-xs text-slate-700 font-semibold leading-relaxed">
              <div>التاريخ: <span className="font-bold text-slate-900">{first.date}</span></div>
              <div>رقم المرجع: <span className="font-mono font-bold text-blue-800 text-sm">{first.batchId}</span></div>
              {first.docNo && <div>رقم المستند: <span className="font-mono font-bold">{first.docNo}</span></div>}
            </div>
          </div>

          {/* Document Title Banner */}
          <div className="text-center bg-slate-900 text-white py-2 px-4 rounded font-extrabold text-lg sm:text-xl tracking-wide mb-6">
            {docTypeName}
          </div>

          {/* Parties & Operations Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm mb-6">
            <div>
              <span className="text-slate-500 font-bold">الطرف الأول (المُسَلِّم): </span>
              <span className="font-bold text-slate-800">
                {first.type === 'وارد' ? (first.emp || 'المورد') : first.store}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-bold">الطرف الثاني (المُستلِم): </span>
              <span className="font-bold text-slate-800">
                {first.type === 'تحويل' ? first.toStore : (first.type === 'وارد' ? first.store : first.recipient)}
              </span>
            </div>

            {first.type === 'منصرف' && (
              <>
                <div>
                  <span className="text-slate-500 font-bold">اسم المستلم الفعلي: </span>
                  <span className="font-bold text-slate-800">{first.receiverName || 'غير مدخل'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold">نوع الصرف: </span>
                  <span className="font-bold text-blue-700">{first.issueSubtype || 'صرف إضافي'}</span>
                </div>
              </>
            )}

            {first.emp && first.type !== 'وارد' && (
              <div>
                <span className="text-slate-500 font-bold">المعتمد / الموجّه: </span>
                <span className="font-bold text-slate-800">{first.emp}</span>
              </div>
            )}

            {first.notes && (
              <div className="sm:col-span-2">
                <span className="text-slate-500 font-bold">ملاحظات: </span>
                <span className="text-slate-800">{first.notes}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse text-xs sm:text-sm border border-slate-300">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="border border-slate-900 p-2.5 text-center w-10">م</th>
                  <th className="border border-slate-900 p-2.5 text-right">الصنف والبيان</th>
                  <th className="border border-slate-900 p-2.5 text-center font-mono">الرقم العملياتي (S/N)</th>
                  <th className="border border-slate-900 p-2.5 text-center w-20">الكمية</th>
                  <th className="border border-slate-900 p-2.5 text-center w-24">الحالة</th>
                  <th className="border border-slate-900 p-2.5 text-right">الملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {batchLogs.map((entry, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="border border-slate-300 p-2.5 text-center font-bold">{idx + 1}</td>
                    <td className="border border-slate-300 p-2.5 text-right font-semibold">
                      {entry.item}
                      {entry.damagedReturn && (
                        <div className="text-[11px] text-amber-700 font-bold">
                          [تالف مرتجع إلى مخزن التالف]
                        </div>
                      )}
                      {entry.recipient && entry.recipient.includes('(مرتجع') && (
                        <div className="text-[11px] text-red-600 font-semibold">{entry.recipient}</div>
                      )}
                    </td>
                    <td className="border border-slate-300 p-2.5 text-center font-mono font-bold text-slate-800">
                      {entry.sn}
                    </td>
                    <td className="border border-slate-300 p-2.5 text-center font-bold text-slate-900">
                      {entry.qty}
                    </td>
                    <td className="border border-slate-300 p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        entry.cond === 'جديد'
                          ? 'bg-emerald-100 text-emerald-800'
                          : entry.cond === 'تالف'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {entry.cond}
                      </span>
                    </td>
                    <td className="border border-slate-300 p-2.5 text-right text-slate-600">
                      {entry.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary stats */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 mb-8">
            <div>عدد البنود: <span className="font-bold text-slate-900">{issuedOps.length}</span></div>
            <div>إجمالي الكمية المسلمة: <span className="font-bold text-slate-900">{totalIssuedQty}</span></div>
            {damagedOps.length > 0 && (
              <div>التالف المسترجع: <span className="font-bold text-red-700">{damagedOps.length} صنف</span></div>
            )}
            <div>حالة التسجيل: <span className="text-emerald-700 font-bold">معتمد ومحفوظ بذاكرة الجهاز</span></div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-6 pt-10 text-center text-xs sm:text-sm font-bold text-slate-800">
            <div className="border-t border-slate-400 pt-3">
              <div>مسؤول التوجيه / الاعتماد</div>
              <div className="mt-8 text-slate-400 font-normal">........................</div>
            </div>
            <div className="border-t border-slate-400 pt-3">
              <div>أمين المخزن</div>
              <div className="mt-8 text-slate-400 font-normal">........................</div>
            </div>
            <div className="border-t border-slate-400 pt-3">
              <div>المستلم</div>
              <div className="mt-8 text-slate-400 font-normal">........................</div>
            </div>
          </div>

          {/* Attached Order Image if present */}
          {first.orderImage && (
            <div className="mt-8 pt-6 border-t border-dashed border-slate-300 text-center">
              <div className="text-xs font-bold text-slate-600 mb-2">صورة سند / أمر الصرف المرفقة من الهاتف:</div>
              <img
                src={first.orderImage}
                alt="صورة أمر الصرف"
                className="max-h-64 mx-auto border border-slate-300 rounded shadow-sm object-contain"
              />
            </div>
          )}

          {/* Document Footer */}
          <div className="mt-12 pt-4 border-t border-slate-200 text-center text-[11px] text-slate-500">
            <p>إدارة الاتصالات.</p>
            <p className="mt-0.5">
              اعداد. المساعد اول. <strong className="text-slate-800">علي العثماني</strong> &nbsp;|&nbsp; جميع الحقوق محفوظة
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
