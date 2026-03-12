import React from 'react';

interface LoadingProgressProps {
  loadedCount: number;
  totalCount: number;
  progress: number;
  isComplete: boolean;
}

/**
 * Inline progress bar shown while background-loading remaining pages.
 * Displays a thin bar and "Loading X of Y…" text. Automatically hides
 * when all data has been loaded.
 */
const LoadingProgress: React.FC<LoadingProgressProps> = ({
  loadedCount,
  totalCount,
  progress,
  isComplete,
}) => {
  if (isComplete || totalCount === 0) return null;

  return (
    <div className="flex items-center gap-3 text-sm text-gray-500 py-2 px-1">
      <div className="w-36 bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="whitespace-nowrap">
        Loaded {loadedCount.toLocaleString()} of {totalCount.toLocaleString()} records…
      </span>
    </div>
  );
};

export default LoadingProgress;
