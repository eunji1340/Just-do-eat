// src/features/groups/ui/CreateGroupSheet.tsx
import * as React from "react";
import BottomSheet from "@/shared/ui/sheet/BottomSheet";
import { Button } from "@/shared/ui/shadcn/button";
import { createGroup, type CreateGroupPayload } from "@/features/groups/api/createGroup";

type Props = { open: boolean; onOpenChange: (o: boolean) => void; onCreated?: (id: number) => void; };

export default function CreateGroupSheet({ open, onOpenChange, onCreated }: Props) {
  const [roomName, setroomName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => { if (open) { setroomName(""); setError(null); setLoading(false); } }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomName.trim()) return setError("모임 이름을 입력해 주세요.");
    try {
      setLoading(true);
      const payload: CreateGroupPayload = { roomName: roomName.trim() };
      const { id } = await createGroup(payload);
      onOpenChange(false);
      onCreated?.(id);
    } catch (err: any) {
      setError(err?.message || "그룹 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} anchorSelector="#app-content-root">
      <BottomSheet.Overlay />
      <BottomSheet.Content>
        <BottomSheet.Header align="center">
          <BottomSheet.Title>그룹 만들기</BottomSheet.Title>
        </BottomSheet.Header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <label htmlFor="roomName" className="text-sm font-medium">모임 이름</label>
            <input
              id="roomName"
              data-autofocus
              className="h-10 rounded-md border border-black/10 px-3 outline-none focus:ring-2 focus:ring-black/10"
              placeholder="예) 을지로 맛집 탐방"
              maxLength={50}
              value={roomName}
              onChange={(e) => setroomName(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

          <BottomSheet.Footer>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "생성 중..." : "생성"}
            </Button>
          </BottomSheet.Footer>
        </form>
      </BottomSheet.Content>
    </BottomSheet>
  );
}
