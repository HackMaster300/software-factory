'use client';

import { useState } from 'react';
import type { Blueprint } from '../../../types/factory';
import { AIService } from '../../../services/aiService';
import { aiDebug } from '../../../lib/debug-log';

/** Wizard step 4: grounded AI conversation about file names, folders and conventions. */
export function useScaffolderAiChat(editableBlueprint: Blueprint) {
  const [aiConversation, setAiConversation] = useState<{
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    isLoading: boolean;
    error: string | null;
  }>({ messages: [], isLoading: false, error: null });
  const [aiInput, setAiInput] = useState('');

  const handleSendAiMessage = async () => {
    if (!aiInput.trim() || aiConversation.isLoading) return;
    const userMsg = { role: 'user' as const, content: aiInput.trim() };
    aiDebug('[Scaffolder AI] Sending:', { promptLen: userMsg.content.length, blueprint: editableBlueprint.name, techStack: editableBlueprint.techStackId });
    setAiConversation((prev) => ({ ...prev, messages: [...prev.messages, userMsg], isLoading: true, error: null }));
    setAiInput('');
    try {
      const { buildGroundedPrompt, getGroundedSystemInstruction } = await import('../../../lib/ai-grounding');
      const prompt = buildGroundedPrompt(editableBlueprint, userMsg.content);
      const systemInstruction = getGroundedSystemInstruction();
      aiDebug('[Scaffolder AI] Grounded prompt len:', prompt.length, 'system len:', systemInstruction.length);
      const result = await AIService.requestAnalysis(prompt, 'Software Architect & Naming Consultant', systemInstruction);
      aiDebug('[Scaffolder AI] Result:', { textLen: result.text.length, isSimulated: result.isSimulated });
      setAiConversation((prev) => ({ ...prev, messages: [...prev.messages, { role: 'assistant' as const, content: result.text }], isLoading: false }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      aiDebug('[Scaffolder AI] Error:', msg);
      setAiConversation((prev) => ({ ...prev, isLoading: false, error: msg, messages: [...prev.messages, { role: 'assistant' as const, content: `Falha: ${msg}` }] }));
    }
  };

  return { aiConversation, setAiConversation, aiInput, setAiInput, handleSendAiMessage };
}
