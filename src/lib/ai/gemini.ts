import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export const MODELS = {
  chat: 'gemini-2.5-flash',
  embedding: 'gemini-embedding-2',
} as const

/**
 * Generate a chat completion with Gemini
 */
export async function generateChatResponse(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  context?: string
) {
  const fullSystemPrompt = context
    ? `${systemPrompt}\n\n--- CONTEXTO DEL NEGOCIO ---\n${context}\n--- FIN DEL CONTEXTO ---\n\nUsa el contexto anterior para responder las preguntas del usuario. Si no encuentras la información en el contexto, indícalo amablemente.`
    : systemPrompt

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const response = await ai.models.generateContent({
    model: MODELS.chat,
    contents,
    config: {
      systemInstruction: fullSystemPrompt,
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  })

  return response.text || ''
}

/**
 * Generate a streaming chat completion with Gemini
 */
export async function generateChatResponseStream(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  context?: string
) {
  const fullSystemPrompt = context
    ? `${systemPrompt}\n\n--- CONTEXTO DEL NEGOCIO ---\n${context}\n--- FIN DEL CONTEXTO ---\n\nUsa el contexto anterior para responder las preguntas del usuario. Si no encuentras la información en el contexto, indícalo amablemente.`
    : systemPrompt

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const response = await ai.models.generateContentStream({
    model: MODELS.chat,
    contents,
    config: {
      systemInstruction: fullSystemPrompt,
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  })

  return response
}

/**
 * Generate embeddings for text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: MODELS.embedding,
    contents: text,
    config: {
      outputDimensionality: 768,
    },
  })

  return response.embeddings?.[0]?.values || []
}

/**
 * Generate insights from conversation data
 */
export async function generateInsights(
  conversationSummaries: string,
  companyName: string
) {
  const systemPrompt = `Eres un analista de datos experto en inteligencia de negocio para PyMEs en Latinoamérica. 
Tu trabajo es analizar las conversaciones de servicio al cliente y extraer insights accionables.

Para la empresa "${companyName}", analiza las siguientes conversaciones y genera insights en formato JSON.

Cada insight debe tener:
- category: "trend" | "complaint" | "opportunity" | "metric"
- insight_summary: Resumen claro en español (máximo 2 oraciones)
- actionable_advice: Consejo específico y práctico para el dueño del negocio
- confidence_score: 0-100 basado en la cantidad de evidencia

Responde SOLO con un array JSON válido de insights. Sin texto adicional.`

  const response = await ai.models.generateContent({
    model: MODELS.chat,
    contents: conversationSummaries,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.3,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  })

  return response.text || '[]'
}
