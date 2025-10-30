// src/widgets/entry/PersonalizedEntryButton.tsx
// 목적: 스와이프 페이지로 이동하는 CTA 버튼 (단일 책임)
// 교체 포인트: shared/ui/Button으로 교체, 추적 로그 hook 추가

export default function PersonalizedEntryButton() {
  return (
    <div className="relative w-full">
        <a href="/swipe">
          <img 
            src="/swipe_logo.png"
            alt="식당 고를 때 걱정없이 맛있게 JUST DO EAT"
            className="w-full h-auto block"
            />
        </a>
    </div>
  )
}
