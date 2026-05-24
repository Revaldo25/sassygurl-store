'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { fetcher } from '@/lib/utils';
import { toast } from 'sonner';

export default function ReviewQueueClient() {
  const { data: session } = useSWR('/api/auth/session', fetcher);
  
  const { data, error, mutate, isLoading } = useSWR<{ success: boolean; data: any[] }>(
    session?.user?.role === 'SUPERADMIN' ? '/api/products/review-queue' : null,
    fetcher
  );

  const [resolvingId, setResolvingId] = useState<string | null>(null);

  if (isLoading) return <div className="text-white text-center py-12">Loading Review Queue...</div>;
  if (error) return <div className="text-red-500 text-center py-12">Failed to load Review Queue.</div>;

  const products = data?.data || [];

  const handleResolve = async (id: string, action: string, targetCategory?: string) => {
    setResolvingId(id);
    try {
      const payload = { action, targetCategory };
      const res = await fetch(`/api/products/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to resolve product');
      
      toast.success(json.message);
      mutate(); // Refresh the list
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setResolvingId(null);
    }
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-400">
        <span className="text-4xl block mb-4">🎉</span>
        <p>No products in the review queue. All clear!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-sm text-neutral-300">
        <thead>
          <tr className="border-b border-white/10 text-neutral-400">
            <th className="py-3 px-4">Game</th>
            <th className="py-3 px-4">Original Name</th>
            <th className="py-3 px-4">SKU / Provider</th>
            <th className="py-3 px-4">Metadata</th>
            <th className="py-3 px-4">Action</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p: any) => {
            let metaObj: any = {};
            try {
              metaObj = p.metadata ? JSON.parse(p.metadata) : {};
            } catch {}

            return (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-3 px-4 font-medium text-white">{p.game?.name}</td>
                <td className="py-3 px-4">{p.originalName || p.name}</td>
                <td className="py-3 px-4">
                  <div>{p.sku}</div>
                  <div className="text-xs text-neutral-500">{p.source}</div>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-block bg-yellow-500/10 text-yellow-500 text-xs px-2 py-1 rounded">
                    {metaObj.categoryGroup || 'AMBIGUOUS'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={resolvingId === p.id}
                      onClick={() => handleResolve(p.id, 'APPROVE')}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded text-xs font-medium transition"
                    >
                      Approve
                    </button>
                    <button
                      disabled={resolvingId === p.id}
                      onClick={() => handleResolve(p.id, 'REJECT')}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs font-medium transition"
                    >
                      Reject
                    </button>
                    
                    <select
                      className="bg-neutral-800 border border-neutral-700 text-white rounded text-xs px-2 py-1.5"
                      onChange={(e) => {
                        if (e.target.value) {
                          handleResolve(p.id, 'REMAP', e.target.value);
                          e.target.value = ''; // reset after dispatch
                        }
                      }}
                      disabled={resolvingId === p.id}
                    >
                      <option value="">-- Remap --</option>
                      <option value="CURRENCY">Currency</option>
                      <option value="PASS_MEMBERSHIP">Pass/Member</option>
                      <option value="BUNDLES">Bundle</option>
                      <option value="VOUCHER">Voucher</option>
                    </select>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
