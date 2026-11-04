import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Reusable Pagination Component
 * Supports dark theme (#0F0F14, #1A1A22, #ED1D24), responsive layout,
 * ellipsis collapse for many pages, and accessible keyboard navigation.
 */
const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = ''
}) => {
  if (totalPages <= 1) return null;

  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (safeCurrentPage >= totalPages - 3) {
      return [
        1,
        '...',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      ];
    }

    return [
      1,
      '...',
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
      '...',
      totalPages
    ];
  };

  const pages = getPageNumbers();

  const handlePageClick = (page) => {
    if (page === '...' || page === safeCurrentPage) return;
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <nav
      aria-label="Điều hướng phân trang"
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-[#1A1A22]/90 backdrop-blur-md rounded-2xl border border-[#2A2A38] shadow-lg ${className}`}
    >
      {/* Current page indicator */}
      <div className="text-xs sm:text-sm text-gray-400 font-outfit select-none">
        Trang <strong className="text-white font-mono font-semibold">{safeCurrentPage}</strong> / <span className="font-mono">{totalPages}</span>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => handlePageClick(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1}
          aria-label="Trang trước"
          className={`flex items-center gap-1 min-w-[34px] sm:min-w-[72px] h-9 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-medium transition-all font-outfit focus:outline-none focus:ring-2 focus:ring-[#ED1D24]/50 ${
            safeCurrentPage <= 1
              ? 'opacity-35 cursor-not-allowed text-gray-500 bg-[#121218] border border-[#22222E]'
              : 'bg-[#0F0F14] border border-[#2A2A38] text-gray-200 hover:text-white hover:border-[#ED1D24] hover:bg-[#23232E] active:scale-95'
          }`}
        >
          <ChevronLeft className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Trước</span>
        </button>

        {/* Page Number Buttons */}
        {pages.map((item, index) => {
          if (item === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                aria-hidden="true"
                className="w-7 sm:w-9 h-9 flex items-center justify-center text-gray-500 font-mono text-xs sm:text-sm select-none"
              >
                ...
              </span>
            );
          }

          const isCurrent = item === safeCurrentPage;

          return (
            <button
              key={`page-${item}`}
              type="button"
              onClick={() => handlePageClick(item)}
              aria-label={`Trang ${item}`}
              aria-current={isCurrent ? 'page' : undefined}
              className={`min-w-[34px] sm:min-w-[38px] h-9 px-2 rounded-xl text-xs sm:text-sm font-mono font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#ED1D24]/50 ${
                isCurrent
                  ? 'bg-[#ED1D24] text-white font-bold border border-[#ED1D24] shadow-md shadow-[#ED1D24]/40 cursor-default'
                  : 'bg-[#0F0F14] border border-[#2A2A38] text-gray-300 hover:text-white hover:border-[#ED1D24] hover:bg-[#23232E] active:scale-95'
              }`}
            >
              {item}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          type="button"
          onClick={() => handlePageClick(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= totalPages}
          aria-label="Trang sau"
          className={`flex items-center gap-1 min-w-[34px] sm:min-w-[72px] h-9 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-medium transition-all font-outfit focus:outline-none focus:ring-2 focus:ring-[#ED1D24]/50 ${
            safeCurrentPage >= totalPages
              ? 'opacity-35 cursor-not-allowed text-gray-500 bg-[#121218] border border-[#22222E]'
              : 'bg-[#0F0F14] border border-[#2A2A38] text-gray-200 hover:text-white hover:border-[#ED1D24] hover:bg-[#23232E] active:scale-95'
          }`}
        >
          <span className="hidden sm:inline">Sau</span>
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;

