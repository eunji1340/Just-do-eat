import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/shared/ui/shadcn/button";

type ShareButtonProps = {
  url: string;
  title: string;
};

export function ShareButton({ url, title }: ShareButtonProps) {
  const [pending, setPending] = useState(false);

  const handleShare = async () => {
    if (!url) return;
    setPending(true);

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      window.alert("링크를 복사했어요. 친구에게 공유해 보세요!");
    } catch (error) {
      console.error(error);
      window.alert("공유에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-11 w-11 rounded-full bg-white shadow-sm"
      onClick={() => {
        void handleShare();
      }}
      disabled={pending}
      aria-label="약속 공유하기"
      title="약속 공유하기"
    >
      <Share2 className="h-5 w-5" />
    </Button>
  );
}

