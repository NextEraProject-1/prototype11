
import { Menu } from "lucide-react";

interface ChatHeaderProps {
  title: string;
}

export const ChatHeader = ({ title }: ChatHeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-10 glass-effect">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
        <button className="p-2 rounded-full hover:bg-black/5 transition-colors md:hidden">
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-medium">{title}</h1>
      </div>
    </header>
  );
};
