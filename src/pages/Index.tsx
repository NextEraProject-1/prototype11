
import { useState } from "react";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";

interface Message {
  id: number;
  content: string;
  isOutgoing: boolean;
  sender?: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Hello! How are you?",
      isOutgoing: false,
      sender: "Aly Fisherbiny",
    },
    {
      id: 2,
      content: "I'm doing great, thanks for asking! How about you?",
      isOutgoing: true,
    },
    {
      id: 3,
      content: "That's wonderful to hear! I'm doing well too.",
      isOutgoing: false,
      sender: "Aly Fisherbiny",
    },
  ]);

  const handleSend = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        content,
        isOutgoing: true,
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-background">
      <ChatHeader title="UntitledChat-1" />
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
