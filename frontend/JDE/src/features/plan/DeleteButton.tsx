import { Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/shadcn/button";

type DeleteButtonProps = {
  planName: string;
  onConfirm?: () => void;
};

export function DeleteButton({ planName, onConfirm }: DeleteButtonProps) {
  const handleDelete = () => {
    const confirmed = window.confirm(
      `"${planName}" 약속을 삭제할까요?\n이 동작은 되돌릴 수 없어요.`
    );
    if (!confirmed) return;

    onConfirm?.();
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-11 w-11 rounded-full bg-white text-destructive shadow-sm"
      onClick={handleDelete}
      aria-label="약속 삭제하기"
      title="약속 삭제하기"
    >
      <Trash2 className="h-5 w-5" />
    </Button>
  );
}

