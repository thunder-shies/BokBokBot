import { useState, type FC } from 'react';
import { ChatInterface } from './ChatInterface';
import WebcamPreview from './WebcamPreview';
import StatusLabels from './StatusLabels';
import VisualBackground from './VisualBackground';
import '../styles/globals.css';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

interface ConversationTurn {
  id: string;
  userInput: string;
  aiResponse: string;
  tags: string[];
  intensity: number;
  timestamp: number;
}

interface MetricsState {
  stupidity: number;
  conformity: number;
  polarization: number;
}

const App: FC = () => {
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIntensity, setCurrentIntensity] = useState(0);
  const [metrics, setMetrics] = useState<MetricsState>({
    stupidity: 0.1,
    conformity: 0.1,
    polarization: 0.1,
  });

  const getMetricFromTags = (tags: string[]): MetricsState => {
    const next: MetricsState = {
      stupidity: 0.1,
      conformity: 0.1,
      polarization: 0.1,
    };

    const extractPercent = (tag: string): number | null => {
      const match = tag.match(/(\d+)%/);
      if (!match) return null;
      const value = Number(match[1]);
      return Number.isNaN(value) ? null : Math.max(0, Math.min(value / 100, 1));
    };

    tags.forEach((tag) => {
      const value = extractPercent(tag);
      if (value === null) return;

      if (tag.includes('愚昧')) next.stupidity = value;
      else if (tag.includes('盲從')) next.conformity = value;
      else if (tag.includes('兩極化')) next.polarization = value;
    });

    return next;
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    setIsLoading(true);

    try {
      // 調用後端 API
      const response = await fetch('http://localhost:8000/api/chat/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userInput: message }),
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const data = await response.json();
      const tags = data.tags || [];
      const intensity = calculateIntensity(message, tags);
      const nextMetrics = getMetricFromTags(tags);

      const newTurn: ConversationTurn = {
        id: Date.now().toString(),
        userInput: message,
        aiResponse: data.response,
        tags,
        intensity,
        timestamp: Date.now(),
      };

      setConversationHistory([...conversationHistory, newTurn]);
      setCurrentIntensity(intensity);
      setMetrics(nextMetrics);
    } catch (error) {
      console.error('Error:', error);
      // 示範回應（當後端不可用時）
      const mockTurn: ConversationTurn = {
        id: Date.now().toString(),
        userInput: message,
        aiResponse: generateMockResponse(message),
        tags: generateMockTags(),
        intensity: Math.random() * 100,
        timestamp: Date.now(),
      };
      setConversationHistory([...conversationHistory, mockTurn]);
      setMetrics(getMetricFromTags(mockTurn.tags));
      setCurrentIntensity(mockTurn.intensity);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateIntensity = (input: string, tags: string[]): number => {
    const baseIntensity = Math.min(input.length / 10, 50);
    const tagBonus = tags.length * 10;
    return Math.min(baseIntensity + tagBonus, 100);
  };

  const generateMockResponse = (input: string): string => {
    const mockResponses = [
      `嘩，又係呢句嘢？${input}？真係百般無聊啊。你呢句野講到好似自己深明大義咁，但其實屬於典型嘅「鍵盤勇士」類型。`,
      `${input}... 好啦，我聽到你講嘢啦。但係呢個立場真係中二到不得了。`,
      `你講嘅「${input.substring(0, 20)}...」完全就係社交媒體煽動仇恨嘅教科書典範。`,
    ];
    return mockResponses[Math.floor(Math.random() * mockResponses.length)];
  };

  const generateMockTags = (): string[] => {
    const allTags = [
      '愚昧指數: 87%',
      '盲從度: 92%',
      '兩極化傾向: 99%',
      '煽動性: 85%',
      '自我覺察缺失: 88%',
    ];
    return allTags.sort(() => Math.random() - 0.5).slice(0, 3);
  };

  // Convert conversation history to Message format for ChatInterface
  const messages: Message[] = conversationHistory.flatMap((turn) => [
    { role: 'user' as const, text: turn.userInput },
    { role: 'ai' as const, text: turn.aiResponse },
  ]);

  const currentLabels = conversationHistory.length > 0
    ? conversationHistory[conversationHistory.length - 1].tags.map((tag) => tag.split(':')[0].trim())
    : [];

  return (
    <div className="relative h-screen w-full bg-black text-white overflow-hidden flex flex-col">
      <VisualBackground intensity={currentIntensity / 100} />

      <header className="relative z-10 border-b border-white/10 p-4 flex justify-between items-center bg-black/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-[0.3em] uppercase">駁駁Bot_v0.1</h1>
          <div className="h-4 w-px bg-white/20" />
          <span className="text-[10px] uppercase tracking-widest text-white/40">System_Status: Hostile</span>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-white/40">
          Intensity: {currentIntensity.toFixed(0)}%
        </div>
      </header>

      <main className="relative z-10 flex-1 min-h-0 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        <div className="col-span-12 lg:col-span-4 min-h-0 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          <section className="space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-white/60">Visual_Input_Feed</div>
            <WebcamPreview />
          </section>

          <section className="border border-white/10 bg-black/40 backdrop-blur-sm p-5 space-y-5">
            <div className="text-[10px] uppercase tracking-widest text-white/60">Judgment_Metrics</div>
            <StatusLabels metrics={metrics} labels={currentLabels} />
          </section>
        </div>

        <div className="col-span-12 lg:col-span-8 h-full min-h-0 overflow-hidden">
          <ChatInterface 
            onSendMessage={handleSendMessage} 
            messages={messages}
            isTyping={isLoading}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
