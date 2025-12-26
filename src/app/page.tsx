"use client";

import { useState } from "react";
import { InputPanel } from "@/components/InputPanel";
import { OutputPanel } from "@/components/OutputPanel";
import { ActsPanel } from "@/components/ActsPanel";
import type { IdeaFormState } from "@/types/form";
import type { IdeaResult, GenerateIdeaInput } from "@/types/idea";
import type { ActsResult, GenerateActsInput } from "@/types/acts";
import { generateIdea, compactFormPayload } from "@/lib/aiClient";
import { generateActs } from "@/lib/actsClient";
import { generateSeed } from "@/lib/random";

type ViewState = "input" | "loading" | "output" | "confirmed" | "acts_loading" | "acts";

export default function Home() {
  const [viewState, setViewState] = useState<ViewState>("input");
  const [result, setResult] = useState<IdeaResult | null>(null);
  const [confirmedIndex, setConfirmedIndex] = useState<number | null>(null);
  const [actsResult, setActsResult] = useState<ActsResult | null>(null);

  // 아이디어 생성 핸들러
  const handleGenerate = async (form: IdeaFormState) => {
    setViewState("loading");

    // Seed 자동 생성 (없으면)
    const formWithSeed: IdeaFormState = {
      ...form,
      seed: form.seed ?? generateSeed(),
    };

    const input: GenerateIdeaInput = {
      form: formWithSeed,
      compactedPayload: compactFormPayload(formWithSeed),
      mode: "mock",
    };

    try {
      const ideaResult = await generateIdea(input);
      setResult(ideaResult);
      setViewState("output");
    } catch (error) {
      console.error("아이디어 생성 실패:", error);
      alert("아이디어 생성 중 오류가 발생했습니다.");
      setViewState("input");
    }
  };

  // 후보 확정 핸들러
  const handleConfirm = (candidateIndex: number) => {
    if (!result) return;

    const selectedCandidate = result.candidates[candidateIndex];
    console.log("=".repeat(60));
    console.log("아이디어 확정");
    console.log("=".repeat(60));
    console.log("선택된 후보:", candidateIndex + 1);
    console.log("Logline:", selectedCandidate.logline);
    console.log("Synopsis:", selectedCandidate.synopsis);
    console.log("Tags:", selectedCandidate.tags);
    console.log();
    console.log("IdeaState:");
    console.log(JSON.stringify(result.state, null, 2));
    console.log("=".repeat(60));

    setConfirmedIndex(candidateIndex);
    setViewState("confirmed");
  };

  // 다시 생성 핸들러
  const handleBack = () => {
    setViewState("input");
    setResult(null);
    setConfirmedIndex(null);
    setActsResult(null);
  };

  // 5막 구조 생성 핸들러
  const handleGenerateActs = async () => {
    if (!result || confirmedIndex === null) return;

    setViewState("acts_loading");

    const selectedCandidate = result.candidates[confirmedIndex];
    const input: GenerateActsInput = {
      logline: selectedCandidate.logline,
      synopsis: selectedCandidate.synopsis,
      state: result.state,
    };

    try {
      const acts = await generateActs(input);
      setActsResult(acts);
      setViewState("acts");
    } catch (error) {
      console.error("5막 구조 생성 실패:", error);
      alert("5막 구조 생성 중 오류가 발생했습니다.");
      setViewState("confirmed");
    }
  };

  // 5막 화면에서 뒤로 가기 핸들러
  const handleBackFromActs = () => {
    setViewState("confirmed");
    setActsResult(null);
  };

  return (
    <main className="min-h-screen p-8">
      {/* Input 화면 */}
      {viewState === "input" && (
        <InputPanel onGenerate={handleGenerate} />
      )}

      {/* Loading 화면 */}
      {viewState === "loading" && (
        <div className="w-full max-w-2xl mx-auto p-6 text-center">
          <h1 className="text-2xl font-bold">아이디어 생성 중...</h1>
          <p className="mt-4 text-foreground/60">
            잠시만 기다려주세요
          </p>
        </div>
      )}

      {/* Output 화면 */}
      {viewState === "output" && result && (
        <OutputPanel
          result={result}
          onConfirm={handleConfirm}
          onBack={handleBack}
        />
      )}

      {/* Confirmed 화면 */}
      {viewState === "confirmed" && result && confirmedIndex !== null && (
        <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">아이디어 확정 완료</h1>
            <p className="text-foreground/60">
              아이디어 {confirmedIndex + 1}번이 선택되었습니다.
            </p>
          </div>

          <div className="border border-border rounded-md p-6 space-y-4">
            <div>
              <h3 className="text-xs font-medium text-foreground/60 uppercase mb-2">
                선택된 Logline
              </h3>
              <p className="text-lg font-semibold">
                {result.candidates[confirmedIndex].logline}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-medium text-foreground/60 uppercase mb-2">
                Synopsis
              </h3>
              <p className="text-sm leading-relaxed text-foreground/80">
                {result.candidates[confirmedIndex].synopsis}
              </p>
            </div>
          </div>

          <div className="p-4 bg-foreground/5 rounded text-center">
            <p className="text-sm text-foreground/70">
              다음 단계(5막 구조 / 24블록)로 이동할 수 있습니다.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleBack}
              className="flex-1 px-4 py-2 border border-border rounded hover:bg-foreground/5"
            >
              ← 처음부터 다시
            </button>
            <button
              onClick={handleGenerateActs}
              className="flex-1 px-4 py-2 bg-foreground text-background rounded hover:bg-foreground/90"
            >
              5막 구조로 진행 →
            </button>
          </div>
        </div>
      )}

      {/* Acts Loading 화면 */}
      {viewState === "acts_loading" && (
        <div className="w-full max-w-2xl mx-auto p-6 text-center">
          <h1 className="text-2xl font-bold">5막 구조 생성 중...</h1>
          <p className="mt-4 text-foreground/60">
            잠시만 기다려주세요
          </p>
        </div>
      )}

      {/* Acts 화면 */}
      {viewState === "acts" && actsResult && (
        <ActsPanel
          actsResult={actsResult}
          onBack={handleBackFromActs}
        />
      )}
    </main>
  );
}
