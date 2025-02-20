
import { Send } from "lucide-react";
import { useState } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
}

export const ChatInput = ({ onSend }: ChatInputProps) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="fixed bottom-0 left-0 right-0 glass-effect p-4"
    >
      <div className="max-w-3xl mx-auto flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 rounded-full bg-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
        />
        <button
          type="submit"
          className="p-2.5 rounded-full bg-primary hover:bg-primary/80 transition-colors"
        >
          <Send size={20} />
        </button>
      </div>
    </form>
  );
};
