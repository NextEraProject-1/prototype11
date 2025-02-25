
import { LanguageSelector } from "./LanguageSelector";

interface ChatHeaderProps {
  title: string;
  currentLang: string;
  onLanguageChange: (lang: string) => void;
}

export const ChatHeader = ({ title, currentLang, onLanguageChange }: ChatHeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
      <div className="flex items-center justify-between h-16 px-4 max-w-3xl mx-auto">
        <h1 className="font-semibold">{title}</h1>
        <LanguageSelector currentLang={currentLang} onLanguageChange={onLanguageChange} />
      </div>
    </header>
  );
};
