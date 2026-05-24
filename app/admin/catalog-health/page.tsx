import { Metadata } from 'next';
import CatalogHealthClient from './CatalogHealthClient';

export const metadata: Metadata = {
  title: 'Catalog Health - SassyGurl Admin',
};

export default function CatalogHealthPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Catalog Health Dashboard</h1>
          <p className="text-neutral-400 mt-1">Operational visibility into product states, grouping, and sync health.</p>
        </div>
      </div>
      
      <CatalogHealthClient />
    </div>
  );
}
