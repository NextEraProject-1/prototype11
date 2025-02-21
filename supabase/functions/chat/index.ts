
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { messages } = await req.json()
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured')
    }

    // Create the conversation history in Gemini format
    const geminiMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Add system prompt as first user message
    geminiMessages.unshift({
      role: 'user',
      parts: [{ 
        text: 'You are an AI product advisor helping customers find the perfect tech products. Focus on understanding their needs, budget, and use cases. Keep responses friendly and concise. If recommending a product, include details about its features, price, and why it suits their needs.'
      }]
    });

    console.log('Calling Gemini API with messages:', JSON.stringify(geminiMessages))

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: geminiMessages,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
      throw new Error(`Gemini API error: ${errorText}`)
    }

    const data = await response.json()
    console.log('Gemini response:', JSON.stringify(data))

    // Transform Gemini response format to match OpenAI format expected by frontend
    const transformedResponse = {
      choices: [{
        message: {
          content: data.candidates[0].content.parts[0].text,
          role: 'assistant'
        }
      }]
    }

    return new Response(JSON.stringify(transformedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in chat function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
