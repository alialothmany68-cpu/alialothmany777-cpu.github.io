import React, { useState } from 'react';
import { FileSpreadsheet, Printer, Filter, Calendar, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AppData, LogEntry } from '../types';

interface Props {
  data: AppData;
}

export const InventoryView: React.FC<Props> = ({ data }) => {
  const [filterLoc, setFilterLoc] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Calculate latest location of each item / SN
  const latestMap: Record<string, LogEntry> = {};

  data.logs.forEach((l) => {
    const key =
      l.sn && l.sn !== 'بدون سيريال'
        ? l.sn
        : `${l.item}-${l.type === 'منصرف' ? l.recipient : l.type === 'تحويل' ? l.toStore : l.store}`;

    latestMap[key] = { ...l };
    if (l.type === 'تحويل' && l.toStore) {
      latestMap[key].store = l.toStore;
    }
  });

  let inventoryList = Object.values(latestMap);

  // Filter by location
  if (filterLoc === 'custody') {
    inventoryList = inventoryList.filter((l) => l.type === 'منصرف');
  } else if (filterLoc !== 'all') {
    inventoryList = inventoryList.filter(
      (l) => (l.type === 'وارد' || l.type === 'تحويل') && l.store === filterLoc
    );
  }

  // Filter by date
  if (dateFrom) {
    inventoryList = inventoryList.filter((l) => l.date >= dateFrom);
  }
  if (dateTo) {
    inventoryList = inventoryList.filter((l) => l.date <= dateTo);
  }

  // Filter by search query
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    inventoryList = inventoryList.filter(
      (l) =>
        l.item.toLowerCase().includes(q) ||
        (l.sn && l.sn.toLowerCase().includes(q)) ||
        (l.recipient && l.recipient.toLowerCase().includes(q)) ||
        (l.store && l.store.toLowerCase().includes(q))
    );
  }

  // Export to Excel file saved into phone memory
  const handleExportExcel = () => {
    const exportRows = inventoryList.map((l, idx) => ({
      'م': idx + 1,
      'الصنف': l.item,
      'الرقم العملياتي (S/N)': l.sn,
      'الحالة': l.cond,
      'الكمية': l.qty,
      'الموقع الحالي / المستلم': l.type === 'منصرف' ? `عهدة: ${l.recipient}` : `مخزن: ${l.store}`,
      'آخر تاريخ عملية': l.date,
      'رقم المرجع': l.batchId,
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الجرد والمخزون');
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `تقرير_الجرد_والمخزون_${dateStr}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600" />
              <span>الجرد العام والمخزون والفلترة المتقدمة</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              تصفية دقيقة للمخزون والعهد الحالية وتصديرها بصيغة Excel أو طباعتها
            </p>
          </div>

          <div className="no-print flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
              title="تصدير جدول الجرد بصيغة ملف إكسل إلى هاتفك"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير إكسل</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة A4</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الموقع / الحالة</label>
            <select
              value={filterLoc}
              onChange={(e) => setFilterLoc(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
              <option value="all">الكل (المخازن والعهد معاً)</option>
              <option value="custody">عهد خارجية فقط (لدى المستلمين)</option>
              <optgroup label="المخازن المتاحة">
                {data.stores.map((s) => (
                  <option key={s} value={s}>
                    🏢 مخزن: {s}
                  </option>
                ))}
              </optgroup>
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">بحث سريع</label>
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث بالصنف أو السيريال..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 pr-8 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
              <Search className="w-4 h-4 text-slate-400 absolute top-2.5 right-2" />
            </div>
          </div>

        </div>
      </div>

      {/* Inventory Table Container */}
      <div id="inv_table_container" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Printable Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="font-bold text-slate-900 text-sm sm:text-base">
            سجلات الجرد الحالية ({inventoryList.length} سجل متوفر)
          </div>
          <div className="text-xs text-slate-500">
            {data.config.sysName} - {data.config.printAddress}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">الصنف</th>
                <th className="p-3 text-center">السيريال (S/N)</th>
                <th className="p-3 text-center">الحالة</th>
                <th className="p-3 text-center">الكمية</th>
                <th className="p-3">الموقع الحالي / المستلم</th>
                <th className="p-3 text-center">آخر تحديث</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {inventoryList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    لا توجد أصناف تطابق معايير الفلترة المحددة
                  </td>
                </tr>
              ) : (
                inventoryList.map((l, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900">{l.item}</td>
                    <td className="p-3 text-center font-mono font-bold text-slate-800">
                      <span className="bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                        {l.sn}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          l.cond === 'جديد'
                            ? 'bg-emerald-100 text-emerald-800'
                            : l.cond === 'تالف'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {l.cond}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-900 text-sm">{l.qty}</td>
                    <td className="p-3">
                      {l.type === 'منصرف' ? (
                        <div className="flex items-center gap-1.5 font-bold text-rose-700">
                          <span>👤 عهدة لدى:</span>
                          <span>{l.recipient}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 font-bold text-blue-800">
                          <span>🏢 مخزن:</span>
                          <span>{l.store}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center text-slate-500 font-mono text-xs">{l.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
