import React, { useState } from 'react';
import { History, Search, Printer, Edit3, Trash2, FileSpreadsheet, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AppData, LogEntry } from '../types';

interface Props {
  data: AppData;
  onEditBatch: (batchId: string) => void;
  onDeleteBatch: (batchId: string) => void;
  onOpenPrint: (batchId: string) => void;
}

export const LogsView: React.FC<Props> = ({
  data,
  onEditBatch,
  onDeleteBatch,
  onOpenPrint,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  let filtered = data.logs.filter((l) => !l.damagedReturn).reverse();

  if (typeFilter !== 'all') {
    filtered = filtered.filter((l) => l.type === typeFilter);
  }
  if (dateFrom) {
    filtered = filtered.filter((l) => l.date >= dateFrom);
  }
  if (dateTo) {
    filtered = filtered.filter((l) => l.date <= dateTo);
  }
  if (searchTerm.trim()) {
    const q = searchTerm.toLowerCase().trim();
    filtered = filtered.filter(
      (l) =>
        l.batchId.toLowerCase().includes(q) ||
        l.item.toLowerCase().includes(q) ||
        (l.sn && l.sn.toLowerCase().includes(q)) ||
        (l.recipient && l.recipient.toLowerCase().includes(q)) ||
        (l.receiverName && l.receiverName.toLowerCase().includes(q)) ||
        (l.store && l.store.toLowerCase().includes(q))
    );
  }

  // Group by batchId for clean grouped overview if not searching single items
  const batchesGrouped: Record<string, LogEntry[]> = {};
  filtered.forEach((l) => {
    if (!batchesGrouped[l.batchId]) {
      batchesGrouped[l.batchId] = [];
    }
    batchesGrouped[l.batchId].push(l);
  });

  const batchList = Object.values(batchesGrouped);

  const handleExportExcel = () => {
    const rows = filtered.map((l, idx) => ({
      'م': idx + 1,
      'رقم المرجع': l.batchId,
      'التاريخ': l.date,
      'نوع العملية': l.type,
      'الصنف': l.item,
      'الرقم العملياتي (S/N)': l.sn,
      'الكمية': l.qty,
      'الحالة': l.cond,
      'المخزن المصدر': l.store,
      'المستلم / الوجهة': l.type === 'تحويل' ? l.toStore : l.recipient,
      'اسم المستلم الفعلي': l.receiverName || '',
      'رقم المستند': l.docNo || '',
      'المعتمد': l.emp || '',
      'ملاحظات': l.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'سجل العمليات');
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `سجل_العمليات_المخزنية_${dateStr}.xlsx`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              <span>سجل العمليات التاريخي والبحث والتقارير</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              استعراض وتعديل وطباعة أي عملية مسجلة في ذاكرة الهاتف
            </p>
          </div>

          <button
            onClick={handleExportExcel}
            className="no-print inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير السجل إكسل</span>
          </button>
        </div>

        {/* Big Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 ابحث برقم العملية المرجعي (مثال: REF-1001) أو السيريال أو الصنف أو اسم المستلم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pr-10 bg-slate-50 border-2 border-blue-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden transition"
          />
          <Search className="w-5 h-5 text-blue-500 absolute top-3.5 right-3" />
        </div>

        {/* Filters */}
        <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">نوع العملية</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
              <option value="all">جميع العمليات (الكل)</option>
              <option value="وارد">📥 الوارد والتوريد</option>
              <option value="منصرف">📤 المنصرف والعهد</option>
              <option value="تحويل">🔀 التحويل بين المخازن</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">من تاريخ</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">إلى تاريخ</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <span className="font-bold text-slate-900 text-sm sm:text-base">
            العمليات المسجلة ({batchList.length} حركة مخزنية)
          </span>
          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-semibold">
            {filtered.length} بند
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">الرقم المرجعي</th>
                <th className="p-3 text-center">التاريخ</th>
                <th className="p-3 text-center">النوع</th>
                <th className="p-3">الأصناف والكميات</th>
                <th className="p-3 text-center">الأرقام العملياتية (S/N)</th>
                <th className="p-3">المسار / التوجيه</th>
                <th className="no-print p-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {batchList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    لا توجد عمليات مسجلة تطابق بحثك
                  </td>
                </tr>
              ) : (
                batchList.map((batch) => {
                  const first = batch[0];
                  const itemsSummary = batch.map((l) => `${l.item} (${l.qty})`).join('، ');
                  const serials = batch
                    .map((l) => l.sn)
                    .filter((sn) => sn && sn !== 'بدون سيريال')
                    .join(' | ');

                  const badgeColor =
                    first.type === 'وارد'
                      ? 'bg-emerald-100 text-emerald-800'
                      : first.type === 'منصرف'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800';

                  const pathDesc =
                    first.type === 'وارد'
                      ? `إلى: ${first.store}`
                      : first.type === 'تحويل'
                      ? `من ${first.store} إلى ${first.toStore}`
                      : `إلى: ${first.recipient}${first.receiverName ? ` (${first.receiverName})` : ''}`;

                  return (
                    <tr key={first.batchId} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-blue-700">
                        <span className="bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {first.batchId}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono text-slate-600 text-xs">
                        {first.date}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeColor}`}>
                          {first.type}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-900 max-w-xs truncate">
                        {itemsSummary}
                      </td>
                      <td className="p-3 text-center font-mono text-xs text-slate-700 max-w-[160px] truncate">
                        {serials || <span className="text-slate-400">بدون سيريال</span>}
                      </td>
                      <td className="p-3 text-slate-700 text-xs font-semibold max-w-xs truncate">
                        {pathDesc}
                      </td>
                      <td className="no-print p-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => onOpenPrint(first.batchId)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition cursor-pointer"
                            title="طباعة السند الرسمي A4"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditBatch(first.batchId)}
                            className="p-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs transition cursor-pointer"
                            title="تعديل العملية"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteBatch(first.batchId)}
                            className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs transition cursor-pointer"
                            title="حذف العملية"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
