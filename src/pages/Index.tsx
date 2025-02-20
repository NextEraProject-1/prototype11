
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

  const handleSend = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      content,
      isOutgoing: true,
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      // Prepare messages for AI
      const aiMessages = messages.map(msg => ({
        role: msg.isOutgoing ? 'user' : 'assistant',
        content: msg.content
      }));
      aiMessages.push({ role: 'user', content });

      // Call AI function
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { messages: aiMessages }
      });

      if (error) throw error;

      const aiResponse = data.choices[0].message.content;
      
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
        </div>
      </div>
      <ChatInput onSend={handleSend} />
    </div>
  );
};

export default Index;
