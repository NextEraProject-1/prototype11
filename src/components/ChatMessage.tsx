
import { cn } from "@/lib/utils";
import { Message } from "@/types/chat";
import { ExternalLink } from "lucide-react";

interface ChatMessageProps extends Message {}

export const ChatMessage = ({ content, isOutgoing, sender, type, options, product }: ChatMessageProps) => {
  if (type === "product" && product) {
    return (
      <div className="message-animation w-full max-w-[80%] md:max-w-[60%]">
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
          <h3 className="font-medium text-lg">{product.name}</h3>
          {product.imageUrl && (
            <img 
              src={product.imageUrl} 
              alt={product.name}
              className="w-full h-48 object-cover rounded-md"
            />
          )}
          <p className="text-sm text-foreground/80">{product.description}</p>
          <div className="flex flex-col gap-2">
            <span className="font-medium text-lg">
              ${product.price.toFixed(2)}
            </span>
            {product.shoppingLinks && product.shoppingLinks.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Where to buy:</h4>
                <div className="flex flex-col gap-2">
                  {product.shoppingLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {new URL(link).hostname.replace('www.', '')}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (type === "question" && options) {
    return (
      <div className="message-animation w-full max-w-[80%] md:max-w-[60%]">
        <div className="space-y-3">
          <div className={cn(
            "px-4 py-2 rounded-[var(--border-radius)] break-words",
            "bg-message-in rounded-tl-none"
          )}>
            {content}
          </div>
          <div className="flex flex-col gap-2">
            {options.map((option, index) => (
              <button
                key={index}
                className="px-4 py-2 text-left rounded-full bg-white hover:bg-primary/20 transition-colors border border-primary"
                onClick={() => console.log("Selected:", option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
