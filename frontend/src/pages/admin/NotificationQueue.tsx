import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { RotateCw } from 'lucide-react';
import { adminApi } from '../../services/api';

export const AdminNotificationQueue: React.FC = () => {
  const [queue, setQueue] = useState<any[]>([]);

  const fetchQueue = () => {
    adminApi.getDeadLetterQueue().then((res) => {
      if (res.data.success && res.data.data) {
        setQueue(res.data.data.items || []);
      }
    });
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleRetry = async (id: string) => {
    try {
      await adminApi.retryNotification(id);
      toast.success('Notification queued for immediate dispatch.');
      fetchQueue();
    } catch {
      toast.error('Failed to retry notification');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-navy-900">Notification Dead-Letter Queue</h2>
        <p className="text-xs text-gray-400 mt-1">
          Emails that exceeded 3 exponential backoff attempts (1m, 5m, 30m) are held here for administrative inspection and manual retry.
        </p>
      </div>

      <div className="bg-surface-white rounded-3xl p-6 shadow-card overflow-hidden">
        {!queue.length ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            No dead-letter notifications. All background dispatches succeeded.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-border text-xs text-gray-400 font-bold uppercase">
                <th className="pb-3 px-2">Recipient</th>
                <th className="pb-3 px-2">Type</th>
                <th className="pb-3 px-2">Subject</th>
                <th className="pb-3 px-2">Error Diagnostic</th>
                <th className="pb-3 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {queue.map((item) => {
                const rec = item.recipientId;
                return (
                  <tr key={item._id} className="hover:bg-surface-light/50">
                    <td className="py-3 px-2 font-semibold text-navy-900">
                      {rec?.firstName} {rec?.lastName} ({rec?.email})
                    </td>
                    <td className="py-3 px-2 text-xs font-bold text-coral-500">{item.type}</td>
                    <td className="py-3 px-2 text-xs text-gray-700">{item.subject}</td>
                    <td className="py-3 px-2 text-xs text-rose-500 font-mono">{item.errorMessage || 'Timeout'}</td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => handleRetry(item._id)}
                        className="px-3 py-1.5 rounded-full bg-coral-50 hover:bg-coral-100 text-coral-600 font-bold text-xs inline-flex items-center gap-1"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
