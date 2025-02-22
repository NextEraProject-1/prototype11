
import { useState } from "react";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { Message } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Rocket, ShoppingCart, Package, Gift, Sparkles, ArrowRight } from "lucide-react";

const Index = () => {
  const { toast } = useToast();
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Hello! I'm here to help you find any product you're interested in. What are you looking to purchase today?",
      isOutgoing: false,
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

      // Try to parse the response as JSON first
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
          // Extract shopping links from the text content
          const shoppingLinksMatch = aiResponse.match(/Where to buy:\n((?:  - https:\/\/[^\n]+\n?)+)/);
          const shoppingLinks = shoppingLinksMatch ? 
            shoppingLinksMatch[1]
              .split('\n')
              .map(link => link.replace('  - ', ''))
              .filter(link => link.trim() !== '') : 
            [];

          messageProduct = {
            id: `product-${Date.now()}`,
            name: topRecommendation.name,
            price: topRecommendation.price,
            description: parsedJson.analysis,
            imageUrl: topRecommendation.imageUrl,
            shoppingLinks: shoppingLinks,
          };
        }
      }
      
      // Add AI response
      const aiMessage: Message = {
        id: Date.now() + 1,
        content: aiResponse,
        isOutgoing: false,
        type: messageType,
        product: messageProduct
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

  if (!showChat) {
    return (
      <div className="min-h-screen bg-background">
        <ChatHeader title="AI Product Advisor" />
        <main className="max-w-6xl mx-auto px-4 pt-16">
          {/* Hero Section */}
          <div className="text-center py-16 space-y-6">
            <div className="inline-block p-2 bg-primary/20 rounded-full mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              Your Personal Shopping Assistant
            </h1>
            <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto">
              Get personalized product recommendations for anything you need, powered by advanced AI.
            </p>
            <button
              onClick={() => setShowChat(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-foreground font-medium rounded-full transition-colors"
            >
              Start Shopping <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 py-12">
            <div className="p-6 rounded-2xl bg-white/50 backdrop-blur-sm border border-primary/10 space-y-3">
              <div className="p-3 bg-primary/20 rounded-full w-fit">
                <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Any Product</h3>
              <p className="text-foreground/70">From electronics to fashion, get recommendations for anything you need.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/50 backdrop-blur-sm border border-primary/10 space-y-3">
              <div className="p-3 bg-primary/20 rounded-full w-fit">
                <Rocket className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Smart Analysis</h3>
              <p className="text-foreground/70">AI-powered suggestions based on your specific needs and preferences.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/50 backdrop-blur-sm border border-primary/10 space-y-3">
              <div className="p-3 bg-primary/20 rounded-full w-fit">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Detailed Specs</h3>
              <p className="text-foreground/70">Get comprehensive product information with images and specifications.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/50 backdrop-blur-sm border border-primary/10 space-y-3">
              <div className="p-3 bg-primary/20 rounded-full w-fit">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Best Matches</h3>
              <p className="text-foreground/70">Compare options and get personalized top recommendations.</p>
            </div>
          </div>

          {/* Trust Section */}
          <div className="text-center py-16">
            <h2 className="text-2xl md:text-3xl font-semibold mb-4">
              Ready to find your perfect product?
            </h2>
            <p className="text-foreground/70 mb-8">
              Our AI assistant will guide you through the process and help you make the best choice.
            </p>
            <button
              onClick={() => setShowChat(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-foreground font-medium rounded-full transition-colors"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </main>
      </div>
    );
  }

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
