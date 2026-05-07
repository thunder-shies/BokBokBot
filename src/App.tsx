import { useState } from 'react';
import { VisualBackground } from './components/VisualBackground';
import { WebcamPreview } from './components/WebcamPreview';
import { ChatInterface } from './components/ChatInterface';
import { StatusLabels } from './components/StatusLabels';
import { useProjectionWindow } from './hooks/useProjectionWindow';
import { getMeanResponse } from './services/chatApi';
import { Eye, Activity, ShieldAlert, Cpu } from 'lucide-react';

type ChatMessage = {
  role: 'user' | 'ai';
  text: string;
};

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [metrics, setMetrics] = useState({ stupidity: 0.1, conformity: 0.1, polarization: 0.1 });
  const [labels, setLabels] = useState<string[]>([]);
  const [intensity, setIntensity] = useState(0.1);
  const { broadcastCaption } = useProjectionWindow();

  const handleSendMessage = async (text: string) => {
    setMessages(prev => [...prev, { role: 'user', text }]);
    setIsTyping(true);

    const result = await getMeanResponse(text);
    
    setMessages(prev => [...prev, { role: 'ai', text: result.response }]);
    setMetrics(result.metrics);
    setLabels(result.labels);
    
    // Calculate intensity based on metrics
    const avgIntensity = (result.metrics.stupidity + result.metrics.conformity + result.metrics.polarization) / 3;
    setIntensity(avgIntensity);
    
    setIsTyping(false);
  };

  return (
    <div className="relative min-h-screen w-full bg-black text-white font-mono selection:bg-white selection:text-black overflow-hidden flex flex-col">
      <div className="scanline" />
      <VisualBackground intensity={intensity} />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 p-4 flex justify-between items-center bg-black/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Cpu size={20} className="text-white" />
            <h1 className="text-lg font-bold tracking-[0.3em] uppercase">BokBok_Bot_v0.1</h1>
          </div>
          <div className="h-4 w-[1px] bg-white/20" />
          <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest">
            <Activity size={12} className="animate-pulse" />
            <span>System_Status: Hostile</span>
          </div>
        </div>
        <div className="text-[10px] text-white/40 uppercase tracking-widest">
          Session_ID: {Math.random().toString(36).substring(7).toUpperCase()}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 grid grid-cols-12 gap-4 p-4 h-[calc(100vh-64px)] overflow-hidden">
        
        {/* Left Column: Visuals & Status */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-hidden">
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/60 mb-2">
              <Eye size={12} />
              <span>Visual_Input_Feed</span>
            </div>
            <WebcamPreview />
          </section>

          <section className="flex-1 border border-white/10 bg-black/40 backdrop-blur-sm p-6 space-y-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/60 mb-4">
              <ShieldAlert size={12} />
              <span>Judgment_Metrics</span>
            </div>
            <StatusLabels metrics={metrics} labels={labels} />
          </section>
        </div>

        {/* Right Column: Chat Interface */}
        <div className="col-span-12 lg:col-span-8 h-full overflow-hidden">
          <ChatInterface 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            isTyping={isTyping}
            broadcastCaption={broadcastCaption}
          />
        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="relative z-10 border-t border-white/10 p-2 px-4 flex justify-between items-center bg-black/80 text-[9px] uppercase tracking-widest text-white/30">
        <div className="flex gap-4">
          <span>Latency: 62ms</span>
          <span>Buffer: 100%</span>
          <span>Core: Stable</span>
        </div>
        <div className="flex gap-4">
          <span>© 2026 Heidi Lui</span>
          <span>Digital_Inquisition_Active</span>
        </div>
      </footer>
    </div>
  );
}
