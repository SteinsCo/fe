// 추후 router/providers 가 추가되면 이 컴포넌트에서 합성합니다.
// 부트스트랩 단계에서는 toolchain 동작 확인만을 위한 placeholder.
export function App() {
  return (
    <main className="mx-auto flex min-h-full max-w-4xl flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold">Steins Frontend</h1>
      <p className="text-neutral-400">
        도구체인 부트스트랩 완료 — 라우터 / 페이지 / API 연결은 후속 커밋에서 추가됩니다.
      </p>
    </main>
  );
}
