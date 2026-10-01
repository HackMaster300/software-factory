'use client';

import { ArrowRight, ArrowLeft, Sparkles, Loader2, Send } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import type { ScaffolderState } from './useProjectScaffolder';

/** Wizard step 4: AI conversation about naming and structure. */
export function Step4AiConversation({ wizard }: { wizard: ScaffolderState }) {
  const { setStep, aiConversation, aiInput, setAiInput, handleSendAiMessage } = wizard;
  return (
        <Card className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white">Step 4: AI Conversation — Define File Names, Folder Structure & Naming Conventions</h2>
            <p className="text-gray-400 text-xs">Converse com o AI Architect para decidir nomes de arquivos, estrutura de pastas e convenções antes de gerar o preview.</p>
          </div>
          <div className="max-h-[380px] overflow-y-auto space-y-3 p-3 rounded-lg bg-[#0f1115] border border-[#2b303d]">
            {aiConversation.messages.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-blue-400" aria-hidden="true" />
                <p>Descreva seu projeto ou peça sugestões sobre nomes de arquivos e pastas.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {aiConversation.messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${msg.role === 'assistant' ? 'bg-[#1e222d] border border-[#2e3342] text-gray-200' : 'bg-blue-600 text-white'}`}>
                      <div className="whitespace-pre-wrap text-[11px] leading-relaxed">{msg.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {aiConversation.isLoading && (
              <div className="flex items-center gap-2 text-blue-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>AI Architect is thinking...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-[#232838]">
            <Input type="text" placeholder="Pergunte sobre nomes de arquivos, pastas, convenções..." value={aiInput} onChange={(e) => setAiInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()} className="flex-1" disabled={aiConversation.isLoading} />
            <Button variant="primary" onClick={handleSendAiMessage} disabled={aiConversation.isLoading || !aiInput.trim()}><Send className="w-4 h-4" aria-hidden="true" /><span>Send</span></Button>
          </div>
          {aiConversation.error && <div className="text-xs text-red-400">{aiConversation.error}</div>}
          <div className="flex justify-between pt-3 border-t border-[#2b303d]">
            <Button variant="secondary" onClick={() => setStep(3)}><ArrowLeft className="w-4 h-4" aria-hidden="true" /><span>Back</span></Button>
            <Button variant="primary" onClick={() => setStep(5)}><span>Next: Preview & Generate</span><ArrowRight className="w-4 h-4" aria-hidden="true" /></Button>
          </div>
        </Card>
  );
}
