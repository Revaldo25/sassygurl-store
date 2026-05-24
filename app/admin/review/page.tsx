import { Metadata } from 'next';
import ReviewQueueClient from './ReviewQueueClient';

export const metadata: Metadata = {
  title: 'Review Queue - SassyGurl Admin',
};

export default function ReviewQueuePage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">NeedsReview Queue</h1>
          <p className="text-neutral-400 mt-1">Review and resolve ambiguous products from external providers.</p>
        </div>
      </div>
      
      <div className="bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden p-6">
        <ReviewQueueClient />
      </div>
    </div>
  );
}
