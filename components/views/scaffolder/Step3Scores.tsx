'use client';

import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import type { ScaffolderState } from './useProjectScaffolder';

/** Wizard step 3: quality score rationale and recommendations. */
export function Step3Scores({ wizard }: { wizard: ScaffolderState }) {
  const { setStep, liveScores } = wizard;
  return (
        <Card className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white">Step 3: Quality Score Rationale & Recommendation Analysis</h2>
            <p className="text-gray-400 text-xs">
              Heuristic score (Phase 9) — derived from stack/feature choices; Phase 11 will ground it in real validation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveScores.rationale.map((rat) => (
              <Card key={rat.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-200 text-xs">{rat.category}</span>
                  <span className="font-mono text-xs font-bold text-blue-400">{rat.score}/100</span>
                </div>
                <div className="text-xs text-gray-300">{rat.reason}</div>
                <div className="pt-2 border-t border-[#232838]">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase">Recommendations:</div>
                  <ul className="list-disc list-inside text-[11px] text-amber-300/80 space-y-0.5 mt-1">
                    {rat.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex justify-between pt-3 border-t border-[#2b303d]">
            <Button variant="secondary" onClick={() => setStep(2)}>
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Back</span>
            </Button>

            <Button variant="primary" onClick={() => setStep(4)}>
              <span>Next: Live Code & Solution Preview</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </Card>
  );
}
