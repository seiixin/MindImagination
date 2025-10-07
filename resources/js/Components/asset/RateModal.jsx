import { useEffect, useRef, useState } from "react";
import { X, Star } from "lucide-react";

export default function RateModal({
  isOpen,
  onClose,
  onSubmit,      // async (value: 1..5) => Promise<void>
  initialValue,  // number|null
  disabled = false,
}) {
  const [value, setValue] = useState(initialValue || 0);
  const [hover, setHover] = useState(0);
  const dialogRef = useRef(null);
  const firstFocusRef = useRef(null);
  const lastFocusRef = useRef(null);
  const prevOverflow = useRef("");

  // Sync value with prop / open state
  useEffect(() => {
    setValue(initialValue || 0);
  }, [initialValue, isOpen]);

  // Lock scroll & focus when open
  useEffect(() => {
    if (!isOpen) return;
    prevOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // focus the first focusable element
    setTimeout(() => firstFocusRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = prevOverflow.current || "";
    };
  }, [isOpen]);

  // Focus trap
  const onTrapTab = (e) => {
    if (e.key !== "Tab") return;
    const focusables = dialogRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables || !focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!isOpen) return null;

  const active = hover || value;

  // Keyboard support inside modal
  const onKeyDown = async (e) => {
    if (disabled) return;

    // Close on Esc
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }

    // Numbers 1..5 set rating
    if (/^[1-5]$/.test(e.key)) {
      setValue(Number(e.key));
      return;
    }

    // Left/Right arrows adjust rating
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setValue((v) => Math.max(1, v ? v - 1 : 1));
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setValue((v) => Math.min(5, v ? v + 1 : 1));
      return;
    }

    // Enter submits if set
    if (e.key === "Enter" && value) {
      e.preventDefault();
      await onSubmit?.(value);
      onClose();
      return;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-sm rounded-2xl bg-[#334155] border border-[#475569]/40 p-4 text-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Rate this asset"
        onKeyDown={(e) => {
          onTrapTab(e);
          onKeyDown(e);
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Rate this Asset</h3>
          <button
            ref={firstFocusRef}
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40 rounded p-1"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm opacity-80 mb-3">Choose a rating from 1 to 5 stars.</p>

        {/* Stars */}
        <div className="flex items-center gap-2 justify-center py-3">
          {Array.from({ length: 5 }).map((_, i) => {
            const idx = i + 1;
            const filled = idx <= active;
            return (
              <button
                key={idx}
                type="button"
                onMouseEnter={() => setHover(idx)}
                onMouseLeave={() => setHover(0)}
                onFocus={() => setHover(idx)}
                onBlur={() => setHover(0)}
                onClick={() => setValue(idx)}
                className="p-1 focus:outline-none focus:ring-2 focus:ring-white/40 rounded"
                aria-label={`Set rating to ${idx} ${idx === 1 ? "star" : "stars"}`}
                aria-pressed={value === idx}
                disabled={disabled}
              >
                <Star
                  size={28}
                  className={filled ? "text-yellow-400" : "text-yellow-400/30"}
                  fill={filled ? "currentColor" : "none"}
                />
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4">
          {/* Clear rating (optional) */}
          <button
            type="button"
            onClick={() => setValue(0)}
            disabled={disabled || value === 0}
            className={`px-3 py-1.5 rounded border-2 border-[#b5946f] ${
              value === 0 || disabled
                ? "bg-[#c7ad88] text-black opacity-60 cursor-not-allowed"
                : "bg-transparent text-white hover:bg-white/10"
            }`}
            aria-label="Clear rating"
          >
            Clear
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-[#c7ad88] text-black border-2 border-[#b5946f] hover:bg-[#b5946f] hover:text-white transition"
            >
              Cancel
            </button>
            <button
              ref={lastFocusRef}
              type="button"
              onClick={async () => {
                if (!value) return;
                await onSubmit?.(value);
                onClose();
              }}
              disabled={!value || disabled}
              className={`px-3 py-1.5 rounded border-2 border-[#b5946f] ${
                !value || disabled
                  ? "bg-[#c7ad88] text-black opacity-60 cursor-not-allowed"
                  : "bg-[#b5946f] text-white hover:brightness-110"
              }`}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
