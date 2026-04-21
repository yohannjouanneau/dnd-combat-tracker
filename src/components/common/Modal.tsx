import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";
import IconButton from "./IconButton";

type Size = "sm" | "md" | "lg" | "xl" | "full";
type Layer = "base" | "library" | "dialog" | "top";

const SIZE_CLASSES: Record<Size, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[95vw]",
};

const LAYER_Z: Record<Layer, { backdrop: string; container: string }> = {
  base: { backdrop: "z-20", container: "z-20" },
  library: { backdrop: "z-30", container: "z-30" },
  dialog: { backdrop: "z-40", container: "z-50" },
  top: { backdrop: "z-[60]", container: "z-[70]" },
};

// ---- Sub-components ----

function ModalBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-y-auto flex-1 p-4 md:p-6", className)}>
      {children}
    </div>
  );
}

function ModalFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-t border-border-primary p-4 md:p-6 flex-shrink-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ---- Main Modal ----

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: Size;
  layer?: Layer;
  /** Override default title font size; defaults to "text-xl font-bold" */
  titleClassName?: string;
  /** Extra classes for the inner container (bg-panel-bg box) */
  className?: string;
  /** Extra classes for the header section */
  headerClassName?: string;
  /** Rendered to the right of the title in the header */
  headerActions?: React.ReactNode;
  children: React.ReactNode;
};

function Modal({
  open,
  onClose,
  title,
  size = "md",
  layer = "base",
  className,
  headerClassName,
  titleClassName,
  headerActions,
  children,
}: Props) {
  const { backdrop, container } = LAYER_Z[layer];
  const titleId = useId();
  const boxRef = useRef<HTMLDivElement>(null);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Escape key
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Focus trap + focus restoration
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusableSelectors =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const getFocusable = () =>
      Array.from(
        boxRef.current?.querySelectorAll<HTMLElement>(focusableSelectors) ?? [],
      );

    // Move focus into the modal
    getFocusable()[0]?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleTab);
    return () => {
      window.removeEventListener("keydown", handleTab);
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "!mt-0 fixed inset-0 bg-black/50 backdrop-blur-sm",
          backdrop,
        )}
        onClick={onClose}
      />

      {/* Centering wrapper */}
      <div
        className={cn(
          "fixed inset-0 flex items-center justify-center p-4",
          container,
        )}
      >
        {/* Modal box */}
        <div
          ref={boxRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={cn(
            "bg-panel-bg rounded-lg border border-border-primary w-full max-h-[90vh] shadow-xl flex flex-col overflow-hidden",
            SIZE_CLASSES[size],
            className,
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className={cn(
              "flex items-center justify-between p-4 md:p-6 border-b border-border-primary flex-shrink-0",
              headerClassName,
            )}
          >
            <h2
              id={titleId}
              className={cn(
                "text-xl font-bold text-text-primary",
                titleClassName,
              )}
            >
              {title}
            </h2>
            <div className="flex items-center gap-2">
              {headerActions}
              <IconButton variant="ghost" onClick={onClose} aria-label="Close">
                <X className="w-5 h-5" />
              </IconButton>
            </div>
          </div>

          {children}
        </div>
      </div>
    </>,
    document.body,
  );
}

Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export default Modal;
