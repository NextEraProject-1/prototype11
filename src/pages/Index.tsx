
import { useState } from "react";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { Message } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Hello! I'm here to help you find any product you're interested in. What are you looking to purchase today?",
      isOutgoing: false,
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (content: string) => {
    if (!content.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      content,
      isOutgoing: true,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Prepare messages for AI
      const aiMessages = messages.map(msg => ({
        role: msg.isOutgoing ? 'user' : 'assistant',
        content: msg.content
      }));
      aiMessages.push({ role: 'user', content });

      console.log('Sending messages to AI:', aiMessages);

      // Call AI function
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { messages: aiMessages }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data || !data.choices || !data.choices[0]) {
        throw new Error('Invalid response format from AI');
      }

      const aiResponse = data.choices[0].message.content;
      console.log('Received AI response:', aiResponse);

      // Try to parse product recommendations from the response
      let messageType: Message['type'] = 'text';
      let messageProduct = undefined;
      
      // Check if response contains product recommendations
      if (aiResponse.includes('TOP RECOMMENDATION: Option')) {
        const recommendationMatch = aiResponse.match(/TOP RECOMMENDATION: Option (\d+)/);
        if (recommendationMatch) {
          const optionNumber = parseInt(recommendationMatch[1]) - 1;
          
          // Try to find the image URL for the recommended product
          const imageUrlMatch = aiResponse.match(/https:\/\/images\.unsplash\.com\/[^\s\n]+/);
          const imageUrl = imageUrlMatch ? imageUrlMatch[0] : undefined;
          
          // Extract the product name and price
          const productMatch = aiResponse.match(/Option \d+: ([^-]+) - \$(\d+(\.\d{2})?)/);
          if (productMatch) {
            messageType = 'product';
            messageProduct = {
              id: `product-${Date.now()}`,
              name: productMatch[1].trim(),
              price: parseFloat(productMatch[2]),
              description: aiResponse,
              imageUrl
            };
          }
        }
      }
      
      // Add AI response
      const aiMessage: Message = {
        id: Date.now() + 1,
        content: aiResponse,
        isOutgoing: false,
        type: messageType,
        product: messageProduct
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error calling AI:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ChatHeader title="AI Product Advisor" />
      <div className="max-w-3xl mx-auto px-4 pt-16 pb-24">
        <div className="space-y-4 py-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} {...message} />
          ))}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
      </div>
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
};

export default Index;
