
import { useState, useEffect } from "react";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { Message } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Rocket, ShoppingCart, Package, Gift, Sparkles, ArrowRight } from "lucide-react";

const welcomeMessages = {
  ar: "مرحباً! ما هو المنتج الذي تبحث عنه اليوم؟",
  en: "Hello! What product are you looking for today?",
  es: "¡Hola! ¿Qué producto estás buscando hoy?",
  fr: "Bonjour! Quel produit recherchez-vous aujourd'hui?",
  de: "Hallo! Welches Produkt suchen Sie heute?",
  it: "Ciao! Quale prodotto stai cercando oggi?",
  pt: "Olá! Qual produto você está procurando hoje?",
};

const Index = () => {
  const { toast } = useToast();
  const [showChat, setShowChat] = useState(false);
  const [currentLang, setCurrentLang] = useState(() => {
    const savedLang = localStorage.getItem("preferredLanguage");
    return savedLang || "ar";
  });
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: welcomeMessages[currentLang as keyof typeof welcomeMessages],
      isOutgoing: false,
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Update document direction based on language
  useEffect(() => {
    document.documentElement.dir = currentLang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("preferredLanguage", currentLang);
  }, [currentLang]);

  const handleLanguageChange = (lang: string) => {
    setCurrentLang(lang);
    setMessages(prev => [
      {
        id: Date.now(),
        content: welcomeMessages[lang as keyof typeof welcomeMessages],
        isOutgoing: false,
      },
      ...prev.slice(1)
    ]);
  };

  const handleSend = async (content: string) => {
    if (!content.trim()) return;
    
    const userMessage: Message = {
      id: Date.now(),
      content,
      isOutgoing: true,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const aiMessages = messages.map(msg => ({
        role: msg.isOutgoing ? 'user' : 'assistant',
        content: msg.content
      }));
      aiMessages.push({ role: 'user', content });

      console.log('Sending messages to AI:', aiMessages);

      const { data, error } = await supabase.functions.invoke('chat', {
        body: { messages: aiMessages, language: currentLang }
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

      let messageType: Message['type'] = 'text';
      let messageProduct = undefined;
      let parsedJson = null;

      try {
        if (aiResponse.trim().startsWith('{')) {
          parsedJson = JSON.parse(aiResponse);
        }
      } catch (e) {
        console.log('Response is not JSON, will process as text');
      }

      if (parsedJson?.type === 'product_recommendations') {
        const topRecommendation = parsedJson.options[parsedJson.topRecommendation.optionIndex];
        if (topRecommendation) {
          messageType = 'product';
          const shoppingLinks = topRecommendation.shoppingLinks || [];

          messageProduct = {
            id: `product-${Date.now()}`,
            name: topRecommendation.name,
            price: topRecommendation.price,
            description: parsedJson.analysis,
            imageUrl: topRecommendation.imageUrl,
            shoppingLinks,
          };
        }

        const analysisMessage: Message = {
          id: Date.now(),
          content: parsedJson.analysis,
          isOutgoing: false,
        };
        setMessages(prev => [...prev, analysisMessage]);

        const productMessage: Message = {
          id: Date.now() + 1,
          content: aiResponse,
          isOutgoing: false,
          type: messageType,
          product: messageProduct
        };
        setMessages(prev => [...prev, productMessage]);
      } else {
        const questions = aiResponse.split(/\?[\s\n]+/).filter(Boolean);
        
        for (let i = 0; i < questions.length; i++) {
          let question = questions[i];
          if (!question.trim()) continue;
          
          if (i < questions.length - 1 || aiResponse.endsWith('?')) {
            question += '?';
          }
          
          const message: Message = {
            id: Date.now() + i,
            content: question.trim(),
            isOutgoing: false,
            type: question.includes('?') ? 'question' : 'text'
          };
          setMessages(prev => [...prev, message]);
        }
      }
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

  if (!showChat) {
    return (
      <div className="min-h-screen bg-background">
        <ChatHeader 
          title="AI Product Advisor" 
          currentLang={currentLang}
          onLanguageChange={handleLanguageChange}
        />
        <main className="max-w-6xl mx-auto px-4 pt-16">
          <div className="text-center py-16 space-y-6">
            <div className="inline-block p-2 bg-primary/20 rounded-full mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              {currentLang === "ar" ? "مساعدك الشخصي للتسوق" : "Your Personal Shopping Assistant"}
            </h1>
            <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto">
              {currentLang === "ar" 
                ? "احصل على توصيات منتجات مخصصة لأي شيء تحتاجه، مدعومة بالذكاء الاصطناعي المتقدم"
                : "Get personalized product recommendations for anything you need, powered by advanced AI."}
            </p>
            <button
              onClick={() => setShowChat(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-full transition-colors"
            >
              {currentLang === "ar" ? "ابدأ التسوق" : "Start Shopping"} 
              <ArrowRight className={`w-4 h-4 ${currentLang === "ar" ? "rotate-180" : ""}`} />
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 py-12">
            <div className="p-6 rounded-2xl glass-effect space-y-3">
              <div className="p-3 bg-primary/20 rounded-full w-fit">
                <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">
                {currentLang === "ar" ? "أي منتج" : "Any Product"}
              </h3>
              <p className="text-foreground/70">
                {currentLang === "ar" 
                  ? "من الإلكترونيات إلى الأزياء، احصل على توصيات لكل ما تحتاجه"
                  : "From electronics to fashion, get recommendations for anything you need."}
              </p>
            </div>
            <div className="p-6 rounded-2xl glass-effect space-y-3">
              <div className="p-3 bg-primary/20 rounded-full w-fit">
                <Rocket className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">
                {currentLang === "ar" ? "تحليل ذكي" : "Smart Analysis"}
              </h3>
              <p className="text-foreground/70">
                {currentLang === "ar"
                  ? "اقتراحات مدعومة بالذكاء الاصطناعي بناءً على احتياجاتك وتفضيلاتك"
                  : "AI-powered suggestions based on your specific needs and preferences."}
              </p>
            </div>
            <div className="p-6 rounded-2xl glass-effect space-y-3">
              <div className="p-3 bg-primary/20 rounded-full w-fit">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">
                {currentLang === "ar" ? "مواصفات مفصلة" : "Detailed Specs"}
              </h3>
              <p className="text-foreground/70">
                {currentLang === "ar"
                  ? "احصل على معلومات شاملة عن المنتج مع الصور والمواصفات"
                  : "Get comprehensive product information with images and specifications."}
              </p>
            </div>
            <div className="p-6 rounded-2xl glass-effect space-y-3">
              <div className="p-3 bg-primary/20 rounded-full w-fit">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">
                {currentLang === "ar" ? "أفضل التطابقات" : "Best Matches"}
              </h3>
              <p className="text-foreground/70">
                {currentLang === "ar"
                  ? "قارن الخيارات واحصل على أفضل التوصيات المخصصة"
                  : "Compare options and get personalized top recommendations."}
              </p>
            </div>
          </div>

          <div className="text-center py-16">
            <h2 className="text-2xl md:text-3xl font-semibold mb-4">
              {currentLang === "ar" 
                ? "هل أنت جاهز للعثور على منتجك المثالي؟"
                : "Ready to find your perfect product?"}
            </h2>
            <p className="text-foreground/70 mb-8">
              {currentLang === "ar"
                ? "سيرشدك مساعدنا الذكي خلال العملية ويساعدك في اتخاذ أفضل خيار"
                : "Our AI assistant will guide you through the process and help you make the best choice."}
            </p>
            <button
              onClick={() => setShowChat(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-full transition-colors"
            >
              {currentLang === "ar" ? "ابدأ الآن" : "Get Started"}
              <ArrowRight className={`w-4 h-4 ${currentLang === "ar" ? "rotate-180" : ""}`} />
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ChatHeader 
        title="AI Product Advisor" 
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
      />
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
