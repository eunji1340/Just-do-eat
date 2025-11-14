// src/features/groups/ui/CreatePlanSheet.tsx
// 목적: 약속(플랜) 생성 바텀 시트 UI
// - group 만들기 시트(CreateGroupSheet)를 재활용하되
//   약속에 필요한 필드(이름, 장소, 가격대, 날짜, 시간, 참여자)를 모두 입력받는다.

import * as React from "react";
import BottomSheet from "@/shared/ui/sheet/BottomSheet";
import { Button } from "@/shared/ui/shadcn/button";
// TODO: 실제 API 경로/이름에 맞게 수정하세요.
import { createPlan, type CreatePlanPayload } from "@/features/groups/api/createPlan";
import { ChevronDown } from "lucide-react";

import TimePickerInSheet from "@/shared/ui/time-picker/TimePickerInSheet";
import { Calendar } from "@/shared/ui/calendar/calendar"; // 실제 경로에 맞게 수정
import { cn } from "@/shared/lib/utils";

function formatKoreanDate(value: string) {
  if (!value) return "날짜 선택";
  const [y, m, d] = value.split("-");
  return `${y}년 ${m}월 ${d}일`;
}

type PriceRange = "LOW" | "MEDIUM" | "HIGH" | "PREMIUM" | "";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated?: (id: number) => void;
  groupId?: number;
};

export default function CreatePlanSheet({ open, onOpenChange, onCreated, groupId }: Props) {
  // 👇 각각의 입력 필드 상태
  const [title, setTitle] = React.useState("");
  const [place, setPlace] = React.useState("");
  const [priceRange, setPriceRange] = React.useState<PriceRange>("");
  const [date, setDate] = React.useState(""); // "YYYY-MM-DD"
  const [dateOpen, setDateOpen] = React.useState(false);
  const [time, setTime] = React.useState(""); // "HH:MM"
  const [timeOpen, setTimeOpen] = React.useState(false);
  const [participants, setParticipants] = React.useState(""); // "이름1, 이름2"

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ✅ 모든 필드에 공통으로 쓰는 클래스 (UI 통일)
  const baseFieldClass =
    "h-10 w-full rounded-md border border-black/10 bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-black/10";

  // 시트 열릴 때마다 폼 리셋
  React.useEffect(() => {
    if (open) {
      setTitle("");
      setPlace("");
      setPriceRange("");
      setDate("");
      setTime("");
      setParticipants("");
      setError(null);
      setLoading(false);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) return setError("약속 이름을 입력해 주세요.");
    if (!place.trim()) return setError("장소를 입력해 주세요.");
    if (!priceRange) return setError("가격대를 선택해 주세요.");
    if (!date) return setError("날짜를 선택해 주세요.");
    if (!time) return setError("시간을 선택해 주세요.");
    if (!participants.trim()) return setError("참여자를 입력해 주세요.");

    try {
      setLoading(true);

      const participantList = participants
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);

      const payload: CreatePlanPayload = {
        title: title.trim(),
        place: place.trim(),
        priceRange: priceRange as Exclude<PriceRange, "">,
        date,
        time,
        participants: participantList,
        groupId,
      };

      const { id } = await createPlan(payload);

      onOpenChange(false);
      onCreated?.(id);
    } catch (err: any) {
      setError(err?.message || "약속 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} anchorSelector="#app-content-root">
      <BottomSheet.Overlay />
      {/* 📌 flex 레이아웃 + 최대 높이 지정 */}
      <BottomSheet.Content className="flex max-h-[90vh] flex-col">
        <BottomSheet.Header align="center">
          <BottomSheet.Title>약속 만들기</BottomSheet.Title>
        </BottomSheet.Header>

        {/* 📌 가운데 영역만 스크롤 */}
        <div className="flex-1 overflow-y-auto pr-1 pb-4">
          <form
            id="create-plan-form"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* 약속 이름 */}
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">
                약속 이름
              </label>
              <input
                id="title"
                data-autofocus
                className={baseFieldClass}
                placeholder="예) 을지로 맛집 탐방"
                maxLength={50}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* 장소 */}
            <div className="grid gap-2">
              <label htmlFor="place" className="text-sm font-medium">
                장소
              </label>
              <input
                id="place"
                className={baseFieldClass}
                placeholder="예) 을지로 3가역 근처"
                maxLength={100}
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                required
              />
            </div>

            {/* 가격대 */}
            <div className="grid gap-2">
              <label htmlFor="priceRange" className="text-sm font-medium">
                가격대
              </label>
              <div className="relative">
                <select
                  id="priceRange"
                  className={cn(baseFieldClass, "appearance-none pr-8")}
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value as PriceRange)}
                  required
                >
                  <option value="">선택해 주세요</option>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="PREMIUM">PREMIUM</option>
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
              </div>
            </div>

            {/* 날짜 */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">날짜</label>
              <button
                type="button"
                onClick={() => setDateOpen((prev) => !prev)}
                className={cn(baseFieldClass, "flex items-center justify-between")}
              >
                <span>{formatKoreanDate(date)}</span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 transition-transform",
                    dateOpen && "rotate-180"
                  )}
                  aria-hidden
                />
              </button>

              {dateOpen && (
                <div className="mt-2 flex justify-center rounded-xl border border-border bg-card p-3">
                  <Calendar
                    mode="single"
                    selected={date ? new Date(date + "T00:00:00") : undefined}
                    onSelect={(d: Date | undefined) => {
                      if (!d) return;
                      const year = d.getFullYear();
                      const month = `${d.getMonth() + 1}`.padStart(2, "0");
                      const day = `${d.getDate()}`.padStart(2, "0");
                      const iso = `${year}-${month}-${day}`;
                      setDate(iso);
                    }}
                  />
                </div>
              )}
            </div>

            {/* 시간 */}
            <TimePickerInSheet
              value={time}
              onChange={setTime}
              open={timeOpen}
              onOpenChange={setTimeOpen}
            />

            {/* 참여자 */}
            <div className="grid gap-2">
              <label htmlFor="participants" className="text-sm font-medium">
                참여자
              </label>
              <input
                id="participants"
                className={baseFieldClass}
                placeholder="예) 철수, 영희, 민수"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                (임시) 쉼표로 구분해서 입력해 주세요. 나중에 모임 멤버 리스트에서 선택하도록 개선 가능
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </form>
        </div>

        {/* 📌 하단 생성 버튼 고정 */}
        <BottomSheet.Footer>
          <Button
            type="submit"
            form="create-plan-form"
            disabled={loading}
            className="w-full"
          >
            {loading ? "생성 중..." : "생성"}
          </Button>
        </BottomSheet.Footer>
      </BottomSheet.Content>
    </BottomSheet>
  );
}
