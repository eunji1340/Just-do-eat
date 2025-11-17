// src/shared/ui/sheet/bottom-sheet.tsx
import * as React from "react";
import { createPortal } from "react-dom";
import type { MouseEventHandler } from "react";

type Ctx = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  anchorSelector?: string;
};
const SheetCtx = React.createContext<Ctx | null>(null);
const useSheetCtx = () => {
  const ctx = React.useContext(SheetCtx);
  if (!ctx) throw new Error("BottomSheet.* must be used within BottomSheet");
  return ctx;
};

type RootProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorSelector?: string; // 예: "#app-content-root"
  children: React.ReactNode;
};
function Root({ open, onOpenChange, anchorSelector, children }: RootProps) {
  const mountRef = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    if (!mountRef.current) mountRef.current = document.body;
  }, []);

  // ESC + 스크롤락
  React.useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  if (!mountRef.current || !open) return null;
  const node = (
    <SheetCtx.Provider value={{ open, onOpenChange, anchorSelector }}>
      <div className="fixed inset-0 z-[1000]" aria-modal="true" role="dialog" data-bottomsheet>
        {children}
        <style>{`
          @keyframes bottomsheet-in {
            from { transform: translateY(100%); opacity: .98; }
            to   { transform: translateY(0%);   opacity: 1;   }
          }
        `}</style>
      </div>
    </SheetCtx.Provider>
  );
  return createPortal(node, mountRef.current);
}

function Overlay({ closeOnClick = true }: { closeOnClick?: boolean }) {
  const { onOpenChange } = useSheetCtx();
  return (
    <div
      className="absolute inset-0 bg-black/50"
      onClick={() => closeOnClick && onOpenChange(false)}
    />
  );
}

function useAnchoredStyle(anchorSelector?: string) {
  const [style, setStyle] = React.useState<React.CSSProperties>({
    position: "absolute",
    left: 0,
    width: "100%",
    maxWidth: 768,
  });

  React.useEffect(() => {
    const update = () => {
      const anchor = anchorSelector ? document.querySelector(anchorSelector) : null;
      if (anchor) {
        const rect = anchor.getBoundingClientRect();
        setStyle({ position: "absolute", left: rect.left, width: rect.width, maxWidth: rect.width });
      } else {
        const maxW = Math.min(640, window.innerWidth);
        const left = (window.innerWidth - maxW) / 2;
        setStyle({ position: "absolute", left, width: maxW, maxWidth: maxW });
      }
    };
    update();
    const onWin = () => update();
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    return () => {
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
    };
  }, [anchorSelector]);

  return style;
}

function Content({
  children,
  className = "",
}: { children: React.ReactNode; className?: string }) {
  const { anchorSelector } = useSheetCtx();
  const style = useAnchoredStyle(anchorSelector);
  return (
    <div
      className={
        "absolute bottom-0 rounded-t-2xl bg-white shadow-2xl border border-black/5 p-4 " +
        "animate-[bottomsheet-in_180ms_ease-out] " + className
      }
      style={{ ...style, willChange: "transform" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-black/10" />
      {children}
    </div>
  );
}

function Header({ align = "start", children }: { align?: "start" | "center"; children: React.ReactNode }) {
  return <header className={`mb-3 ${align === "center" ? "text-center" : ""}`}>{children}</header>;
}
function Title({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}
function Description({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-sm text-black/60">{children}</p>;
}
function Footer({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 flex justify-end gap-2">{children}</div>;
}

function Close<P extends { onClick?: MouseEventHandler }>(props: {
  asChild?: boolean;
  children: React.ReactElement<P>;
  onClick?: () => void;
}) {
  const { onOpenChange } = useSheetCtx();
  const { asChild, children, onClick } = props;

  if (asChild) {
    // children이 유효한 ReactElement인지 체크
    if (!React.isValidElement<P>(children)) {
      return null;
    }

    return React.cloneElement(children, {
      ...children.props,
      onClick: (e: any) => {
        children.props?.onClick?.(e);
        onClick?.();
        onOpenChange(false);
      },
    });
  }

  return (
    <button
      type="button"
      onClick={() => {
        onClick?.();
        onOpenChange(false);
      }}
      className="h-10 rounded-md border border-black/10 px-4 text-sm"
    >
      닫기
    </button>
  );
}

export const BottomSheet = Object.assign(Root, {
  Overlay,
  Content,
  Header,
  Title,
  Description,
  Footer,
  Close,
});
export default BottomSheet;
