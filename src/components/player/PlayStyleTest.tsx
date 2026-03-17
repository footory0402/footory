"use client";

import { useState, useCallback } from "react";
import {
  STYLE_QUESTIONS,
  PLAY_STYLES,
  determinePlayStyle,
  type StyleTraitKey,
  type PlayStyleType,
} from "@/lib/constants";

interface PlayStyleTestProps {
  onComplete: (result: {
    styleType: PlayStyleType;
    traits: Record<StyleTraitKey, number>;
    answers: number[];
  }) => void;
  onSkip?: () => void;
}

export default function PlayStyleTest({ onComplete, onSkip }: PlayStyleTestProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{
    styleType: PlayStyleType;
    traits: Record<StyleTraitKey, number>;
  } | null>(null);

  const totalQuestions = STYLE_QUESTIONS.length;
  const currentQ = STYLE_QUESTIONS[questionIndex];

  const handleSelect = useCallback((answerIdx: number) => {
    setSelectedAnswer(answerIdx);

    // Auto-advance after short delay
    setTimeout(() => {
      const newAnswers = [...answers, answerIdx];
      setAnswers(newAnswers);
      setSelectedAnswer(null);

      if (questionIndex + 1 < totalQuestions) {
        setQuestionIndex((prev) => prev + 1);
      } else {
        // Calculate result
        const traits: Record<StyleTraitKey, number> = {
          breakthrough: 0,
          creativity: 0,
          finishing: 0,
          tenacity: 0,
        };

        newAnswers.forEach((aIdx, qIdx) => {
          const q = STYLE_QUESTIONS[qIdx];
          const answer = q.answers[aIdx];
          if (answer?.scores) {
            for (const [key, val] of Object.entries(answer.scores)) {
              traits[key as StyleTraitKey] += val ?? 0;
            }
          }
        });

        const styleType = determinePlayStyle(traits);
        setResult({ styleType, traits });
        setShowResult(true);
      }
    }, 300);
  }, [answers, questionIndex, totalQuestions]);

  const handleConfirmResult = useCallback(() => {
    if (!result) return;
    onComplete({ ...result, answers });
  }, [result, answers, onComplete]);

  // ── Result screen ──
  if (showResult && result) {
    const style = PLAY_STYLES[result.styleType];
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center animate-fade-up">
        <div className="relative mb-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent/10">
            <span className="text-5xl">{style.icon}</span>
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-bg text-sm font-bold">
            ✓
          </div>
        </div>
        <p className="text-[12px] font-medium text-accent mb-1">너의 플레이 스타일은</p>
        <h2 className="text-2xl font-bold text-text-1">{style.label}</h2>
        <p className="mt-2 text-sm text-text-3">&ldquo;{style.description}&rdquo;</p>

        <button
          onClick={handleConfirmResult}
          className="mt-8 w-full rounded-full bg-accent py-3 text-sm font-bold text-bg transition-opacity active:scale-[0.98]"
        >
          완료
        </button>
      </div>
    );
  }

  // ── Question screen ──
  return (
    <div className="flex flex-1 flex-col">
      {/* Progress */}
      <div className="mb-6 flex items-center gap-1.5">
        {Array.from({ length: totalQuestions }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i <= questionIndex ? "bg-accent" : "bg-border"
            }`}
          />
        ))}
      </div>

      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] font-bold text-accent">
          Q{questionIndex + 1}/{totalQuestions}
        </span>
        {onSkip && (
          <button
            onClick={onSkip}
            className="text-[12px] text-text-3 active:text-text-2"
          >
            건너뛰기
          </button>
        )}
      </div>

      <h2 className="text-[17px] font-bold text-text-1 leading-snug mb-6">
        {currentQ.question}
      </h2>

      <div className="flex flex-col gap-3">
        {currentQ.answers.map((answer, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(idx)}
            disabled={selectedAnswer !== null}
            className={`w-full rounded-xl border p-4 text-left text-[14px] font-medium transition-all active:scale-[0.98] ${
              selectedAnswer === idx
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-card text-text-2 hover:border-white/20"
            } disabled:cursor-default`}
          >
            {answer.text}
          </button>
        ))}
      </div>
    </div>
  );
}
