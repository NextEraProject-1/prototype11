
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to generate shopping links based on country
const getShoppingLinks = (productName: string, country: string) => {
  const encodedProduct = encodeURIComponent(productName);
  switch(country.toLowerCase()) {
    case 'egypt':
      return [
        `https://www.amazon.eg/s?k=${encodedProduct}`,
        `https://www.noon.com/egypt-en/search?q=${encodedProduct}`,
      ];
    case 'usa':
    case 'united states':
      return [
        `https://www.amazon.com/s?k=${encodedProduct}`,
        `https://www.bestbuy.com/site/searchpage.jsp?st=${encodedProduct}`,
      ];
    case 'uk':
    case 'united kingdom':
      return [
        `https://www.amazon.co.uk/s?k=${encodedProduct}`,
        `https://www.currys.co.uk/search?q=${encodedProduct}`,
      ];
    default:
      return [`https://www.amazon.com/s?k=${encodedProduct}`];
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { messages, language = 'en' } = await req.json()
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured')
    }

    // Convert the message history to Gemini format
    const geminiHistory = []
    
    // Add detailed system prompt with separate country and budget questions
    geminiHistory.push({
      role: 'user',
      parts: [{ 
        text: `You are an AI product advisor helping customers find products they're interested in. Follow these guidelines:

1. FIRST ask ONLY for the user's country to provide local shopping links. Wait for their response.

2. THEN ask for their budget range. Wait for their response.

3. Once you have both country and budget, ask about:
   - Specific use cases and requirements
   - Important features they need
   - Preferred brands or any brands to avoid

When you have enough information to make recommendations, format your response in JSON like this:

{
  "type": "product_recommendations",
  "analysis": "Brief analysis of their needs",
  "country": "User's country",
  "options": [
    {
      "name": "Product Name",
      "price": 999.99,
      "imageUrl": "https://images.unsplash.com/[relevant-image-id]",
      "features": ["Feature 1", "Feature 2"],
      "matchReason": "Why this matches their needs",
      "tradeoffs": "Any relevant trade-offs"
    }
  ],
  "topRecommendation": {
    "optionIndex": 0,
    "reason": "Why this is the best choice"
  }
}

Use these Unsplash image IDs based on category:
- Tech: photo-1488590528505-98d2b5aba04b
- Cars: photo-1494976388531-d1058494cdd8
- Furniture: photo-1518005020951-eccb494ad742
- Fashion: photo-1523381210434-271e8be1f52b
- Sports: photo-1517649763962-0c623066013b

IMPORTANT:
- Ask questions one at a time
- Keep responses friendly and concise
- If you don't have the country, ONLY ask for that first
- After getting the country, ONLY ask for the budget
- Only proceed with more questions after having both

Current language: ${language}`
      }]
    })

    // Add the conversation history
    let hasCountry = false;
    let hasBudget = false;
    
    for (const msg of messages) {
      // Check for country and budget in user messages
      if (msg.role === 'user') {
        const lowerMsg = msg.content.toLowerCase();
        if (lowerMsg.includes('egypt') || lowerMsg.includes('usa') || lowerMsg.includes('uk')) {
          hasCountry = true;
        }
        if (lowerMsg.includes('$') || lowerMsg.includes('budget')) {
          hasBudget = true;
        }
      }
      
      geminiHistory.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })
    }

    console.log('Conversation state - Has country:', hasCountry, 'Has budget:', hasBudget);
    console.log('Calling Gemini API with messages:', JSON.stringify(geminiHistory))

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: geminiHistory,
        safetySettings: [
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

    const aiResponseText = data.candidates[0].content.parts[0].text;
    
    // Try to parse as JSON if it looks like JSON
    let finalResponse = aiResponseText;
    if (aiResponseText.trim().startsWith('{')) {
      try {
        const jsonResponse = JSON.parse(aiResponseText);
        if (jsonResponse.type === 'product_recommendations') {
          // Add shopping links to each option
          jsonResponse.options = jsonResponse.options.map(option => ({
            ...option,
            shoppingLinks: getShoppingLinks(option.name, jsonResponse.country)
          }));
          finalResponse = JSON.stringify(jsonResponse);
        }
      } catch (e) {
        console.log('Response was not valid JSON, using as plain text');
      }
    }

    // Transform Gemini response format to match expected frontend format
    const transformedResponse = {
      choices: [{
        message: {
          content: finalResponse,
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
