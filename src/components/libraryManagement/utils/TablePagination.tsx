/**
 * TablePagination — Reusable pagination component for library tables
 * Shows page numbers with ellipsis ranges, per-page selector, and info text.
 * Filtering/search remains unaffected — pagination operates on the filtered array.
 */

import React from 'react';

interface TablePaginationProps {
  /** Total number of items (after filtering, before slicing for current page) */
  totalItems: number;
  /** Current page number (1-based) */
  currentPage: number;
  /** Items per page */
  itemsPerPage: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when items-per-page changes */
  onItemsPerPageChange: (size: number) => void;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Label for the items (e.g. "students", "books", "records") */
  itemLabel?: string;
}

const TablePagination: React.FC<TablePaginationProps> = ({
  totalItems,
  currentPage,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [10, 25, 50, 100],
  itemLabel = 'items',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  /** Generate page numbers with ellipsis */
  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    // Always show first page
    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    // Pages around current
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    // Always show last page
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
      {/* Left: Info text */}
      <div className="text-xs text-slate-500">
        Showing <span className="font-medium text-slate-700">{startItem}</span>–<span className="font-medium text-slate-700">{endItem}</span> of{' '}
        <span className="font-medium text-slate-700">{totalItems}</span> {itemLabel}
      </div>

      {/* Center: Page buttons */}
      <div className="flex items-center gap-1">
        {/* Previous */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-2 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          ‹
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((page, idx) =>
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs text-slate-400">
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[28px] px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                page === currentPage
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {page}
            </button>
          ),
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-2 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          ›
        </button>
      </div>

      {/* Right: Items per page selector */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>Per page:</span>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="px-2 py-1 border border-slate-200 rounded-md text-xs bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        >
          {pageSizeOptions.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default TablePagination;

/**
 * Helper hook for managing pagination state.
 * Returns currentPage, itemsPerPage, paginated slice, and handlers.
 *
 * Usage:
 *   const { currentPage, itemsPerPage, paginatedItems, totalPages, setPage, setItemsPerPage } = usePagination(filteredData, 25);
 */
export function usePagination<T>(items: T[], defaultPerPage = 25) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPageState] = React.useState(defaultPerPage);

  // Reset to page 1 when items change (e.g. filter changed)
  const itemsLength = items.length;
  const prevLength = React.useRef(itemsLength);
  React.useEffect(() => {
    if (itemsLength !== prevLength.current) {
      setCurrentPage(1);
      prevLength.current = itemsLength;
    }
  }, [itemsLength]);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  // Clamp page to valid range
  const safePage = Math.min(currentPage, totalPages);
  if (safePage !== currentPage) {
    setCurrentPage(safePage);
  }

  const startIdx = (safePage - 1) * itemsPerPage;
  const paginatedItems = items.slice(startIdx, startIdx + itemsPerPage);

  const setPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const setItemsPerPage = (size: number) => {
    setItemsPerPageState(size);
    setCurrentPage(1);
  };

  return {
    currentPage: safePage,
    itemsPerPage,
    paginatedItems,
    totalPages,
    totalItems: items.length,
    setPage,
    setItemsPerPage,
  };
}
