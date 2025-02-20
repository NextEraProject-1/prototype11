
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  content: string;
  isOutgoing?: boolean;
  sender?: string;
}

export const ChatMessage = ({ content, isOutgoing, sender }: ChatMessageProps) => {
  return (
    <div
      className={cn(
        "message-animation flex flex-col max-w-[80%] md:max-w-[60%] gap-1",
        isOutgoing ? "ml-auto items-end" : "items-start"
      )}
    >
      {sender && (
        <span className="text-xs text-foreground/70 px-2">{sender}</span>
      )}
      <div
        className={cn(
          "px-4 py-2 rounded-[var(--border-radius)] break-words",
          isOutgoing
            ? "bg-message-out rounded-tr-none"
            : "bg-message-in rounded-tl-none"
        )}
      >
        {content}
      </div>
    </div>
  );
};
