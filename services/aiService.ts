export class AIService {
  static async requestAnalysis(prompt: string, role = 'Software Architect', systemInstruction?: string): Promise<{ text: string; isSimulated: boolean }> {
    try {
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, role, systemInstruction }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        text: data.text || data.fallbackText || 'No output generated.',
        isSimulated: !!data.isSimulated,
      };
    } catch (err) {
      console.error('AIService request error:', err);
      return {
        text: `### ${role} Fallback Analysis

**Evaluation:**
- The requested configuration matches standard enterprise design principles.
- Ensure all dependency boundary rules are enabled in the active RuleSet.
- Maintain environment parity across local Docker and production Cloud Run targets.`,
        isSimulated: true,
      };
    }
  }
}
