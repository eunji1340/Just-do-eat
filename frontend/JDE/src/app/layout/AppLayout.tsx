// 목적: 모든 페이지에 공통으로 적용되는 전역 레이아웃
// 최소 너비 320px, 최대 너비 640px, 중앙 정렬 + 양옆 회색 공백

import React from 'react'

type Props = {
  children: React.ReactNode
}

export default function AppLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <main className="w-full min-w-[320px] max-w-[640px] bg-white shadow-sm">
        {children}
      </main>
    </div>
  )
}
