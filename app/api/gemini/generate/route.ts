import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Request body must be a JSON object.' }, { status: 400 });
    }

    const { prompt, systemInstruction, role = 'Software Architect' } = body as {
      prompt?: unknown;
      systemInstruction?: unknown;
      role?: unknown;
    };

    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: '"prompt" is required and must be a non-empty string.' }, { status: 400 });
    }
    if (systemInstruction !== undefined && typeof systemInstruction !== 'string') {
      return NextResponse.json({ error: '"systemInstruction" must be a string when provided.' }, { status: 400 });
    }
    if (typeof role !== 'string' || role.trim().length === 0) {
      return NextResponse.json({ error: '"role" must be a non-empty string when provided.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      // Fallback simulated AI response when API key is unconfigured or default
      const simulatedResponse = `### ${role} Architectural Analysis

**Overview:**
Evaluating the requested architectural configuration against software factory standards.

**Pros:**
- Strict layer separation enforces the Dependency Inversion Principle.
- High maintainability and clear team boundaries across domain, application, and infrastructure projects.
- Containerization ensures environment parity across dev, staging, and production.

**Cons & Tradeoffs:**
- Additional boilerplate files and mapping layers between Domain Entities and API DTOs.
- Slight initial setup overhead for small-scale CRUD applications.

**Security & Operational Risks:**
- Ensure all connection strings and JWT signing keys are loaded strictly from environment secrets/Vault.
- Health check probes must be configured to prevent Kubernetes/Cloud Run from sending traffic to uninitialized instances.

**Recommendations:**
1. Enable Redis distributed caching for user sessions and idempotency checks.
2. Implement MediatR validation pipeline behaviors for automatic request validation.
3. Keep Domain project completely free of external ORM or framework dependencies.`;

      return NextResponse.json({ text: simulatedResponse, isSimulated: true });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    let responseText = '';
    let isSimulated = false;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || `You are an expert ${role} in an enterprise Software Factory platform. Provide direct, highly technical, actionable analysis covering Pros, Cons, Risks, Alternatives, and Recommendations.`,
          temperature: 0.7,
        },
      });
      responseText = response.text || '';
    } catch (primaryErr) {
      console.warn('Gemini 3.6-flash unavailable, trying fallback gemini-2.5-flash...', primaryErr);
      try {
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            systemInstruction: systemInstruction || `You are an expert ${role} in an enterprise Software Factory platform. Provide direct, highly technical, actionable analysis covering Pros, Cons, Risks, Alternatives, and Recommendations.`,
            temperature: 0.7,
          },
        });
        responseText = fallbackResponse.text || '';
      } catch (fallbackErr) {
        console.error('All Gemini model calls failed, returning fallback analysis:', fallbackErr);
        responseText = `### ${role} Architectural Analysis (Offline / Fallback Mode)

**Overview:**
Evaluating the requested architectural configuration against enterprise software factory standards.

**Key Architecture Takeaways:**
1. **Module & Boundary Integrity:** Ensure core domain modules remain decoupled from infrastructure and framework adapters.
2. **Security Standards:** Enforce JWT Bearer authentication, HTTPS TLS termination, and CORS origin whitelisting.
3. **Observability & Health:** Include health check probes (/healthz, /readyz) and structured JSON logging.

**Next Steps:**
- Verify that active features match chosen tech stack requirements.
- Execute automated solution scaffolding validation in the Project Scaffolder.`;
        isSimulated = true;
      }
    }

    return NextResponse.json({
      text: responseText || 'No response generated from model.',
      isSimulated,
    });
  } catch (err: any) {
    console.error('Error in /api/gemini/generate:', err);
    return NextResponse.json({
      text: `### Software Architect Fallback Analysis\n\nAn operational error occurred while contacting the AI model. Active rule enforcement remains enabled.`,
      isSimulated: true,
    });
  }
}
