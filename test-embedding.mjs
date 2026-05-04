import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: 'AIzaSyDD5EuOLVG8nCPB0tJUjGDDWipMcyqycYs' });

async function test() {
  try {
    const response = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: 'hello',
    });
    console.log(`text-embedding-004 success: ${response.embeddings[0].values.length}`);
  } catch(e) { console.log('text-embedding-004 failed'); }

  try {
    const response2 = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: 'hello',
      config: {
        outputDimensionality: 768
      }
    });
    console.log(`gemini-embedding-2 with 768 success: ${response2.embeddings[0].values.length}`);
  } catch(e) { console.log('gemini-embedding-2 failed', e.message); }
}

test();
