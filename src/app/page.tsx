"use client";

import { useState } from "react";
import { InputPanel } from "@/components/InputPanel";
import { OutputPanel } from "@/components/OutputPanel";
import { ActsPanel } from "@/components/ActsPanel";
import { BlocksPanel } from "@/components/BlocksPanel";
import type { IdeaFormState } from "@/types/form";
import type { IdeaResult, GenerateIdeaInput, IdeaCandidate } from "@/types/idea";
import type { ActsResult, GenerateActsInput } from "@/types/acts";
import type { BlocksDraft, GenerateBlocksOverviewInput, BlockIndex, ExpandPreset } from "@/types/blocks";
import { generateIdea, compactFormPayload } from "@/lib/aiClient";
import { generateActs } from "@/lib/actsClient";
import { generateBlocksOverview, generateBlockDetail, regenerateOverview, expandOverview } from "@/lib/blocksClient";
import { generateSeed } from "@/lib/random";
import { DEFAULT_DETAIL_POLICY } from "@/config/policy";

type ViewState = "input" | "loading" | "output" | "confirmed" | "acts_loading" | "acts" | "blocks_loading" | "blocks";

export default function Home() {
  const [viewState, setViewState] = useState<ViewState>("input");
  const [result, setResult] = useState<IdeaResult | null>(null);
  const [confirmedIndex, setConfirmedIndex] = useState<number | null>(null);
  const [actsResult, setActsResult] = useState<ActsResult | null>(null);
  const [blocksDraft, setBlocksDraft] = useState<BlocksDraft | null>(null);

  // 정책 및 세션 카운터
  const policy = DEFAULT_DETAIL_POLICY;
  const [detailGenCount, setDetailGenCount] = useState(0);
  const [lastActionAtByIndex, setLastActionAtByIndex] = useState<Record<number, number>>({});

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
    setBlocksDraft(null);
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

  // 24블록 생성 핸들러
  const handleGenerateBlocks = async () => {
    if (!result || confirmedIndex === null) return;

    setViewState("blocks_loading");

    const selectedCandidate = result.candidates[confirmedIndex];
    const input: GenerateBlocksOverviewInput = {
      candidate: selectedCandidate,
      state: result.state,
      acts: actsResult || undefined,
    };

    try {
      const draft = await generateBlocksOverview(input);
      setBlocksDraft(draft);
      setViewState("blocks");
    } catch (error) {
      console.error("24블록 생성 실패:", error);
      alert("24블록 생성 중 오류가 발생했습니다.");
      setViewState("acts");
    }
  };

  // 24블록 화면에서 뒤로 가기 핸들러
  const handleBackFromBlocks = () => {
    setViewState("acts");
    setBlocksDraft(null);
  };

  // 24블록 draft 업데이트 핸들러
  const handleUpdateDraft = (nextDraft: BlocksDraft) => {
    setBlocksDraft(nextDraft);
  };

  // === 정책 헬퍼 함수 ===
  const canGenerateDetail = (): boolean => {
    return detailGenCount < policy.maxDetailGenerationsPerSession;
  };

  const isCoolingDown = (index: number): boolean => {
    const lastActionAt = lastActionAtByIndex[index];
    if (!lastActionAt) return false;
    return Date.now() - lastActionAt < policy.actionCooldownMs;
  };

  const markAction = (index: number) => {
    setLastActionAtByIndex((prev) => ({
      ...prev,
      [index]: Date.now(),
    }));
  };

  const consumeDetailQuota = () => {
    setDetailGenCount((prev) => prev + 1);
  };

  // === 블록 액션 핸들러들 ===

  // 개요 재생성
  const handleRegenerateOverview = async (index: BlockIndex) => {
    if (!blocksDraft || !result) return;
    if (isCoolingDown(index)) return;

    markAction(index);

    const spec = blocksDraft.specs.find((s) => s.index === index);
    const block = blocksDraft.blocksByIndex[index];
    if (!spec || !block) return;

    const currentOverview = block.overviewVariants.find(
      (v) => v.id === block.selectedOverviewId
    );
    if (!currentOverview) return;

    try {
      const newOverview = await regenerateOverview({
        index,
        spec,
        currentOverview,
        state: result.state,
        memory: blocksDraft.memory,
      });

      const updatedDraft = {
        ...blocksDraft,
        blocksByIndex: {
          ...blocksDraft.blocksByIndex,
          [index]: {
            ...block,
            overviewVariants: [...block.overviewVariants, newOverview],
            selectedOverviewId: newOverview.id,
          },
        },
      };

      setBlocksDraft(updatedDraft);
    } catch (error) {
      console.error("개요 재생성 실패:", error);
    }
  };

  // 개요 발전시키기
  const handleExpandOverview = async (index: BlockIndex, preset: ExpandPreset) => {
    if (!blocksDraft || !result) return;
    if (isCoolingDown(index)) return;

    markAction(index);

    const spec = blocksDraft.specs.find((s) => s.index === index);
    const block = blocksDraft.blocksByIndex[index];
    if (!spec || !block) return;

    const currentOverview = block.overviewVariants.find(
      (v) => v.id === block.selectedOverviewId
    );
    if (!currentOverview) return;

    try {
      const newOverview = await expandOverview({
        index,
        spec,
        currentOverview,
        preset,
        state: result.state,
        memory: blocksDraft.memory,
      });

      const updatedDraft = {
        ...blocksDraft,
        blocksByIndex: {
          ...blocksDraft.blocksByIndex,
          [index]: {
            ...block,
            overviewVariants: [...block.overviewVariants, newOverview],
            selectedOverviewId: newOverview.id,
          },
        },
      };

      setBlocksDraft(updatedDraft);
    } catch (error) {
      console.error("개요 발전 실패:", error);
    }
  };

  // 상세 생성 (기본 sentenceRange)
  const handleGenerateDetail = async (index: BlockIndex) => {
    if (!blocksDraft || !result) return;
    if (isCoolingDown(index)) return;
    if (!canGenerateDetail()) return;

    consumeDetailQuota();
    markAction(index);

    const spec = blocksDraft.specs.find((s) => s.index === index);
    const block = blocksDraft.blocksByIndex[index];
    if (!spec || !block) return;

    const currentOverview = block.overviewVariants.find(
      (v) => v.id === block.selectedOverviewId
    );
    if (!currentOverview) return;

    try {
      const newDetail = await generateBlockDetail({
        index,
        spec,
        overview: currentOverview,
        state: result.state,
        memory: blocksDraft.memory,
        sentenceRange: policy.detailSentenceRange,
      });

      // detailVariants 최대 3 유지 (선택된 것은 보호)
      let updatedDetailVariants = [...block.detailVariants, newDetail];
      if (updatedDetailVariants.length > policy.maxDetailVariantsPerBlock) {
        // 선택된 variant 찾기
        const selectedId = block.selectedDetailId;
        const selectedIndex = updatedDetailVariants.findIndex((v) => v.id === selectedId);

        // 가장 오래된 non-selected variant 제거
        if (selectedIndex !== -1) {
          // 선택된 것은 보호
          const nonSelected = updatedDetailVariants.filter((v) => v.id !== selectedId);
          nonSelected.shift(); // 가장 오래된 것 제거
          updatedDetailVariants = [
            updatedDetailVariants[selectedIndex],
            ...nonSelected,
          ];
        } else {
          // 선택된 것 없으면 그냥 가장 오래된 것 제거
          updatedDetailVariants.shift();
        }
      }

      const updatedDraft = {
        ...blocksDraft,
        blocksByIndex: {
          ...blocksDraft.blocksByIndex,
          [index]: {
            ...block,
            detailVariants: updatedDetailVariants,
            selectedDetailId: newDetail.id,
          },
        },
      };

      setBlocksDraft(updatedDraft);
    } catch (error) {
      console.error("상세 생성 실패:", error);
    }
  };

  // 상세 확장 (더 길게 / 프리셋)
  const handleExpandDetail = async (
    index: BlockIndex,
    preset?: ExpandPreset,
    sentenceRange?: { min: number; max: number }
  ) => {
    if (!blocksDraft || !result) return;
    if (isCoolingDown(index)) return;
    if (!canGenerateDetail()) return;

    consumeDetailQuota();
    markAction(index);

    const spec = blocksDraft.specs.find((s) => s.index === index);
    const block = blocksDraft.blocksByIndex[index];
    if (!spec || !block) return;

    const currentOverview = block.overviewVariants.find(
      (v) => v.id === block.selectedOverviewId
    );
    if (!currentOverview) return;

    try {
      const newDetail = await generateBlockDetail({
        index,
        spec,
        overview: currentOverview,
        state: result.state,
        memory: blocksDraft.memory,
        preset,
        sentenceRange: sentenceRange || policy.expandSentenceRange,
      });

      // detailVariants 최대 3 유지 (선택된 것은 보호)
      let updatedDetailVariants = [...block.detailVariants, newDetail];
      if (updatedDetailVariants.length > policy.maxDetailVariantsPerBlock) {
        const selectedId = block.selectedDetailId;
        const selectedIndex = updatedDetailVariants.findIndex((v) => v.id === selectedId);

        if (selectedIndex !== -1) {
          const nonSelected = updatedDetailVariants.filter((v) => v.id !== selectedId);
          nonSelected.shift();
          updatedDetailVariants = [
            updatedDetailVariants[selectedIndex],
            ...nonSelected,
          ];
        } else {
          updatedDetailVariants.shift();
        }
      }

      const updatedDraft = {
        ...blocksDraft,
        blocksByIndex: {
          ...blocksDraft.blocksByIndex,
          [index]: {
            ...block,
            detailVariants: updatedDetailVariants,
            selectedDetailId: newDetail.id,
          },
        },
      };

      setBlocksDraft(updatedDraft);
    } catch (error) {
      console.error("상세 확장 실패:", error);
    }
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
          onGenerateBlocks={handleGenerateBlocks}
        />
      )}

      {/* Blocks Loading 화면 */}
      {viewState === "blocks_loading" && (
        <div className="w-full max-w-2xl mx-auto p-6 text-center">
          <h1 className="text-2xl font-bold">24블록 생성 중...</h1>
          <p className="mt-4 text-foreground/60">
            24개의 블록 개요를 생성하고 있습니다. 잠시만 기다려주세요.
          </p>
        </div>
      )}

      {/* Blocks 화면 */}
      {viewState === "blocks" && blocksDraft && (
        <BlocksPanel
          draft={blocksDraft}
          onBack={handleBackFromBlocks}
          onUpdateDraft={handleUpdateDraft}
          policy={policy}
          detailGenCount={detailGenCount}
          canGenerateDetail={canGenerateDetail()}
          isCoolingDown={isCoolingDown}
          onRegenerateOverview={handleRegenerateOverview}
          onExpandOverview={handleExpandOverview}
          onGenerateDetail={handleGenerateDetail}
          onExpandDetail={handleExpandDetail}
        />
      )}
    </main>
  );
}
