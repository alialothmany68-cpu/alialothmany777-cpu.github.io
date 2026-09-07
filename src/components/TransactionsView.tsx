import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, Camera, CheckCircle, AlertTriangle, ArrowRightLeft,
  PackagePlus, Send, X, RefreshCw, Printer, AlertCircle, Check
} from 'lucide-react';
import { AppData, LogEntry, TempBatchItem, DamagedBatchItem } from '../types';
import { compressImage } from '../lib/phoneStorage';

interface Props {
  data: AppData;
  onSaveBatch: (
    newLogs: LogEntry[],
    batchId: string,
    isEdit: boolean,
    oldBatchId?: string
  ) => void;
  editingBatch: LogEntry[] | null;
  onCancelEdit: () => void;
  onOpenPrint: (batchId: string) => void;
}

export const TransactionsView: React.FC<Props> = ({
  data,
  onSaveBatch,
  editingBatch,
  onCancelEdit,
  onOpenPrint,
}) => {
  const [opType, setOpType] = useState<'وارد' | 'منصرف' | 'تحويل'>('منصرف');
  const [store, setStore] = useState<string>(data.stores[0] || '');
  const [toStore, setToStore] = useState<string>('');
  const [subType, setSubType] = useState<'مشتريات' | 'مرتجع'>('مشتريات');
  const [returnFrom, setReturnFrom] = useState<string>('');
  const [recipient, setRecipient] = useState<string>('');
  const [receiverName, setReceiverName] = useState<string>('');
  const [issueSubtype, setIssueSubtype] = useState<'اضافي' | 'بدل تالف'>('اضافي');
  const [docNo, setDocNo] = useState<string>('');
  const [dateVal, setDateVal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [emp, setEmp] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [orderImage, setOrderImage] = useState<string>('');

  // Item form states
  const [selectedItem, setSelectedItem] = useState<string>(() => data.items[0]?.name || '');
  const [snInput, setSnInput] = useState<string>('');
  const [qtyInput, setQtyInput] = useState<number>(1);
  const [condInput, setCondInput] = useState<'جديد' | 'مستخدم' | 'تالف'>('جديد');
  const [allowNoSN, setAllowNoSN] = useState<boolean>(false);

  // In-UI error and confirmation feedback
  const [itemError, setItemError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [damagedError, setDamagedError] = useState<string | null>(null);
  const [stockWarning, setStockWarning] = useState<{
    message: string;
    action: () => void;
  } | null>(null);
  const [savedSuccessBatchId, setSavedSuccessBatchId] = useState<string | null>(null);

  // Damaged items for "بدل تالف"
  const [damagedItem, setDamagedItem] = useState<string>(() => data.items[0]?.name || '');
  const [damagedSn, setDamagedSn] = useState<string>('');
  const [damagedQty, setDamagedQty] = useState<number>(1);
  const [damagedCond, setDamagedCond] = useState<'جديد' | 'مستخدم' | 'تالف'>('تالف');
  const [damagedNotes, setDamagedNotes] = useState<string>('');
  const [damagedBatch, setDamagedBatch] = useState<DamagedBatchItem[]>([]);

  // Main batch
  const [tempBatch, setTempBatch] = useState<TempBatchItem[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Auto-dismiss status messages
  useEffect(() => {
    if (statusMessage) {
      const t = setTimeout(() => setStatusMessage(null), 4500);
      return () => clearTimeout(t);
    }
  }, [statusMessage]);

  useEffect(() => {
    if (itemError) {
      const t = setTimeout(() => setItemError(null), 6000);
      return () => clearTimeout(t);
    }
  }, [itemError]);

  // Initialize or handle edit mode
  useEffect(() => {
    if (editingBatch && editingBatch.length > 0) {
      const first = editingBatch[0];
      setOpType(first.type);
      setStore(first.store || (data.stores[0] || ''));
      setToStore(first.toStore || '');
      setSubType((first.sub as 'مشتريات' | 'مرتجع') || 'مشتريات');
      setRecipient(first.recipient || '');
      setReceiverName(first.receiverName || '');
      setIssueSubtype((first.issueSubtype as 'اضافي' | 'بدل تالف') || 'اضافي');
      setDocNo(first.docNo || '');
      setDateVal(first.date || new Date().toISOString().split('T')[0]);
      setEmp(first.emp || '');
      setNotes(first.notes || '');
      setOrderImage(first.orderImage || '');

      const regularItems = editingBatch.filter((l) => !l.damagedReturn).map((l) => ({
        item: l.item,
        sn: l.sn,
        qty: Number(l.qty) || 1,
        cond: l.cond,
        returnFrom: l.recipient?.startsWith('(مرتجع من: ')
          ? l.recipient.replace('(مرتجع من: ', '').replace(')', '')
          : '',
      }));
      setTempBatch(regularItems);

      const damaged = editingBatch.filter((l) => l.damagedReturn).map((l) => ({
        item: l.item,
        sn: l.sn,
        qty: Number(l.qty) || 1,
        cond: l.cond,
        notes: l.notes,
      }));
      setDamagedBatch(damaged);
    } else {
      if (data.stores.length > 0 && !store) {
        setStore(data.stores[0]);
      }
      if (data.items.length > 0 && !selectedItem) {
        setSelectedItem(data.items[0].name);
        setDamagedItem(data.items[0].name);
      }
    }
  }, [editingBatch, data.stores, data.items]);

  // Set default items if none selected
  useEffect(() => {
    if (data.items.length > 0 && !selectedItem) {
      setSelectedItem(data.items[0].name);
      setDamagedItem(data.items[0].name);
    }
    if (data.stores.length > 0 && !store) {
      setStore(data.stores[0]);
    }
  }, [data.items, data.stores, selectedItem, store]);

  // Handle SN disabled state
  const currentItemDef = data.items.find((i) => i.name === (selectedItem || data.items[0]?.name));
  const isSNRequired = currentItemDef?.hasSN === 'yes' && !allowNoSN;

  const damagedItemDef = data.items.find((i) => i.name === (damagedItem || data.items[0]?.name));
  const isDamagedSNRequired = damagedItemDef?.hasSN === 'yes';

  // Validation helper: SN status in logs
  const getSNStatus = (sn: string) => {
    const editBatchId = editingBatch?.[0]?.batchId;
    const logsReversed = [...data.logs].reverse();
    const lastLog = logsReversed.find(
      (l) => l.sn === sn && (!editBatchId || l.batchId !== editBatchId)
    );
    if (!lastLog) return { status: 'not_found' as const };
    if (lastLog.type === 'وارد') return { status: 'in_stock' as const, store: lastLog.store };
    if (lastLog.type === 'تحويل') return { status: 'in_stock' as const, store: lastLog.toStore || lastLog.store };
    if (lastLog.type === 'منصرف') return { status: 'issued' as const, recipient: lastLog.recipient };
    return { status: 'not_found' as const };
  };

  // Helper: Non-SN available balance in store
  const getNonSNBalance = (storeName: string, itemName: string) => {
    const editBatchId = editingBatch?.[0]?.batchId;
    let balance = 0;
    data.logs.forEach((l) => {
      if (editBatchId && l.batchId === editBatchId) return;
      if (l.item === itemName) {
        const q = Number(l.qty) || 0;
        if (l.type === 'وارد' && l.store === storeName) balance += q;
        if (l.type === 'منصرف' && l.store === storeName) balance -= q;
        if (l.type === 'تحويل') {
          if (l.store === storeName) balance -= q;
          if (l.toStore === storeName) balance += q;
        }
      }
    });
    return Math.max(0, balance);
  };

  // Image Upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file, 1200, 0.78);
      setOrderImage(base64);
      setStatusMessage({ text: 'تم التقاط وضغط صورة أمر الصرف وحفظها مؤقتاً بنجاح', type: 'success' });
    } catch {
      setStatusMessage({ text: 'تعذر معالجة الصورة، يرجى المحاولة بصورة أخرى', type: 'error' });
    }
  };

  // Direct addition to batch
  const addItemDirectly = (
    itemName: string,
    snVal: string,
    qtyVal: number,
    condVal: 'جديد' | 'مستخدم' | 'تالف'
  ) => {
    setTempBatch((prev) => [
      ...prev,
      {
        item: itemName,
        sn: snVal,
        qty: qtyVal,
        cond: condVal,
        returnFrom: opType === 'وارد' && subType === 'مرتجع' ? returnFrom : undefined,
      },
    ]);
    setSnInput('');
    setItemError(null);
    setStockWarning(null);
    setStatusMessage({
      text: `تمت إضافة الصنف "${itemName}" إلى القائمة المجهزة بنجاح`,
      type: 'success',
    });
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  // Add Item to Main Batch
  const handleAddToBatch = () => {
    setItemError(null);
    setStockWarning(null);

    const effectiveItem = selectedItem || data.items[0]?.name;
    if (!effectiveItem) {
      setItemError('يرجى اختيار أو تعريف صنف أولاً من قسم الأصناف والمخازن.');
      return;
    }
    if (!qtyInput || qtyInput < 1) {
      setItemError('أدخل كمية صحيحة أكبر من صفر.');
      return;
    }
    const currentStore = store || data.stores[0] || '';
    if (opType === 'تحويل' && currentStore === toStore) {
      setItemError('لا يمكن التحويل لنفس المخزن! يرجى اختيار مخزن وجهة مختلف.');
      return;
    }

    const requiresSN = isSNRequired;
    const sn = requiresSN ? snInput.trim() : 'بدون سيريال';

    if (requiresSN) {
      if (!sn) {
        setItemError('الرقم العملياتي (S/N) مطلوب لهذا الصنف، أو اضغط زر "+ بدون سيريال" لتسجيله ككمية عادية.');
        return;
      }
      if (tempBatch.some((b) => b.sn === sn)) {
        setItemError(`السيريال (${sn}) موجود بالفعل في القائمة الحالية المجهزة!`);
        return;
      }

      const snData = getSNStatus(sn);

      if (opType === 'منصرف' || opType === 'تحويل') {
        if (snData.status !== 'in_stock') {
          const reason =
            snData.status === 'issued'
              ? `مصروف سابقاً للجهة (${snData.recipient})`
              : 'غير مسجل في رصيد المخازن المسبق';
          setStockWarning({
            message: `السيريال (${sn}) ${reason}. هل ترغب في تجاوز التنبيه وإضافته للقائمة على أي حال؟`,
            action: () => addItemDirectly(effectiveItem, sn, 1, condInput),
          });
          return;
        }
        if (snData.store !== currentStore) {
          setStockWarning({
            message: `هذا السيريال مسجل في مخزن "${snData.store}" وليس "${currentStore}". هل ترغب في تجاوزه والإضافة للقائمة؟`,
            action: () => addItemDirectly(effectiveItem, sn, 1, condInput),
          });
          return;
        }
      } else if (opType === 'وارد') {
        if (subType === 'مشتريات' && snData.status !== 'not_found') {
          setStockWarning({
            message: `السيريال (${sn}) مسجل مسبقاً بالنظام! هل تود توريده وتحديث بياناته على أي حال؟`,
            action: () => addItemDirectly(effectiveItem, sn, 1, condInput),
          });
          return;
        }
        if (subType === 'مرتجع' && snData.status !== 'issued') {
          setStockWarning({
            message: `السيريال (${sn}) ليس مسجلاً كعهدة مصروفة. هل تود استلامه كمرتجع على أي حال؟`,
            action: () => addItemDirectly(effectiveItem, sn, 1, condInput),
          });
          return;
        }
        if (subType === 'مرتجع' && returnFrom && snData.recipient !== returnFrom) {
          setStockWarning({
            message: `السيريال (${sn}) مسجل كعهدة لدى (${snData.recipient}) وليس لدى (${returnFrom})! هل ترغب في الاستمرار؟`,
            action: () => addItemDirectly(effectiveItem, sn, 1, condInput),
          });
          return;
        }
      }
    } else {
      // Non-SN items quantity validation
      if (opType === 'منصرف' || opType === 'تحويل') {
        const available = getNonSNBalance(currentStore, effectiveItem);
        const inCurrentBatch = tempBatch
          .filter((b) => b.item === effectiveItem)
          .reduce((acc, b) => acc + b.qty, 0);
        if (available < qtyInput + inCurrentBatch) {
          setStockWarning({
            message: `الرصيد المتاح حالياً في مخزن "${currentStore}" هو (${available}) صنف فقط، والمطلوب (${qtyInput + inCurrentBatch}). هل تود الصرف بالسالب والإضافة للقائمة على أي حال؟`,
            action: () => addItemDirectly(effectiveItem, sn, qtyInput, condInput),
          });
          return;
        }
      }
    }

    addItemDirectly(effectiveItem, sn, requiresSN ? 1 : qtyInput, condInput);
  };

  // Add Damaged Item
  const handleAddDamagedItem = () => {
    setDamagedError(null);
    const targetItem = damagedItem || data.items[0]?.name;
    if (!targetItem) {
      setDamagedError('اختر الصنف التالف أولاً');
      return;
    }
    const sn = isDamagedSNRequired ? damagedSn.trim() : 'بدون سيريال';
    if (isDamagedSNRequired && !sn) {
      setDamagedError('أدخل سيريال الصنف التالف أو اختر صنفاً بدون سيريال');
      return;
    }
    if (isDamagedSNRequired && damagedBatch.some((d) => d.sn === sn)) {
      setDamagedError('هذا السيريال مضاف مسبقاً في قائمة التالف الحالية');
      return;
    }

    setDamagedBatch((prev) => [
      ...prev,
      {
        item: targetItem,
        sn: sn,
        qty: isDamagedSNRequired ? 1 : Math.max(1, damagedQty),
        cond: damagedCond,
        notes: damagedNotes.trim(),
      },
    ]);
    setDamagedSn('');
    setDamagedNotes('');
    setStatusMessage({ text: `تمت إضافة الصنف التالف (${targetItem}) بنجاح`, type: 'success' });
  };

  // Save full batch to Phone Memory
  const handleSaveFinal = () => {
    setFormError(null);
    if (tempBatch.length === 0) {
      setFormError('يرجى إضافة صنف واحد على الأقل إلى القائمة المجهزة قبل الاعتماد والحفظ.');
      return;
    }

    if (opType === 'منصرف') {
      if (!recipient || !data.authorized.includes(recipient)) {
        setFormError('يجب اختيار جهة الاستلام من قائمة الجهات المعتمدة.');
        return;
      }
      if (!receiverName.trim()) {
        setFormError('يرجى كتابة اسم الشخص المستلم الفعلي.');
        return;
      }
      if (issueSubtype === 'بدل تالف' && damagedBatch.length === 0) {
        setFormError('اخترت نوع الصرف (بدل تالف)، لذا يجب إدخال الصنف التالف المرتجع أولاً في قسم التالف.');
        return;
      }
    }

    if (opType === 'وارد' && subType === 'مشتريات') {
      if (!emp || !data.authorized.includes(emp)) {
        setFormError('يجب اختيار المورد / المصدر من قائمة المعتمدين.');
        return;
      }
    }

    const currentStore = store || data.stores[0] || 'المخزن الرئيسي';
    if (opType === 'تحويل') {
      if (!currentStore || !toStore || currentStore === toStore) {
        setFormError('حدد المخزن المصدر والمخزن الوجهة بشكل صحيح (لا يمكن التحويل لنفس المخزن).');
        return;
      }
    }

    const batchId =
      editingBatch?.[0]?.batchId ||
      `REF-${(data.config.lastRefNo || 1000) + 1}`;

    const newLogs: LogEntry[] = [];

    // Regular items
    tempBatch.forEach((b, idx) => {
      newLogs.push({
        batchId,
        date: dateVal || new Date().toISOString().split('T')[0],
        type: opType,
        sub: opType === 'وارد' ? subType : undefined,
        item: b.item,
        sn: b.sn,
        qty: b.qty,
        cond: b.cond,
        store: currentStore,
        toStore: opType === 'تحويل' ? toStore : null,
        recipient:
          opType === 'منصرف'
            ? recipient
            : b.returnFrom
            ? `(مرتجع من: ${b.returnFrom})`
            : '-',
        receiverName: opType === 'منصرف' ? receiverName.trim() : undefined,
        issueSubtype: opType === 'منصرف' ? issueSubtype : undefined,
        docNo: docNo.trim(),
        emp: emp.trim(),
        notes: notes.trim(),
        orderImage: opType === 'منصرف' && idx === 0 ? orderImage : '',
      });
    });

    // Damaged return items to "مخزن التالف"
    if (opType === 'منصرف' && issueSubtype === 'بدل تالف') {
      damagedBatch.forEach((db) => {
        newLogs.push({
          batchId,
          date: dateVal || new Date().toISOString().split('T')[0],
          type: 'وارد',
          sub: 'بدل تالف',
          item: db.item,
          sn: db.sn,
          qty: db.qty,
          cond: 'تالف',
          store: 'مخزن التالف',
          toStore: null,
          recipient: recipient,
          receiverName: receiverName.trim(),
          docNo: docNo.trim(),
          emp: emp.trim(),
          notes: db.notes || notes.trim(),
          damagedReturn: true,
          orderImage: '',
        });
      });
    }

    onSaveBatch(newLogs, batchId, !!editingBatch, editingBatch?.[0]?.batchId);

    // Reset forms
    setTempBatch([]);
    setDamagedBatch([]);
    setNotes('');
    setDocNo('');
    setOrderImage('');
    setSavedSuccessBatchId(batchId);
  };

  return (
    <div className="space-y-6">

      {/* Global Status Notification */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-bold shadow-xs transition ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="p-1 hover:bg-black/5 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Form Error Banner */}
      {formError && (
        <div className="p-3.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 flex items-center justify-between text-xs sm:text-sm font-bold shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
          <button
            type="button"
            onClick={() => setFormError(null)}
            className="p-1 hover:bg-rose-100 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Editing Notification Banner */}
      {editingBatch && (
        <div className="p-4 bg-amber-50 border-r-4 border-amber-500 rounded-lg flex items-center justify-between text-xs sm:text-sm text-amber-900">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
            <span>
              أنت الآن في وضع تعديل العملية: <strong className="font-mono font-bold">{editingBatch[0].batchId}</strong>
            </span>
          </div>
          <button
            onClick={onCancelEdit}
            className="px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded font-semibold transition cursor-pointer"
          >
            إلغاء التعديل
          </button>
        </div>
      )}

      {/* Operation Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-blue-600" />
            <span>تسجيل حركة أو تحويل مخزني</span>
          </h3>
          <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold border border-emerald-200">
            حفظ فوري في ذاكرة الجهاز
          </span>
        </div>

        {/* Form Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Operation Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع العملية</label>
            <select
              value={opType}
              onChange={(e) => setOpType(e.target.value as 'وارد' | 'منصرف' | 'تحويل')}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
            >
              <option value="منصرف">📤 صرف عهدة</option>
              <option value="وارد">📥 توريد للمخزن</option>
              <option value="تحويل">🔀 تحويل بين المخازن</option>
            </select>
          </div>

          {/* Primary Warehouse */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {opType === 'وارد' ? 'المخزن المستلم' : 'يُسحب من المخزن الأساسي'}
            </label>
            <select
              value={store}
              onChange={(e) => setStore(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
            >
              {data.stores.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* If Inward: Purchases vs Return */}
          {opType === 'وارد' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">تفصيل التوريد</label>
              <select
                value={subType}
                onChange={(e) => setSubType(e.target.value as 'مشتريات' | 'مرتجع')}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
              >
                <option value="مشتريات">مشتريات جديدة</option>
                <option value="مرتجع">مرتجع من عهدة سابقة</option>
              </select>
            </div>
          )}

          {/* If Inward Return: Return From */}
          {opType === 'وارد' && subType === 'مرتجع' && (
            <div className="bg-amber-50 p-2 rounded-lg border border-amber-200">
              <label className="block text-xs font-bold text-amber-800 mb-1">
                إرجاع من عهدة (خصم من عهدة الجهة/الموظف)
              </label>
              <select
                value={returnFrom}
                onChange={(e) => setReturnFrom(e.target.value)}
                className="w-full p-2 bg-white border border-amber-300 rounded text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
              >
                <option value="">-- اختياري (بدون تحديد جهة) --</option>
                {data.authorized.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* If Transfer: Destination Store */}
          {opType === 'تحويل' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">إلى مخزن (الوجهة)</label>
              <select
                value={toStore}
                onChange={(e) => setToStore(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
              >
                <option value="">-- اختر المخزن الوجهة --</option>
                {data.stores
                  .filter((s) => s !== store)
                  .map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* If Outward: Authorized Recipient */}
          {opType === 'منصرف' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  جهة الاستلام (المعتمدة حصراً)
                </label>
                <select
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                >
                  <option value="">-- اختر جهة الاستلام --</option>
                  {data.authorized.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المستلم الفعلي</label>
                <input
                  type="text"
                  placeholder="اسم الشخص المستلم"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع الصرف</label>
                <select
                  value={issueSubtype}
                  onChange={(e) => setIssueSubtype(e.target.value as 'اضافي' | 'بدل تالف')}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                >
                  <option value="اضافي">صرف إضافي</option>
                  <option value="بدل تالف">بدل تالف (مع استرجاع تالف)</option>
                </select>
              </div>
            </>
          )}

          {/* Document / Invoice Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {opType === 'وارد' ? 'رقم الفاتورة / المستند' : opType === 'منصرف' ? 'رقم سند الاستلام' : 'رقم أمر التحويل'}
            </label>
            <input
              type="text"
              placeholder="مثال: DOC-402"
              value={docNo}
              onChange={(e) => setDocNo(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">التاريخ</label>
            <input
              type="date"
              value={dateVal}
              onChange={(e) => setDateVal(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
            />
          </div>

          {/* Responsible / Approved by */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {opType === 'وارد' ? 'المورد / المصدر' : opType === 'منصرف' ? 'المعتمد / الموجّه' : 'مسؤول التحويل'}
            </label>
            {opType === 'وارد' && subType === 'مشتريات' ? (
              <select
                value={emp}
                onChange={(e) => setEmp(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
              >
                <option value="">-- اختر المورد المعتمد --</option>
                {data.authorized.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="اسم المسؤول أو المعتمد"
                value={emp}
                onChange={(e) => setEmp(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
              />
            )}
          </div>

          {/* Order Slip Camera Capture (for outward ops) */}
          {opType === 'منصرف' && (
            <div className="sm:col-span-2 lg:col-span-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>تصوير أو إرفاق صورة أمر الصرف عبر كاميرا الهاتف</span>
              </label>
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                />
                {orderImage ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold bg-emerald-100 px-2.5 py-1 rounded">
                    <CheckCircle className="w-4 h-4" />
                    <span>تم إرفاق صورة الأمر بنجاح</span>
                    <button
                      onClick={() => setOrderImage('')}
                      className="text-rose-600 hover:text-rose-800 text-xs font-normal underline"
                    >
                      إزالة
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-500">
                    إذا لم ترفقها الآن ستظهر تلقائياً في صفحة "متابعة الأوامر".
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات عامة على العملية</label>
            <input
              type="text"
              placeholder="أي تفاصيل أو ملاحظات إضافية..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
            />
          </div>

        </div>
      </div>

      {/* Damaged items section if "بدل تالف" */}
      {opType === 'منصرف' && issueSubtype === 'بدل تالف' && (
        <div className="bg-amber-50/80 rounded-xl border border-amber-300 p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm sm:text-base border-b border-amber-200 pb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>إدخال الأصناف التالفة المرتجعة (تودع تلقائياً في "مخزن التالف")</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الصنف التالف</label>
              <select
                value={damagedItem}
                onChange={(e) => setDamagedItem(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-semibold"
              >
                {data.items.map((i) => (
                  <option key={i.name} value={i.name}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isDamagedSNRequired ? 'السيريال التالف (مطلوب)' : 'السيريال'}
              </label>
              <input
                type="text"
                disabled={!isDamagedSNRequired}
                placeholder={isDamagedSNRequired ? 'رقم السيريال' : 'بدون سيريال'}
                value={isDamagedSNRequired ? damagedSn : 'بدون سيريال'}
                onChange={(e) => setDamagedSn(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded text-xs disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الكمية</label>
              <input
                type="number"
                min="1"
                disabled={isDamagedSNRequired}
                value={isDamagedSNRequired ? 1 : damagedQty}
                onChange={(e) => setDamagedQty(parseInt(e.target.value) || 1)}
                className="w-full p-2 bg-white border border-slate-300 rounded text-xs disabled:bg-slate-100 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">وصف التلف</label>
              <input
                type="text"
                placeholder="سبب التلف أو الملاحظة"
                value={damagedNotes}
                onChange={(e) => setDamagedNotes(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded text-xs"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddDamagedItem}
                className="w-full p-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold text-xs transition cursor-pointer shadow-xs"
              >
                إضافة التالف للقائمة
              </button>
            </div>
          </div>

          {damagedBatch.length > 0 && (
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-xs text-right bg-white rounded border border-amber-200">
                <thead className="bg-amber-100 text-amber-900 font-bold">
                  <tr>
                    <th className="p-2">الصنف التالف</th>
                    <th className="p-2">السيريال</th>
                    <th className="p-2 text-center">الكمية</th>
                    <th className="p-2">الوصف</th>
                    <th className="p-2 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {damagedBatch.map((db, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-bold">{db.item}</td>
                      <td className="p-2 font-mono">{db.sn}</td>
                      <td className="p-2 text-center font-bold">{db.qty}</td>
                      <td className="p-2 text-slate-600">{db.notes || '-'}</td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => setDamagedBatch((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-rose-600 hover:text-rose-800 font-bold p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Items to Process Batch */}
      <div className="bg-blue-50/80 rounded-xl border border-blue-200 p-4 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-bold text-blue-900 text-sm sm:text-base flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-blue-600" />
            <span>إضافة الأصناف للعملية</span>
          </h4>
          
          {/* Quick Balance helper */}
          {(selectedItem || data.items[0]?.name) && (
            <span className="text-[11px] sm:text-xs text-slate-700 bg-white border border-blue-200 px-2.5 py-1 rounded-md font-medium">
              الرصيد بمخزن ({store || data.stores[0] || 'الرئيسي'}):{' '}
              <strong className="text-blue-700 font-bold">
                {getNonSNBalance(store || data.stores[0] || '', selectedItem || data.items[0]?.name)}
              </strong>{' '}
              صنف
            </span>
          )}
        </div>

        {/* Item Error Notification */}
        {itemError && (
          <div className="p-3 rounded-lg bg-rose-100 border border-rose-300 text-rose-900 text-xs sm:text-sm font-bold flex flex-wrap items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{itemError}</span>
            </div>
            {currentItemDef?.hasSN === 'yes' && !allowNoSN && (
              <button
                type="button"
                onClick={() => {
                  setAllowNoSN(true);
                  setItemError(null);
                }}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold whitespace-nowrap cursor-pointer transition"
              >
                تفعيل الإضافة ككمية بدون سيريال
              </button>
            )}
          </div>
        )}

        {/* Stock Warning Prompt (Overridable) */}
        {stockWarning && (
          <div className="p-3.5 rounded-xl bg-amber-50 border-2 border-amber-400 text-amber-950 text-xs sm:text-sm font-semibold space-y-2.5 shadow-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900">{stockWarning.message}</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  يمكنك المتابعة وتجاوز التنبيه إذا كان الصرف استثنائياً أو لتوثيق حركة تاريخية.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={stockWarning.action}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>نعم، تجاوز التنبيه وأضف للقائمة</span>
              </button>
              <button
                type="button"
                onClick={() => setStockWarning(null)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الصنف *</label>
            <select
              value={selectedItem || data.items[0]?.name || ''}
              onChange={(e) => {
                setSelectedItem(e.target.value);
                setItemError(null);
                setStockWarning(null);
              }}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
              {data.items.map((i) => (
                <option key={i.name} value={i.name}>
                  {i.name} ({i.hasSN === 'yes' ? 'سيريال' : 'كمية'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                {isSNRequired ? 'الرقم العملياتي (S/N) *' : 'الرقم العملياتي'}
              </label>
              {currentItemDef?.hasSN === 'yes' && (
                <button
                  type="button"
                  onClick={() => {
                    setAllowNoSN(!allowNoSN);
                    setItemError(null);
                  }}
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition ${
                    allowNoSN
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'text-blue-600 hover:underline'
                  }`}
                  title="تخطي السيريال وتسجيل الصنف ككمية عادية"
                >
                  {allowNoSN ? '✓ بدون سيريال' : '+ بدون سيريال؟'}
                </button>
              )}
            </div>
            <input
              type="text"
              disabled={!isSNRequired}
              placeholder={isSNRequired ? 'أدخل السيريال أو الباركود' : 'بدون سيريال (كمية)'}
              value={isSNRequired ? snInput : 'بدون سيريال'}
              onChange={(e) => {
                setSnInput(e.target.value);
                setItemError(null);
              }}
              className={`w-full p-2.5 bg-white border rounded-lg text-xs sm:text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-hidden disabled:bg-slate-100 ${
                itemError && isSNRequired && !snInput.trim()
                  ? 'border-rose-500 ring-2 ring-rose-200'
                  : 'border-slate-300'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الكمية</label>
            <input
              type="number"
              min="1"
              disabled={isSNRequired}
              value={isSNRequired ? 1 : qtyInput}
              onChange={(e) => {
                setQtyInput(Math.max(1, parseInt(e.target.value) || 1));
                setItemError(null);
              }}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-hidden disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الحالة</label>
            <select
              value={condInput}
              onChange={(e) => setCondInput(e.target.value as 'جديد' | 'مستخدم' | 'تالف')}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
              <option value="جديد">جديد</option>
              <option value="مستخدم">مستخدم</option>
              <option value="تالف">تالف</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              id="btn-add-to-batch"
              onClick={handleAddToBatch}
              className="w-full p-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg font-bold text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة للقائمة</span>
            </button>
          </div>

        </div>
      </div>

      {/* Batch Table */}
      {tempBatch.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm sm:text-base">
              الأصناف المجهزة في العملية ({tempBatch.length} صنف)
            </span>
            <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold">
              إجمالي الكمية: {tempBatch.reduce((acc, b) => acc + b.qty, 0)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">الصنف</th>
                  <th className="p-3 text-center">السيريال (S/N)</th>
                  <th className="p-3 text-center">الكمية</th>
                  <th className="p-3 text-center">الحالة</th>
                  <th className="p-3 text-center">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tempBatch.map((b, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">
                      {b.item}
                      {b.returnFrom && (
                        <div className="text-[11px] text-amber-700 font-semibold">
                          (مرتجع من عهدة: {b.returnFrom})
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-slate-800">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {b.sn}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-900">{b.qty}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        b.cond === 'جديد'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.cond === 'تالف'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {b.cond}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setTempBatch((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer transition"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleSaveFinal}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer shadow-md transition"
            >
              <Send className="w-4 h-4" />
              <span>{editingBatch ? '💾 حفظ تعديلات العملية' : '💾 اعتماد وحفظ العملية بشكل نهائي في الهاتف'}</span>
            </button>

            {editingBatch && (
              <button
                onClick={onCancelEdit}
                className="w-full sm:w-auto px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-sm font-semibold cursor-pointer"
              >
                إلغاء التعديل
              </button>
            )}
          </div>
        </div>
      )}

      {/* Save Success Modal */}
      {savedSuccessBatchId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-black text-slate-900">تم حفظ العملية بنجاح!</h3>
              <p className="text-xs sm:text-sm text-slate-600">
                تم تسجيل العملية برقم المرجع <strong className="font-mono text-blue-700 font-bold">{savedSuccessBatchId}</strong> وحفظها فورياً في ذاكرة الجهاز.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const bId = savedSuccessBatchId;
                  setSavedSuccessBatchId(null);
                  onOpenPrint(bId);
                }}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة السند الآن</span>
              </button>
              <button
                type="button"
                onClick={() => setSavedSuccessBatchId(null)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer transition"
              >
                حركة جديدة
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
