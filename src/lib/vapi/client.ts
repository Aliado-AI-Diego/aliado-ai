/**
 * Utility functions for interacting with Vapi.ai API
 */

const VAPI_BASE_URL = 'https://api.vapi.ai'

export async function updateVapiAssistantPrompt(assistantId: string, systemPrompt: string) {
  const apiKey = process.env.VAPI_API_KEY

  if (!apiKey) {
    throw new Error('VAPI_API_KEY is not configured')
  }

  try {
    // 1. Get the current assistant configuration
    const getResponse = await fetch(`${VAPI_BASE_URL}/assistant/${assistantId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })
    
    if (!getResponse.ok) {
      throw new Error(`Failed to fetch Vapi assistant: ${await getResponse.text()}`)
    }
    
    const assistant = await getResponse.json()
    
    // 2. Prepare the new model object
    // Default to openai gpt-3.5-turbo if the model object doesn't exist yet
    const currentModel = assistant.model || {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      messages: []
    }
    
    // Replace or add the system message
    const otherMessages = (currentModel.messages || []).filter((m: any) => m.role !== 'system')
    currentModel.messages = [
      { role: 'system', content: systemPrompt },
      ...otherMessages
    ]

    const payload = { model: currentModel }

    // 3. Patch the assistant
    const response = await fetch(`${VAPI_BASE_URL}/assistant/${assistantId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Vapi API Error:', errorData)
      throw new Error(errorData.message || 'Failed to update Vapi assistant')
    }

    return await response.json()
  } catch (error) {
    console.error('Error in updateVapiAssistantPrompt:', error)
    throw error
  }
}
