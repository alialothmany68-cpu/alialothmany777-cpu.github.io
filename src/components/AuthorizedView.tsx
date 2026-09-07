import React, { useState } from 'react';
import { Users, Plus, Trash2, ShieldCheck, Search } from 'lucide-react';
import { AppData } from '../types';

interface Props {
  data: AppData;
  onAddAuthorized: (name: string) => void;
  onRemoveAuthorized: (index: number) => void;
}

export const AuthorizedView: React.FC<Props> = ({
  data,
  onAddAuthorized,
  onRemoveAuthorized,
}) => {
  const [newName, setNewName] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const handleAdd = () => {
    const val = newName.trim();
    if (!val) {
      alert('يرجى كتابة اسم الجهة أو الشخص المعتمد');
      return;
    }
    if (data.authorized.includes(val)) {
      alert('هذه الجهة مسجلة مسبقاً في قاعدة البيانات!');
      return;
    }
    onAddAuthorized(val);
    setNewName('');
  };

  const handleRemove = (idx: number) => {
    const target = data.authorized[idx];
    const isUsed = data.logs.some((l) => l.recipient === target || l.emp === target);
    if (isUsed) {
      if (
        !confirm(
          `تنبيه: الجهة "${target}" مرتبطة بعمليات سابقة في السجل. هل أنت متأكد تماماً من حذفها من قائمة الاختيارات؟`
        )
      ) {
        return;
      }
    } else {
      if (!confirm(`هل تريد حذف "${target}" من قائمة المخولين؟`)) return;
    }
    onRemoveAuthorized(idx);
  };

  const filtered = data.authorized.filter((a) =>
    a.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  return (
    <div className="space-y-6">
      
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>إدارة الجهات والمخولين بالاستلام والتوريد</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            قاعدة بيانات معتمدة للجهات والأشخاص المصرح لهم استلام أو توريد العهد (تمنع الصرف لأي جهة غير معتمدة).
          </p>
        </div>

        {/* Input box */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            placeholder="اكتب اسم الجهة / القسم / الحساب / الشخص المصرح..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-hidden"
          />
          <button
            onClick={handleAdd}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة إلى قاعدة البيانات</span>
          </button>
        </div>
      </div>

      {/* List Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <span className="font-bold text-slate-900 text-sm sm:text-base">
            الجهات المعتمدة حالياً ({data.authorized.length} جهة)
          </span>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="تصفية الجهات..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full p-1.5 pr-7 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute top-2 right-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((authName, idx) => {
            const originalIndex = data.authorized.indexOf(authName);
            const opCount = data.logs.filter((l) => l.recipient === authName).length;

            return (
              <div
                key={authName}
                className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg flex items-center justify-between gap-2 transition"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                      {authName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {opCount > 0 ? `${opCount} عملية عهدة مسجلة` : 'لا توجد عمليات بعد'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRemove(originalIndex)}
                  className="text-rose-600 hover:text-rose-800 p-1.5 rounded hover:bg-rose-50 transition cursor-pointer"
                  title="حذف من المعتمدين"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
