/**
 * Utility functions for interacting with Meta's Graph API
 * Specifically for WhatsApp Cloud API in Phase 1
 */

export interface WhatsAppMessagePayload {
  to: string
  text: string
  phoneNumberId: string
  accessToken: string
}

/**
 * Send a text message via WhatsApp Cloud API
 */
export async function sendWhatsAppMessage({
  to,
  text,
  phoneNumberId,
  accessToken,
}: WhatsAppMessagePayload) {
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to,
    type: 'text',
    text: {
      preview_url: false,
      body: text,
    },
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Meta API Error Response:', data)
      throw new Error(data.error?.message || 'Failed to send WhatsApp message')
    }

    return data
  } catch (error) {
    console.error('Error in sendWhatsAppMessage:', error)
    throw error
  }
}
