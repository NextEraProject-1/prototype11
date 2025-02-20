
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
      content: "Hello! I'm here to help you find the perfect tech product. What type of device are you looking for?",
      isOutgoing: false,
      type: "question",
      options: [
        "Laptop",
        "Smartphone",
        "Tablet",
        "Gaming Console",
        "Other"
      ]
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
      
      // Add AI response
      const aiMessage: Message = {
        id: Date.now() + 1,
        content: aiResponse,
        isOutgoing: false,
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
