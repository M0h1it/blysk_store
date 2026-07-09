import React from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';

/** Centered spinner shown while an API request is in flight. */
export const LoadingState: React.FC<{ label?: string }> = ({ label = 'Loading data…' }) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
    <Loader2 className="animate-spin mb-3" size={28} />
    <p className="text-sm">{label}</p>
  </div>
);

/** Error card with an optional retry button. */
export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => (
  <div className="card border-l-4 border-red-500 bg-red-50 dark:bg-red-950">
    <div className="flex gap-3 items-start">
      <AlertCircle className="text-red-600 mt-1 flex-shrink-0" size={20} />
      <div className="flex-1">
        <h4 className="font-semibold text-red-800 dark:text-red-200">Could not load data</h4>
        <p className="text-sm text-red-700 dark:text-red-300 mt-1">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            <RefreshCw size={14} /> Retry
          </button>
        )}
      </div>
    </div>
  </div>
);
