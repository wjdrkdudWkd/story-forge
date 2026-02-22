/**
 * AuthPanel.tsx
 *
 * [리팩토링] Supabase Auth 제거됨
 *
 * 인증은 FastAPI 백엔드로 이전 예정입니다.
 * 백엔드 인증 API가 구현될 때까지 안내 메시지를 표시합니다.
 */

"use client";

export function AuthPanel() {
  return (
    <div className="p-3 bg-gray-100 border border-gray-200 rounded text-xs text-gray-500">
      🔐 인증 기능은 백엔드 연동 후 활성화됩니다.
    </div>
  );
}
