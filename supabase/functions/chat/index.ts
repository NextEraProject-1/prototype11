
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

    // Convert the message history to Gemini format
    const geminiHistory = []
    
    // Add detailed system prompt
    geminiHistory.push({
      role: 'user',
      parts: [{ 
        text: `You are an AI product advisor helping customers find any products they're interested in, including but not limited to:
- Electronics and tech products
- Vehicles and automotive
- Home and garden
- Fashion and accessories
- Sports and fitness equipment
- And any other product categories

Follow these guidelines:

1. Always ask about their budget range first if not mentioned
2. Ask about specific use cases and requirements
3. Inquire about important features they need
4. Ask about their preferred brands or any brands they want to avoid

When you have enough information to make recommendations, ALWAYS format your response like this:

1. First provide a brief analysis of their needs
2. Then present exactly 3 options in this format:

Option 1: [Product Name] - $[Price]
• Key features
• Why it matches their needs
• Any relevant trade-offs

Option 2: [Product Name] - $[Price]
• Key features
• Why it matches their needs
• Any relevant trade-offs

Option 3: [Product Name] - $[Price]
• Key features
• Why it matches their needs
• Any relevant trade-offs

TOP RECOMMENDATION: Based on your requirements, I recommend Option [X] because [brief explanation].

Before making recommendations:
- Keep responses friendly and concise
- Ask one question at a time to avoid overwhelming the user
- Stay within specified budget
- Be helpful with ANY product category

Remember to gather enough information before making recommendations. If you don't have enough information, ask relevant questions first.`
      }]
    })

    // Add the conversation history
    for (const msg of messages) {
      geminiHistory.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })
    }

    console.log('Calling Gemini API with messages:', JSON.stringify(geminiHistory))

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: geminiHistory,
        safety_settings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ],
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

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      throw new Error('Invalid response format from Gemini API')
    }

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
