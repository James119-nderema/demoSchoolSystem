import React from 'react';

/* ──────────────────────────────────────────────────────────────
   Skeleton primitives – lightweight, zero-dependency shimmer
   placeholders that match common page layouts.
   ────────────────────────────────────────────────────────────── */

/** Base animated bar / block */
export const Shimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

/** Single text line placeholder */
export const SkeletonText: React.FC<{ className?: string; width?: string }> = ({
  className = '',
  width = 'w-32',
}) => <div className={`animate-pulse bg-gray-200 rounded h-4 ${width} ${className}`} />;

/** Multi-line text block */
export const SkeletonLines: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={`animate-pulse bg-gray-200 rounded h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
      />
    ))}
  </div>
);

/* ─── Stat Card ────────────────────────────────────────────── */

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-5 ${className}`}>
    <div className="flex items-center justify-between">
      <div className="space-y-2 flex-1">
        <div className="animate-pulse bg-gray-200 rounded h-3 w-24" />
        <div className="animate-pulse bg-gray-200 rounded h-7 w-16" />
      </div>
      <div className="animate-pulse bg-gray-200 rounded-full h-10 w-10" />
    </div>
  </div>
);

export const SkeletonCards: React.FC<{ count?: number; className?: string }> = ({
  count = 4,
  className = '',
}) => (
  <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${count > 3 ? 4 : count} gap-4 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

/* ─── Table ────────────────────────────────────────────────── */

export const SkeletonTableRow: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className={`animate-pulse bg-gray-200 rounded h-4 ${i === 0 ? 'w-32' : 'w-20'}`} />
      </td>
    ))}
  </tr>
);

export const SkeletonTable: React.FC<{
  rows?: number;
  cols?: number;
  className?: string;
}> = ({ rows = 5, cols = 5, className = '' }) => (
  <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-6 py-3">
                <div className="animate-pulse bg-gray-200 rounded h-3 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

/* ─── Chart ────────────────────────────────────────────────── */

export const SkeletonChart: React.FC<{ height?: string; className?: string }> = ({
  height = 'h-64',
  className = '',
}) => (
  <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
    <div className="animate-pulse bg-gray-200 rounded h-4 w-40 mb-4" />
    <div className={`animate-pulse bg-gray-100 rounded ${height}`} />
  </div>
);

/* ─── Profile / Hero Header ───────────────────────────────── */

export const SkeletonProfile: React.FC = () => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <div className="animate-pulse bg-gradient-to-r from-gray-200 to-gray-300 h-36" />
    <div className="p-6 -mt-12 flex items-end space-x-4">
      <div className="animate-pulse bg-gray-300 rounded-full h-20 w-20 border-4 border-white" />
      <div className="space-y-2 pb-1">
        <div className="animate-pulse bg-gray-200 rounded h-5 w-48" />
        <div className="animate-pulse bg-gray-200 rounded h-3 w-32" />
      </div>
    </div>
  </div>
);

/* ─── List Items ──────────────────────────────────────────── */

export const SkeletonListItem: React.FC = () => (
  <div className="flex items-center space-x-4 p-4">
    <div className="animate-pulse bg-gray-200 rounded-full h-10 w-10 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="animate-pulse bg-gray-200 rounded h-4 w-3/4" />
      <div className="animate-pulse bg-gray-200 rounded h-3 w-1/2" />
    </div>
  </div>
);

export const SkeletonList: React.FC<{ items?: number; className?: string }> = ({
  items = 5,
  className = '',
}) => (
  <div className={`bg-white rounded-lg shadow divide-y divide-gray-200 ${className}`}>
    {Array.from({ length: items }).map((_, i) => (
      <SkeletonListItem key={i} />
    ))}
  </div>
);

/* ════════════════════════════════════════════════════════════
   Page-level composed skeletons – drop-in replacements for
   the full-page spinners.
   ════════════════════════════════════════════════════════════ */

/** Dashboard: header + stat cards + 2 chart panels */
export const DashboardSkeleton: React.FC<{
  title?: string;
  subtitle?: string;
  cardCount?: number;
  className?: string;
}> = ({ title = '', subtitle = '', cardCount = 4, className = 'p-6 space-y-6' }) => (
  <div className={className}>
    {/* Header */}
    <div className="bg-white rounded-lg shadow p-6">
      {title ? (
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      ) : (
        <div className="animate-pulse bg-gray-200 rounded h-7 w-56" />
      )}
      {subtitle ? (
        <p className="text-gray-600 mt-1">{subtitle}</p>
      ) : (
        <div className="animate-pulse bg-gray-200 rounded h-4 w-72 mt-2" />
      )}
    </div>
    {/* Stat cards */}
    <SkeletonCards count={cardCount} />
    {/* Chart panels */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonChart />
      <SkeletonChart />
    </div>
  </div>
);

/** Table page: header + search bar + table */
export const TablePageSkeleton: React.FC<{
  title?: string;
  subtitle?: string;
  rows?: number;
  cols?: number;
  className?: string;
}> = ({ title = '', subtitle = '', rows = 8, cols = 5, className = '' }) => (
  <div className={`h-full bg-gray-50 ${className}`}>
    {/* Header */}
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {title ? (
          <>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
          </>
        ) : (
          <>
            <div className="animate-pulse bg-gray-200 rounded h-7 w-48" />
            <div className="animate-pulse bg-gray-200 rounded h-4 w-64 mt-2" />
          </>
        )}
      </div>
    </div>
    {/* Search + Table */}
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      <div className="flex items-center gap-3">
        <div className="animate-pulse bg-gray-200 rounded-lg h-10 flex-1 max-w-sm" />
        <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-28" />
      </div>
      <SkeletonTable rows={rows} cols={cols} />
    </div>
  </div>
);

/** Analytics: header + cards + chart */
export const AnalyticsSkeleton: React.FC<{
  title?: string;
  subtitle?: string;
  className?: string;
}> = ({ title = '', subtitle = '', className = 'p-6 space-y-6' }) => (
  <div className={className}>
    <div className="flex items-center justify-between">
      <div>
        {title ? (
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        ) : (
          <div className="animate-pulse bg-gray-200 rounded h-7 w-48" />
        )}
        {subtitle ? (
          <p className="text-gray-600 mt-1">{subtitle}</p>
        ) : (
          <div className="animate-pulse bg-gray-200 rounded h-4 w-64 mt-2" />
        )}
      </div>
    </div>
    <SkeletonCards count={3} />
    <SkeletonChart height="h-80" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonChart />
      <SkeletonChart />
    </div>
  </div>
);

/** Finance page: header + stat cards + table  */
export const FinancePageSkeleton: React.FC<{
  title?: string;
  subtitle?: string;
  className?: string;
}> = ({ title = '', subtitle = '', className = 'min-h-screen bg-gray-50/50 p-4 md:p-6 lg:p-8' }) => (
  <div className={className}>
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        {title ? (
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        ) : (
          <div className="animate-pulse bg-gray-200 rounded h-7 w-48" />
        )}
        {subtitle ? (
          <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
        ) : (
          <div className="animate-pulse bg-gray-200 rounded h-4 w-72 mt-2" />
        )}
      </div>
      <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-32" />
    </div>
    <SkeletonCards count={4} className="mb-6" />
    <SkeletonTable rows={6} cols={5} />
  </div>
);

export default Shimmer;
