// src/features/groups/ui/CreatePlanSheet.tsx
// 목적: 약속(플랜) 생성 바텀 시트 UI
// - /plans/{roomId} POST API와 연결
// - 약속에 필요한 필드(이름, 날짜/시간, 가격대, 싫어하는 카테고리, 참여자)를 입력받는다.

import * as React from "react";
import BottomSheet from "@/shared/ui/sheet/BottomSheet";
import { Button } from "@/shared/ui/shadcn/button";
import {
  createPlan,
  type CreatePlanPayload,
  type PriceRangeCode,
} from "@/features/group-detail/createPlan";
import { ChevronDown } from "lucide-react";

import TimePickerInSheet from "@/shared/ui/time-picker/TimePickerInSheet";
import { Calendar } from "@/shared/ui/calendar/calendar";
import { cn } from "@/shared/lib/utils";

import { useNavigate } from "react-router-dom";

function formatKoreanDate(value: string) {
  if (!value) return "날짜 선택";
  const [y, m, d] = value.split("-");
  return `${y}년 ${m}월 ${d}일`;
}

// 💰 가격대 옵션
const PRICE_RANGE_OPTIONS: { value: PriceRangeCode; label: string }[] = [
  { value: "LOW", label: "LOW" },
  { value: "MEDIUM", label: "MEDIUM" },
  { value: "HIGH", label: "HIGH" },
  { value: "PREMIUM", label: "PREMIUM" },
];

// 😣 싫어하는 카테고리 옵션
const DISLIKE_CATEGORY_OPTIONS = [
  "한식",
  "중식",
  "일식",
  "양식",
  "분식",
  "치킨",
  "패스트푸드",
  "디저트",
  "샐러드",
  "아시아/퓨전",
  "뷔페/패밀리",
  "술집",
] as const;

// 🔹 GroupDetail의 roomMemberList 모양에 맞춰 주세요
type Member = {
  userId: number;
  userName: string;
  imageUrl?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated?: (id: number) => void;
  groupId: number; // roomId (이제 필수)
  members: Member[];
};

export default function CreatePlanSheet({
  open,
  onOpenChange,
  onCreated,
  groupId,
  members,
}: Props) {
  
  const navigate = useNavigate()
  // 👇 폼 상태들
  const [title, setTitle] = React.useState(""); // planName
  const [date, setDate] = React.useState(""); // "YYYY-MM-DD"
  const [dateOpen, setDateOpen] = React.useState(false);
  const [time, setTime] = React.useState(""); // "HH:MM"
  const [timeOpen, setTimeOpen] = React.useState(false);

  // 가격대: 여러 개 선택
  const [selectedPriceRanges, setSelectedPriceRanges] = React.useState<
    PriceRangeCode[]
  >([]);

  // 싫어하는 카테고리: 여러 개 선택
  const [dislikeCategories, setDislikeCategories] = React.useState<string[]>(
    []
  );

  // ✅ 참여자: 선택된 userId 목록
  const [selectedParticipantIds, setSelectedParticipantIds] = React.useState<
    number[]
  >([]);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ✅ 모든 필드에 공통으로 쓰는 클래스 (UI 통일)
  const baseFieldClass =
    "h-10 w-full rounded-md border border-black/10 bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-black/10";

  // 시트 열릴 때마다 폼 리셋
  React.useEffect(() => {
    if (open) {
      setTitle("");
      setDate("");
      setTime("");
      setSelectedPriceRanges([]);
      setDislikeCategories([]);
      setSelectedParticipantIds([]);
      setError(null);
      setLoading(false);
    }
  }, [open]);

  function togglePriceRange(value: PriceRangeCode) {
    setSelectedPriceRanges((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function toggleDislikeCategory(value: string) {
    setDislikeCategories((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function toggleParticipant(userId: number) {
    setSelectedParticipantIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) return setError("약속 이름을 입력해 주세요.");
    if (!date) return setError("날짜를 선택해 주세요.");
    if (!time) return setError("시간을 선택해 주세요.");
    if (selectedPriceRanges.length === 0)
      return setError("가격대를 한 개 이상 선택해 주세요.");
    if (selectedParticipantIds.length === 0)
      return setError("참여자를 한 명 이상 선택해 주세요.");

    try {
      setLoading(true);

      // "2025-12-31T19:00:00" 형태로 변환
      const startsAt = `${date}T${time}:00`;

      // TODO: 실제 지도 중심 좌표 / 반경 값으로 교체
      const centerLat = 37.500901;
      const centerLon = 127.028639;
      const radiusM = 1000;

      const payload: CreatePlanPayload = {
        roomId: groupId,
        planName: title.trim(),
        centerLat,
        centerLon,
        radiusM,
        startsAt,
        participantIds: selectedParticipantIds, // ✅ 여기!
        dislikeCategories,
        priceRanges: selectedPriceRanges,
      };

      const { id } = await createPlan(payload);

      onOpenChange(false);
      onCreated?.(id);

      navigate(`/plans/${id}`)
    } catch (err: any) {
      setError(err?.message || "약속 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      anchorSelector="#app-content-root"
    >
      <BottomSheet.Overlay />
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
                placeholder="예) 강남 저녁 회식"
                maxLength={50}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* 날짜 */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">날짜</label>
              <button
                type="button"
                onClick={() => setDateOpen((prev) => !prev)}
                className={cn(
                  baseFieldClass,
                  "flex items-center justify-between"
                )}
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

            {/* 가격대 (멀티 선택) */}
            <div className="grid gap-2">
              <span className="text-sm font-medium">가격대</span>
              <div className="flex flex-wrap gap-2">
                {PRICE_RANGE_OPTIONS.map((opt) => {
                  const selected = selectedPriceRanges.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => togglePriceRange(opt.value)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                여러 개 선택할 수 있어요.
              </p>
            </div>

            {/* 싫어하는 카테고리 (멀티 선택) */}
            <div className="grid gap-2">
              <span className="text-sm font-medium">싫어하는 카테고리</span>
              <div className="flex flex-wrap gap-2">
                {DISLIKE_CATEGORY_OPTIONS.map((cat) => {
                  const selected = dislikeCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleDislikeCategory(cat)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs",
                        selected
                          ? "border-destructive bg-destructive text-destructive-foreground"
                          : "border-border bg-background text-foreground"
                      )}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                선택한 카테고리는 추천 결과에서 제외돼요.
              </p>
            </div>

            {/* ✅ 참여자 선택 (멤버 목록 기반) */}
            <div className="grid gap-2">
              <span className="text-sm font-medium">참여자</span>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => {
                  const selected = selectedParticipantIds.includes(m.userId);
                  return (
                    <button
                      key={m.userId}
                      type="button"
                      onClick={() => toggleParticipant(m.userId)}
                      className={cn(
                        "flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground"
                      )}
                    >
                      {/* 간단한 이니셜 아바타 (나중에 공용 컴포넌트로 뽑아도 됨) */}
                      <div className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px]">
                        {m.userName.slice(0, 2)}
                      </div>
                      <span>{m.userName}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                함께 약속에 참여할 멤버를 선택해 주세요.
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
