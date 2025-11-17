// src/pages/groups/InvitePage.tsx

import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TopNavBar } from "@/widgets/top-navbar";
import { Button } from "@/shared/ui/button";
import { joinRoomByToken } from "@/features/group-detail/api/joinRoomByToken";

export default function InvitePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = React.useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setErrorMsg("유효하지 않은 초대 링크입니다. (token이 없습니다)");
      return;
    }

    (async () => {
      try {
        const res = await joinRoomByToken(token);

        // ✅ 이미 참여(ALREADY)든 새로 참여(JOIN)든 둘 다 모임 상세로 보냄
        if (res.joinStatus === "JOIN" || res.joinStatus === "ALREADY") {
          navigate(`/groups/${res.roomId}`, { replace: true });
          return;
        }

        // 그 외 상태는 에러 처리
        setStatus("error");
        setErrorMsg(`초대 처리에 실패했습니다. (상태: ${res.joinStatus})`);
      } catch (error: any) {
        console.error(error);
        setStatus("error");
        setErrorMsg(
          error?.response?.data?.message ||
            "초대장을 확인하는 중 오류가 발생했습니다."
        );
      }
    })();
  }, [navigate, searchParams]);

  const isLoading = status === "loading";

  return (
    <>
      <TopNavBar variant="default" onSearchClick={undefined} />
      <main className="flex flex-col items-center justify-center px-4 pb-36 pt-10">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
            <p className="text-lg font-semibold">
              초대장을 확인하는 중입니다
            </p>
            <p className="text-sm text-muted-foreground">
              조금만 기다려 주세요...
            </p>
          </div>
        ) : (
          <div className="flex max-w-sm flex-col items-center gap-4 text-center">
            <p className="text-lg font-semibold">초대 링크 확인에 실패했어요</p>
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              {errorMsg}
            </p>
            <Button onClick={() => navigate("/", { replace: true })}>
              홈으로 이동
            </Button>
          </div>
        )}
      </main>
    </>
  );
}
