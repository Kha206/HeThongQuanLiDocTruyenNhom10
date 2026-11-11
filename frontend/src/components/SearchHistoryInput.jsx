import React, { useState, useRef, useEffect, useId } from 'react';
import { Search, Clock, X } from 'lucide-react';
import { useSearchHistory } from '../hooks/useSearchHistory';

/**
 * Reusable YouTube-style search input with per-account local search history dropdown,
 * keyboard navigation (ArrowUp/ArrowDown/Enter/Escape), and responsive dark-theme styling.
 */
const SearchHistoryInput = ({
  value,
  onChange,
  onSubmitSearch,
  onClear,
  showClearButton = false,
  placeholder = 'Tìm kiếm...',
  ariaLabel = 'Tìm kiếm truyện',
  formClassName = 'relative w-full',
  inputClassName = '',
  iconClassName = 'w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none',
  clearButtonClassName = 'absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-white transition-colors duration-150',
  dropdownClassName = '',
}) => {
  const { addTerm, removeTerm, clearAll, getSuggestions } = useSearchHistory();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listboxId = useId();

  const suggestions = getSuggestions(value);
  const shouldShowDropdown = isOpen && suggestions.length > 0;
  const safeActiveIndex =
    activeIndex >= 0 && activeIndex < suggestions.length ? activeIndex : -1;

  // Close dropdown on click/tap outside the search form
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleOutsidePointer = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleOutsidePointer);
    document.addEventListener('touchstart', handleOutsidePointer);
    return () => {
      document.removeEventListener('mousedown', handleOutsidePointer);
      document.removeEventListener('touchstart', handleOutsidePointer);
    };
  }, [isOpen]);

  const executeSearch = (rawTerm, shouldUpdateInput = false) => {
    const term = typeof rawTerm === 'string' ? rawTerm : '';
    if (shouldUpdateInput) {
      onChange(term);
    }
    setIsOpen(false);
    setActiveIndex(-1);
    addTerm(term);
    if (typeof onSubmitSearch === 'function') {
      onSubmitSearch(term);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (shouldShowDropdown && safeActiveIndex >= 0) {
      executeSearch(suggestions[safeActiveIndex], true);
      return;
    }
    executeSearch(value, false);
  };

  const handleInputChange = (e) => {
    onChange(e.target.value);
    setIsOpen(true);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      if (suggestions.length === 0) return;
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(0);
      } else {
        setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      if (suggestions.length === 0) return;
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(suggestions.length - 1);
      } else {
        setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
      }
      return;
    }

    if (e.key === 'Escape' && shouldShowDropdown) {
      e.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleContainerBlur = (e) => {
    // Close only when focus genuinely leaves the entire search widget (e.g., via Tab)
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget)) {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleRemoveItem = (e, term) => {
    e.stopPropagation();
    const updated = removeTerm(term);
    if (updated.length === 0) {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    clearAll();
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleClearInput = () => {
    if (typeof onClear === 'function') {
      onClear();
    } else {
      onChange('');
    }
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <form
      ref={containerRef}
      onSubmit={handleFormSubmit}
      onBlur={handleContainerBlur}
      className={formClassName}
      role="search"
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={inputClassName}
        role="combobox"
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={shouldShowDropdown}
        aria-controls={shouldShowDropdown ? listboxId : undefined}
        aria-activedescendant={
          shouldShowDropdown && safeActiveIndex >= 0
            ? `${listboxId}-option-${safeActiveIndex}`
            : undefined
        }
        autoComplete="off"
      />

      <Search className={iconClassName} aria-hidden="true" />

      {showClearButton && value && (
        <button
          type="button"
          onClick={handleClearInput}
          className={clearButtonClassName}
        >
          Xóa
        </button>
      )}

      {shouldShowDropdown && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Lịch sử tìm kiếm gần đây"
          onMouseDown={(e) => e.preventDefault()}
          className={`absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#1A1A22] border border-[#2A2A38] rounded-xl shadow-2xl overflow-hidden transition-all duration-150 ${dropdownClassName}`}
        >
          <div className="max-h-72 overflow-y-auto py-1">
            {suggestions.map((term, index) => {
              const isActive = index === safeActiveIndex;
              return (
                <div
                  key={term}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => executeSearch(term, true)}
                  className={`group flex items-center justify-between gap-2 px-3 py-2 cursor-pointer transition-colors duration-150 border-l-2 ${
                    isActive
                      ? 'bg-[#23232E] text-white border-[#ED1D24]'
                      : 'text-gray-200 hover:bg-[#23232E] hover:text-white border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Clock
                      className={`w-3.5 h-3.5 flex-shrink-0 transition-colors duration-150 ${
                        isActive ? 'text-[#ED1D24]' : 'text-gray-500 group-hover:text-gray-300'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="text-sm truncate">{term}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleRemoveItem(e, term)}
                    aria-label={`Xóa "${term}" khỏi lịch sử`}
                    className="p-1 rounded-md text-gray-500 hover:text-[#ED1D24] hover:bg-[#2A2A38] flex-shrink-0 transition-colors duration-150"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="border-t border-[#2A2A38] px-3 py-2 bg-[#15151C] flex items-center justify-between">
            <span className="text-[11px] text-gray-500">Tìm kiếm gần đây</span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs font-medium text-gray-400 hover:text-[#ED1D24] transition-colors duration-150"
            >
              Xóa tất cả
            </button>
          </div>
        </div>
      )}
    </form>
  );
};

export default SearchHistoryInput;

