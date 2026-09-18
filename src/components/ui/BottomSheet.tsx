import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  headerRightAction?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: string; // e.g. "max-h-[90vh]"
  maxWidth?: string; // e.g. "max-w-2xl" or "max-w-lg"
  fullScreenMobile?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  headerRightAction,
  children,
  footer,
  maxHeight = 'max-h-[90vh]',
  maxWidth = 'max-w-2xl',
  fullScreenMobile = false,
}) => {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  // Reset drag position when opened/closed
  useEffect(() => {
    if (isOpen) {
      setDragY(0);
      setIsDragging(false);
    }
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Touch Handlers for Drag-to-Dismiss
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only allow drag initiation if touch starts near top header or handle, or at top of scroll
    const touch = e.touches[0];
    startYRef.current = touch.clientY;
    currentYRef.current = touch.clientY;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const deltaY = touch.clientY - startYRef.current;
    // Only allow downward drag
    if (deltaY > 0) {
      setDragY(deltaY);
      currentYRef.current = touch.clientY;
    } else {
      setDragY(0);
    }
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    const deltaY = currentYRef.current - startYRef.current;

    // If dragged down more than 110px or with significant velocity, close sheet
    if (deltaY > 110) {
      setDragY(window.innerHeight);
      setTimeout(() => {
        onClose();
        setDragY(0);
      }, 200);
    } else {
      // Snap back to open state
      setDragY(0);
    }
  }, [isDragging, onClose]);

  // Mouse drag handlers for desktop / testing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    startYRef.current = e.clientY;
    currentYRef.current = e.clientY;
    setIsDragging(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startYRef.current;
      if (deltaY > 0) {
        setDragY(deltaY);
        currentYRef.current = moveEvent.clientY;
      } else {
        setDragY(0);
      }
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      setIsDragging(false);
      const deltaY = upEvent.clientY - startYRef.current;
      if (deltaY > 110) {
        setDragY(window.innerHeight);
        setTimeout(() => {
          onClose();
          setDragY(0);
        }, 200);
      } else {
        setDragY(0);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-end justify-center bg-slate-950/80 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`relative w-full ${maxWidth} mx-auto bg-slate-900 border-t border-x border-slate-700/80 ${
          fullScreenMobile ? 'h-[95vh] rounded-t-3xl' : `${maxHeight} rounded-t-3xl`
        } shadow-2xl overflow-hidden flex flex-col z-10`}
      >
        {/* Grab Bar & Drag Handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          className="w-full pt-3 pb-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none shrink-0 group hover:bg-slate-800/30 transition-colors"
        >
          <div className="w-14 h-1.5 bg-slate-700 group-hover:bg-slate-600 rounded-full transition-colors" />
          <div className="text-[10px] text-slate-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            برای بستن به پایین بکشید
          </div>
        </div>

        {/* Header Bar */}
        {(title || icon || headerRightAction) && (
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="px-5 py-3 border-b border-slate-800 flex items-center justify-between shrink-0 select-none"
          >
            <div className="flex items-center gap-2.5">
              {icon && (
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                  {icon}
                </div>
              )}
              <div>
                {title && (
                  <h3 className="text-sm font-bold text-white leading-tight">{title}</h3>
                )}
                {subtitle && (
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {headerRightAction}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="بستن"
                aria-label="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Body Content */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>

        {/* Optional Fixed Footer Actions */}
        {footer && (
          <div className="shrink-0 border-t border-slate-800 bg-slate-950/90">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
