import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/shared/ui/shadcn/button";
import { cn } from "@/shared/lib/utils";

type RefreshButtonProps = {
  onRefresh: () => Promise<unknown> | void;
  isLoading?: boolean;
};

export function RefreshButton({ onRefresh, isLoading }: RefreshButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading || internalLoading) return;

    try {
      const maybePromise = onRefresh();
      if (maybePromise instanceof Promise) {
        setInternalLoading(true);
        await maybePromise;
      }
    } finally {
      setInternalLoading(false);
    }
  };

  const spinning = Boolean(isLoading || internalLoading);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-11 w-11 rounded-full bg-white shadow-sm"
      onClick={() => {
        void handleClick();
      }}
      aria-label="약속 새로고침"
      title="약속 새로고침"
      disabled={spinning}
    >
      <RotateCcw
        className={cn("h-5 w-5", spinning && "animate-spin text-primary")}
      />
    </Button>
  );
}

