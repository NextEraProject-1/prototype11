
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
    case 'canada':
      return [
        `https://www.amazon.ca/s?k=${encodedProduct}`,
        `https://www.bestbuy.ca/en-ca/search?search=${encodedProduct}`,
      ];
    case 'australia':
      return [
        `https://www.amazon.com.au/s?k=${encodedProduct}`,
        `https://www.jbhifi.com.au/?q=${encodedProduct}`,
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
        text: `You are an AI product advisor helping customers find any products they're interested in. Follow these guidelines:

1. FIRST, always ask for BOTH:
   - The user's country (to provide local shopping links)
   - Their budget range
   If either is missing, ask for them before proceeding.

2. Once you have country and budget, ask about:
   - Specific use cases and requirements
   - Important features they need
   - Preferred brands or any brands to avoid

When you have enough information to make recommendations, ALWAYS format your response in JSON like this:

{
  "type": "product_recommendations",
  "analysis": "Brief analysis of their needs",
  "country": "User's country",
  "options": [
    {
      "name": "Product Name 1",
      "price": 999.99,
      "imageUrl": "https://images.unsplash.com/[relevant-image-id]",
      "features": [
        "Key feature 1",
        "Key feature 2"
      ],
      "matchReason": "Why it matches their needs",
      "tradeoffs": "Any relevant trade-offs"
    },
    {
      "name": "Product Name 2",
      "price": 799.99,
      "imageUrl": "https://images.unsplash.com/[relevant-image-id]",
      "features": [
        "Key feature 1",
        "Key feature 2"
      ],
      "matchReason": "Why it matches their needs",
      "tradeoffs": "Any relevant trade-offs"
    },
    {
      "name": "Product Name 3",
      "price": 699.99,
      "imageUrl": "https://images.unsplash.com/[relevant-image-id]",
      "features": [
        "Key feature 1",
        "Key feature 2"
      ],
      "matchReason": "Why it matches their needs",
      "tradeoffs": "Any relevant trade-offs"
    }
  ],
  "topRecommendation": {
    "optionIndex": 1,
    "reason": "Brief explanation of why this is the best choice"
  }
}

For images, use relevant images from Unsplash. Here are some example image IDs:
- Tech/Laptops: photo-1488590528505-98d2b5aba04b
- Cars: photo-1494976388531-d1058494cdd8
- Home/Furniture: photo-1518005020951-eccb494ad742
- Fashion: photo-1523381210434-271e8be1f52b
- Sports: photo-1517649763962-0c623066013b

If you don't have both country and budget information, ask for the missing information first.
Keep responses friendly and concise.`
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

    const aiResponseText = data.candidates[0].content.parts[0].text;
    
    // Try to parse as JSON if it looks like JSON
    let transformedContent = aiResponseText;
    if (aiResponseText.trim().startsWith('{')) {
      try {
        const jsonResponse = JSON.parse(aiResponseText);
        if (jsonResponse.type === 'product_recommendations') {
          // Format the recommendations in a nice way
          transformedContent = `${jsonResponse.analysis}\n\n`;
          
          jsonResponse.options.forEach((option, index) => {
            const shoppingLinks = getShoppingLinks(option.name, jsonResponse.country);
            
            transformedContent += `Option ${index + 1}: ${option.name} - $${option.price}\n`;
            transformedContent += `• Features:\n${option.features.map(f => `  - ${f}`).join('\n')}\n`;
            transformedContent += `• ${option.matchReason}\n`;
            if (option.tradeoffs) {
              transformedContent += `• Trade-offs: ${option.tradeoffs}\n`;
            }
            transformedContent += `• Where to buy:\n${shoppingLinks.map(link => `  - ${link}`).join('\n')}\n\n`;
          });
          
          transformedContent += `TOP RECOMMENDATION: Option ${jsonResponse.topRecommendation.optionIndex + 1} - ${jsonResponse.options[jsonResponse.topRecommendation.optionIndex].name}\n`;
          transformedContent += `Because: ${jsonResponse.topRecommendation.reason}`;
        }
      } catch (e) {
        console.log('Response was not valid JSON, using as plain text');
      }
    }

    // Transform Gemini response format to match OpenAI format expected by frontend
    const transformedResponse = {
      choices: [{
        message: {
          content: transformedContent,
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
