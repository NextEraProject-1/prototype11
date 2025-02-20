
import { useState } from "react";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { Message } from "@/types/chat";

const Index = () => {
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

  const handleSend = (content: string) => {
    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        content,
        isOutgoing: true,
      },
    ]);

    // Simulate AI response
    setTimeout(() => {
      if (content.toLowerCase().includes("laptop")) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            content: "What's your primary use case for the laptop?",
            isOutgoing: false,
            type: "question",
            options: [
              "Work/Professional",
              "Gaming",
              "Student",
              "Creative Work",
              "General Use"
            ]
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            content: "Here's a recommendation based on your needs:",
            isOutgoing: false,
          },
          {
            id: Date.now() + 2,
            isOutgoing: false,
            type: "product",
            content: "",
            product: {
              id: "1",
              name: "MacBook Air M2",
              description: "Perfect for professionals and students alike, featuring the powerful M2 chip, stunning display, and all-day battery life.",
              price: 1299.99,
              imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1000&auto=format&fit=crop"
            }
          }
        ]);
      }
    }, 1000);
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
