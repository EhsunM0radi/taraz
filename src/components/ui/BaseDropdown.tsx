import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface BaseDropdownOption<T = string> {
  value: T;
  label: string;
  sublabel?: string;
  badge?: string;
  icon?: React.ReactNode;
  color?: string;
  disabled?: boolean;
}

export interface BaseDropdownProps<T = string> {
  options: BaseDropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  accent?: 'emerald' | 'cyan' | 'purple' | 'amber' | 'rose';
  className?: string;
  renderOption?: (option: BaseDropdownOption<T>, isSelected: boolean) => React.ReactNode;
  renderSelected?: (selectedOption?: BaseDropdownOption<T>) => React.ReactNode;
}

const accentStyles = {
  emerald: {
    border: 'focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30',
    selectedBg: 'bg-emerald-500/15 text-emerald-300 font-bold',
    checkColor: 'text-emerald-400',
    activeGlow: 'border-emerald-500',
  },
  cyan: {
    border: 'focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30',
    selectedBg: 'bg-cyan-500/15 text-cyan-300 font-bold',
    checkColor: 'text-cyan-400',
    activeGlow: 'border-cyan-500',
  },
  purple: {
    border: 'focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30',
    selectedBg: 'bg-purple-500/15 text-purple-300 font-bold',
    checkColor: 'text-purple-400',
    activeGlow: 'border-purple-500',
  },
  amber: {
    border: 'focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30',
    selectedBg: 'bg-amber-500/15 text-amber-300 font-bold',
    checkColor: 'text-amber-400',
    activeGlow: 'border-amber-500',
  },
  rose: {
    border: 'focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30',
    selectedBg: 'bg-rose-500/15 text-rose-300 font-bold',
    checkColor: 'text-rose-400',
    activeGlow: 'border-rose-500',
  },
};

export function BaseDropdown<T = string>({
  options,
  value,
  onChange,
  label,
  placeholder = 'انتخاب کنید...',
  disabled = false,
  searchable = false,
  searchPlaceholder = 'جستجو...',
  emptyMessage,
  accent = 'emerald',
  className = '',
  renderOption,
  renderSelected,
}: BaseDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const style = accentStyles[accent] || accentStyles.emerald;
  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options if searchable
  const filteredOptions = searchable && searchQuery.trim()
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    if (isOpen) {
      const idx = filteredOptions.findIndex((opt) => opt.value === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    } else {
      setSearchQuery('');
      setHighlightedIndex(-1);
    }
  }, [isOpen, searchable]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
      e.preventDefault();
      const target = filteredOptions[highlightedIndex];
      if (!target.disabled) {
        onChange(target.value);
        setIsOpen(false);
      }
    }
  };

  const handleSelect = (option: BaseDropdownOption<T>) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full text-right ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full bg-slate-950 border border-slate-700/80 hover:border-slate-600 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm text-slate-100 flex items-center justify-between gap-2 transition-all cursor-pointer select-none outline-none ${
          isOpen ? `${style.activeGlow} ring-1 ring-emerald-500/20` : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-900' : ''}`}
      >
        <div className="flex items-center gap-2.5 truncate min-w-0">
          {renderSelected ? (
            renderSelected(selectedOption)
          ) : selectedOption ? (
            <div className="flex items-center gap-2.5 truncate">
              {selectedOption.icon && (
                <span className="shrink-0 text-slate-400">{selectedOption.icon}</span>
              )}
              {selectedOption.color && (
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: selectedOption.color }}
                />
              )}
              <span className="font-medium text-white truncate">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-[11px] text-slate-400 truncate">({selectedOption.sublabel})</span>
              )}
              {selectedOption.badge && (
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-500">{placeholder}</span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Floating Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 mt-1.5 w-full bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Optional Search Bar */}
          {searchable && (
            <div className="p-2 border-b border-slate-800 bg-slate-950/60">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-emerald-500 rounded-lg pr-8 pl-3 py-1.5 text-xs text-white outline-none placeholder-slate-500"
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div ref={listRef} className="max-h-60 overflow-y-auto p-1.5 space-y-1 text-xs">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-slate-500 text-xs">
                {emptyMessage || 'موردی یافت نشد'}
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <div
                    key={String(opt.value)}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-3 py-2.5 rounded-xl flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed'
                        : isSelected
                        ? style.selectedBg
                        : isHighlighted
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    {renderOption ? (
                      renderOption(opt, isSelected)
                    ) : (
                      <div className="flex items-center gap-2.5 truncate min-w-0">
                        {opt.icon && (
                          <span className="shrink-0 text-slate-400">{opt.icon}</span>
                        )}
                        {opt.color && (
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: opt.color }}
                          />
                        )}
                        <div className="truncate">
                          <div className="font-bold text-white text-xs truncate">{opt.label}</div>
                          {opt.sublabel && (
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {opt.sublabel}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 text-[10px] text-slate-300 font-mono">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className={`w-4 h-4 ${style.checkColor}`} />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
