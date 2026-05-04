const API_KEY = 'AIzaSyDD5EuOLVG8nCPB0tJUjGDDWipMcyqycYs';

async function listModels() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const data = await res.json();
    for (const model of data.models || []) {
      if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes('generateContent') && model.name.includes('flash')) {
        console.log(`Found chat model: ${model.name}`);
      }
    }
  } catch (e) {
    console.error('Failed to list models:', e);
  }
}

listModels();
