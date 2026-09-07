import React from 'react';
import { TrendingUp, ArrowDownLeft, ArrowUpRight, Repeat, Package, ShieldAlert } from 'lucide-react';
import { AppData } from '../types';

interface Props {
  data: AppData;
}

export const AnalyticsView: React.FC<Props> = ({ data }) => {
  const totalOps = data.logs.filter((l) => !l.damagedReturn).length;
  const inOps = data.logs.filter((l) => l.type === 'وارد' && !l.damagedReturn).length;
  const outOps = data.logs.filter((l) => l.type === 'منصرف').length;
  const transferOps = data.logs.filter((l) => l.type === 'تحويل').length;

  // Calculate item balances
  const itemStats = data.items.map((item) => {
    let stockTotal = 0;
    let custodyTotal = 0;

    if (item.hasSN === 'yes') {
      const snLocs: Record<string, 'وارد' | 'منصرف' | 'تحويل'> = {};
      data.logs.forEach((l) => {
        if (l.item === item.name) {
          snLocs[l.sn] = l.type;
        }
      });
      Object.values(snLocs).forEach((type) => {
        if (type === 'وارد' || type === 'تحويل') stockTotal++;
        else if (type === 'منصرف') custodyTotal++;
      });
    } else {
      data.logs.forEach((l) => {
        if (l.item === item.name) {
          const qty = Number(l.qty) || 0;
          if (l.type === 'وارد') stockTotal += qty;
          if (l.type === 'منصرف') {
            custodyTotal += qty;
            stockTotal -= qty;
          }
          if (l.type === 'تحويل') {
            // Internal move between stores keeps overall stock same
          }
        }
      });
    }

    return {
      name: item.name,
      hasSN: item.hasSN,
      stockTotal: Math.max(0, stockTotal),
      custodyTotal: Math.max(0, custodyTotal),
    };
  });

  return (
    <div className="space-y-6">
      
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">إجمالي العمليات</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{totalOps}</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">أوامر التوريد</div>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">{inOps}</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">أوامر الصرف والعهد</div>
            <div className="text-2xl font-black text-rose-600 mt-0.5">{outOps}</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Repeat className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">حركات التحويل</div>
            <div className="text-2xl font-black text-amber-600 mt-0.5">{transferOps}</div>
          </div>
        </div>
      </div>

      {/* Item Stock Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">الأرصدة المتوفرة في المخازن والعهد</h3>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-semibold">
            {itemStats.length} صنف مسجل
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">الصنف</th>
                <th className="p-3.5">نظام التتبع</th>
                <th className="p-3.5 text-center">الرصيد المتوفر بالمخازن</th>
                <th className="p-3.5 text-center">مصروف كعهدة خارجية</th>
                <th className="p-3.5 text-center">إجمالي الكمية الكلية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {itemStats.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition">
                  <td className="p-3.5 font-bold text-slate-900">{item.name}</td>
                  <td className="p-3.5">
                    {item.hasSN === 'yes' ? (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                        سيريال (S/N)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                        كمية عددية
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-center font-extrabold text-emerald-600 text-sm sm:text-base">
                    {item.stockTotal}
                  </td>
                  <td className="p-3.5 text-center font-bold text-rose-600 text-sm sm:text-base">
                    {item.custodyTotal}
                  </td>
                  <td className="p-3.5 text-center font-bold text-slate-800">
                    {item.stockTotal + item.custodyTotal}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
