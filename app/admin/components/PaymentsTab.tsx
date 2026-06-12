import { useState, useTransition, useEffect } from "react";
import { getPaymentMethodsAction, updatePaymentMethodFeeAction, togglePaymentMethodAction } from "@/app/actions/dashboard";
import { CreditCard, Edit, Power, Check, X } from "lucide-react";

export default function PaymentsTab() {
  const [methods, setMethods] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ feeFlat: 0, feePercent: 0 });

  const fetchMethods = () => {
    startTransition(async () => {
      const data = await getPaymentMethodsAction();
      setMethods(data);
    });
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleToggle = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      await togglePaymentMethodAction(id, !currentStatus);
      fetchMethods();
    });
  };

  const handleSaveFee = (id: string) => {
    startTransition(async () => {
      await updatePaymentMethodFeeAction(id, editForm.feeFlat, editForm.feePercent);
      setEditingId(null);
      fetchMethods();
    });
  };

  const startEdit = (method: any) => {
    setEditingId(method.id);
    setEditForm({ feeFlat: method.feeFlat, feePercent: method.feePercent });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-sakura" /> Payment Gateway
        </h2>
        <button 
          onClick={fetchMethods}
          disabled={isPending}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-black transition-all"
        >
          {isPending ? "Syncing..." : "Refresh"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {methods.map((method) => (
          <div key={method.id} className="p-5 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-16 h-10 bg-white rounded flex items-center justify-center p-1 shadow-sm">
                <img src={method.iconUrl} alt={method.name} className="max-w-full max-h-full object-contain" />
              </div>
              <div>
                <div className="font-bold flex items-center gap-2 text-white">
                  {method.name} 
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/5 text-white/50 border border-white/10">
                    {method.type}
                  </span>
                </div>
                <div className="text-xs text-zinc-500 font-mono mt-0.5">Code: {method.code}</div>
              </div>
            </div>

            <div className="flex items-center gap-8">
              {editingId === method.id ? (
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Fee Flat (Rp)</label>
                    <input 
                      type="number" 
                      value={editForm.feeFlat}
                      onChange={e => setEditForm({...editForm, feeFlat: Number(e.target.value)})}
                      className="w-24 px-2 py-1 bg-zinc-950 border border-zinc-700 rounded text-sm outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Fee Percent (%)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={editForm.feePercent}
                      onChange={e => setEditForm({...editForm, feePercent: Number(e.target.value)})}
                      className="w-20 px-2 py-1 bg-zinc-950 border border-zinc-700 rounded text-sm outline-none"
                    />
                  </div>
                  <div className="flex items-end h-full mb-0.5 ml-2">
                    <button onClick={() => handleSaveFee(method.id)} className="p-1.5 bg-status-success/20 text-status-success rounded hover:bg-status-success/40 mr-1"><Check className="w-4 h-4"/></button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 bg-zinc-800 text-zinc-400 rounded hover:bg-zinc-700"><X className="w-4 h-4"/></button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-start md:items-end w-full md:w-auto">
                  <div className="text-sm font-semibold text-white/80">Fee: Rp {method.feeFlat.toLocaleString('id-ID')} + {method.feePercent}%</div>
                  <button onClick={() => startEdit(method)} className="text-xs text-sakura hover:text-sakura/80 font-bold flex items-center gap-1 mt-1 transition-colors">
                    <Edit className="w-3 h-3" /> Edit Fee
                  </button>
                </div>
              )}

              <div className="hidden md:block w-px h-10 bg-white/10"></div>

              <button
                onClick={() => handleToggle(method.id, method.isActive)}
                disabled={isPending}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all w-full md:w-auto ${
                  method.isActive 
                    ? "bg-status-success/10 text-status-success hover:bg-status-success/20 border border-status-success/20" 
                    : "bg-status-danger/10 text-status-danger hover:bg-status-danger/20 border border-status-danger/20"
                }`}
              >
                <Power className="w-4 h-4" />
                {method.isActive ? "Active" : "Disabled"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
