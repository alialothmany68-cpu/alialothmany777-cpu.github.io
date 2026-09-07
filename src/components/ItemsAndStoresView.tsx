import React, { useState } from 'react';
import { Package, Warehouse, Plus, Trash2, Tag, ShieldCheck } from 'lucide-react';
import { AppData, ItemDef } from '../types';

interface Props {
  data: AppData;
  onAddStore: (name: string) => void;
  onRemoveStore: (index: number) => void;
  onAddItem: (item: ItemDef) => void;
  onRemoveItem: (index: number) => void;
}

export const ItemsAndStoresView: React.FC<Props> = ({
  data,
  onAddStore,
  onRemoveStore,
  onAddItem,
  onRemoveItem,
}) => {
  const [newStoreName, setNewStoreName] = useState<string>('');
  const [newItemName, setNewItemName] = useState<string>('');
  const [hasSN, setHasSN] = useState<'yes' | 'no'>('yes');

  const handleAddStore = () => {
    const val = newStoreName.trim();
    if (!val) return alert('اكتب اسم المخزن أولاً');
    if (data.stores.includes(val)) return alert('هذا المخزن موجود مسبقاً');
    onAddStore(val);
    setNewStoreName('');
  };

  const handleAddItem = () => {
    const val = newItemName.trim();
    if (!val) return alert('اكتب اسم الصنف أو الجهاز أولاً');
    if (data.items.some((i) => i.name === val)) return alert('هذا الصنف معرف مسبقاً');
    onAddItem({ name: val, hasSN });
    setNewItemName('');
  };

  const handleRemoveStore = (index: number) => {
    const store = data.stores[index];
    if (store === 'مخزن التالف') {
      alert('مخزن التالف أساسي في النظام لاستقبال التالف المرتجع ولا يمكن حذفه.');
      return;
    }
    if (data.stores.length <= 1) {
      alert('لا يمكن حذف آخر مخزن في النظام.');
      return;
    }
    const isUsed = data.logs.some((l) => l.store === store || l.toStore === store);
    if (isUsed) {
      alert('لا يمكن حذف هذا المخزن لأنه مرتبط بعمليات مسجلة سابقة. يمكنك تركه محفوظاً للأرشيف.');
      return;
    }
    if (confirm(`هل تريد حذف المخزن "${store}"؟`)) {
      onRemoveStore(index);
    }
  };

  const handleRemoveItem = (index: number) => {
    const item = data.items[index];
    const isUsed = data.logs.some((l) => l.item === item.name);
    if (isUsed) {
      alert('لا يمكن حذف هذا الصنف لأنه مرتبط بعمليات مسجلة سابقة. يمكنك تركه محفوظاً للأرشيف.');
      return;
    }
    if (confirm(`هل تريد حذف الصنف "${item.name}"؟`)) {
      onRemoveItem(index);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Stores Management */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
          <Warehouse className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-base sm:text-lg">إدارة المخازن والمستودعات</h3>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="اسم المخزن الجديد..."
            value={newStoreName}
            onChange={(e) => setNewStoreName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddStore()}
            className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-hidden"
          />
          <button
            onClick={handleAddStore}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مخزن</span>
          </button>
        </div>

        <div className="space-y-2 mt-4">
          <span className="text-xs font-bold text-slate-500 block">
            المخازن الحالية ({data.stores.length} مخزن)
          </span>
          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {data.stores.map((store, idx) => {
              const count = data.logs.filter((l) => l.store === store || l.toStore === store).length;
              const isProtected = store === 'مخزن التالف';

              return (
                <div
                  key={store}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-4 h-4 text-slate-600" />
                    <div>
                      <span className="font-bold text-slate-800 text-xs sm:text-sm">{store}</span>
                      {isProtected && (
                        <span className="mr-2 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                          أساسي للنظام
                        </span>
                      )}
                      <div className="text-[11px] text-slate-500">{count} عملية مسجلة</div>
                    </div>
                  </div>

                  {!isProtected && (
                    <button
                      onClick={() => handleRemoveStore(idx)}
                      className="text-rose-600 hover:text-rose-800 p-1.5 rounded hover:bg-rose-50 transition cursor-pointer"
                      title="حذف المخزن"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Items Management */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
          <Package className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-base sm:text-lg">إدارة وتعريف الأصناف</h3>
        </div>

        <div className="space-y-2">
          <input
            type="text"
            placeholder="اسم الجهاز أو الصنف الجديد..."
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-hidden"
          />
          <div className="flex items-center gap-2">
            <select
              value={hasSN}
              onChange={(e) => setHasSN(e.target.value as 'yes' | 'no')}
              className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold"
            >
              <option value="yes">يوجد رقم تسلسلي (S/N مطلوب)</option>
              <option value="no">بدون رقم تسلسلي (صرف بالعدد والكمية)</option>
            </select>
            <button
              onClick={handleAddItem}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة الصنف</span>
            </button>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <span className="text-xs font-bold text-slate-500 block">
            الأصناف المعرفة ({data.items.length} صنف)
          </span>
          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {data.items.map((item, idx) => {
              const opCount = data.logs.filter((l) => l.item === item.name).length;

              return (
                <div
                  key={item.name}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="font-bold text-slate-800 text-xs sm:text-sm">{item.name}</span>
                      <span className="mr-2 text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-semibold">
                        {item.hasSN === 'yes' ? 'يتطلب سيريال (S/N)' : 'كمية عددية'}
                      </span>
                      <div className="text-[11px] text-slate-500">{opCount} عملية مسجلة</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveItem(idx)}
                    className="text-rose-600 hover:text-rose-800 p-1.5 rounded hover:bg-rose-50 transition cursor-pointer"
                    title="حذف الصنف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};
