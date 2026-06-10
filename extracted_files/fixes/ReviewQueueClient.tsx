'use client';

import { useState, useEffect, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  getReviewQueueAction,
  resolveProductAction,
  type ReviewProduct,
} from '@/app/actions/dashboard';

export default function ReviewQueueClient() {
  const { data: session, status } = useSession();
  const [products, setProducts] = useState<ReviewProduct[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Load review queue via Server Action ──────────────────────────────
  const loadQueue = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await getReviewQueueAction();
      if (result.success) {
        setProducts(result.data);
      } else {
        setLoadError(result.message);
      }
    } catch (err: any) {
      setLoadError(err.message || 'Gagal memuat review queue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Hanya load jika sudah login dan role SUPERADMIN
    const role = (session?.user as any)?.role;
    if (status === 'authenticated' && role === 'SUPERADMIN') {
      loadQueue();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
      setLoadError('Anda tidak memiliki akses ke halaman ini.');
    } else if (status === 'authenticated' && role !== 'SUPERADMIN') {
      setIsLoading(false);
      setLoadError('Hanya SUPERADMIN yang dapat mengakses Review Queue.');
    }
  }, [status, session]);

  // ── Resolve product via Server Action ────────────────────────────────
  const handleResolve = async (
    id: string,
    action: 'APPROVE' | 'REJECT' | 'REMAP',
    targetCategory?: string
  ) => {
    setResolvingId(id);
    startTransition(async () => {
      try {
        const result = await resolveProductAction(id, action, targetCategory);
        if (result.success) {
          toast.success(result.message || 'Berhasil!');
          // Hapus produk dari list lokal setelah berhasil
          setProducts(prev => prev.filter(p => p.id !== id));
        } else {
          toast.error(result.message || 'Gagal memproses produk.');
        }
      } catch (err: any) {
        toast.error(err.message || 'Terjadi kesalahan.');
      } finally {
        setResolvingId(null);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="text-white text-center py-12 flex items-center justify-center gap-2">
        <div className="w-4 h-4 border-2 border-sakura border-t-transparent rounded-full animate-spin" />
        Loading Review Queue...
      </div>
    );
  }

  if (loadError) {
    return <div className="text-red-400 text-center py-12 font-medium">{loadError}</div>;
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-400">
        <span className="text-4xl block mb-4">🎉</span>
        <p>No products in the review queue. All clear!</p>
        <button
          onClick={loadQueue}
          className="mt-4 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-xs transition"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs text-neutral-400">{products.length} produk perlu review</span>
        <button
          onClick={loadQueue}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-xs transition"
        >
          Refresh
        </button>
      </div>

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
            {products.map((p) => {
              let metaObj: any = {};
              try { metaObj = p.metadata ? JSON.parse(p.metadata) : {}; } catch {}
              const isResolving = resolvingId === p.id || isPending;

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
                        disabled={isResolving}
                        onClick={() => handleResolve(p.id, 'APPROVE')}
                        className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-3 py-1.5 rounded text-xs font-medium transition"
                      >
                        Approve
                      </button>
                      <button
                        disabled={isResolving}
                        onClick={() => handleResolve(p.id, 'REJECT')}
                        className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-3 py-1.5 rounded text-xs font-medium transition"
                      >
                        Reject
                      </button>
                      <select
                        className="bg-neutral-800 border border-neutral-700 text-white rounded text-xs px-2 py-1.5 disabled:opacity-50"
                        onChange={(e) => {
                          if (e.target.value) {
                            handleResolve(p.id, 'REMAP', e.target.value);
                            e.target.value = '';
                          }
                        }}
                        disabled={isResolving}
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
    </div>
  );
}
