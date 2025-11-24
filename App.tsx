import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Book, Save, Volume2, VolumeX, X, Trash2, Sparkles, Wand2, Loader2, Eye } from 'lucide-react';
import { radio } from './utils/CosmicRadio';
import { continueWriting, polishWriting } from './services/geminiService';
import StarfieldBackground from './components/StarfieldBackground';
import { Draft, PlanetData } from './types';

export default function CosmicWriterApp() {
  const [text, setText] = useState('');
  const [pages, setPages] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [previewDraft, setPreviewDraft] = useState<Draft | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [currentPlanet, setCurrentPlanet] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  
  const [paperHeight, setPaperHeight] = useState(180);
  const [isPageFlipping, setIsPageFlipping] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const CHAR_LIMIT_PER_PAGE = 500;
  const MIN_PAPER_HEIGHT = 180;
  const MAX_PAPER_HEIGHT = 550;

  const planetData: PlanetData[] = useMemo(() => [
    { name: 'Mercury', color: 0xAAAAAA, size: 2.5, distance: 18 },    
    { name: 'Venus', color: 0xFFD700, size: 3.8, distance: 28 },      
    { name: 'Earth', color: 0x4488FF, size: 4.0, distance: 40 },      
    { name: 'Mars', color: 0xFF4422, size: 3.2, distance: 55 },       
    { name: 'Jupiter', color: 0xDDAA77, size: 9.0, distance: 80 },    
    { name: 'Saturn', color: 0xF4D03F, size: 7.5, distance: 110, ring: true }, 
    { name: 'Uranus', color: 0x44FFFF, size: 5.0, distance: 140 },    
    { name: 'Neptune', color: 0x3333FF, size: 4.8, distance: 170 },    
  ], []);

  // Audio & Planet Tone Logic
  useEffect(() => {
    if (audioEnabled && currentPlanet !== null) {
        radio.playPlanetTone(currentPlanet);
    } else if (!audioEnabled) {
        radio.stop();
    }
  }, [currentPlanet, audioEnabled]);

  const toggleAudio = () => {
      if (!audioEnabled) {
          radio.resume();
      }
      setAudioEnabled(!audioEnabled);
  };

  const flipPage = () => {
      setIsPageFlipping(true);
      if (audioEnabled) radio.playPageReturnSound();
      if (text.trim()) {
          setPages(prev => [...prev, text]);
      }
      setTimeout(() => {
          setText('');
          setPaperHeight(MIN_PAPER_HEIGHT); 
          setIsPageFlipping(false);
          setTimeout(() => textareaRef.current?.focus(), 50);
      }, 600);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    if (newText.length > CHAR_LIMIT_PER_PAGE) {
        flipPage();
        return;
    }
    setText(newText);
    const lineCount = newText.split('\n').length;
    const estimatedHeight = Math.max(MIN_PAPER_HEIGHT, Math.min(MAX_PAPER_HEIGHT, 150 + (lineCount * 25) + (newText.length / 5)));
    setPaperHeight(estimatedHeight);

    try {
        if (audioEnabled) radio.playTypewriterSound();
    } catch (error) {}
  };

  const saveManuscript = () => {
      if (!text.trim() && pages.length === 0) return;
      const planetName = (currentPlanet !== null && planetData[currentPlanet]) 
        ? planetData[currentPlanet].name 
        : 'Deep Space';
      const fullContent = [...pages, text].join('\n\n--- PAGE BREAK ---\n\n');
      const newDraft: Draft = {
          id: Date.now(),
          title: `星际手稿 #${drafts.length + 1}`,
          date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
          content: fullContent,
          planet: planetName
      };
      setDrafts([newDraft, ...drafts]);
      setText(''); 
      setPages([]);
      setPaperHeight(MIN_PAPER_HEIGHT);
      setSidebarOpen(true); 
  };

  const deleteDraft = (id: number, e: React.MouseEvent) => {
      e.stopPropagation();
      setDrafts(drafts.filter(d => d.id !== id));
      if (previewDraft?.id === id) setPreviewDraft(null);
  };

  const openPreview = (draft: Draft) => {
      setPreviewDraft(draft);
  };

  // --- Gemini AI Handlers ---
  const handleContinueWriting = async () => {
    if (isGenerating) return;
    if (!text.trim() && pages.length === 0) {
        setText("The engine hummed to life...");
        return;
    }
    setIsGenerating(true);
    setAiStatus('Receiving signal...'); 
    if (audioEnabled) radio.playTransmissionSound();
    
    try {
        const context = text.slice(-500);
        const generatedText = await continueWriting(context);
        
        // Streaming effect simulation
        const words = generatedText.split(' ');
        let currentText = text + (text.endsWith(' ') ? '' : ' ');
        
        for (let i = 0; i < words.length; i++) {
            if (currentText.length > CHAR_LIMIT_PER_PAGE) break; 
            currentText += words[i] + ' ';
            setText(currentText);
            
            // Adjust paper height dynamically
            const lineCount = currentText.split('\n').length;
            setPaperHeight(Math.max(MIN_PAPER_HEIGHT, Math.min(MAX_PAPER_HEIGHT, 150 + (lineCount * 25) + (currentText.length / 5))));
            
            if (audioEnabled && i % 2 === 0) radio.playTypewriterSound();
            await new Promise(r => setTimeout(r, 80)); 
        }
    } catch (error) { 
        console.error(error);
        setAiStatus('Signal lost');
    } finally {
        setIsGenerating(false);
        setAiStatus('');
        if (textareaRef.current) textareaRef.current.focus();
    }
  };

  const handlePolishWriting = async () => {
    if (isGenerating || !text.trim()) return;
    setIsGenerating(true);
    setAiStatus('Refactoring reality...'); 
    if (audioEnabled) radio.playTransmissionSound();
    
    try {
        const polishedText = await polishWriting(text);
        setText(polishedText);
        if (audioEnabled) radio.playTransmissionSound();
    } catch (error) { 
        console.error(error);
        setAiStatus('Interference detected');
    } finally { 
        setIsGenerating(false); 
        setAiStatus(''); 
    }
  };

  const currentPlanetInfo = currentPlanet !== null ? planetData[currentPlanet] : null;

  return (
    <div className="relative w-full h-screen bg-[#050510] overflow-hidden font-sans text-gray-200 selection:bg-cyan-500/30">
      
      {/* 3D Container */}
      <StarfieldBackground 
        planetData={planetData} 
        currentPlanetIndex={currentPlanet} 
        onPlanetSelect={setCurrentPlanet} 
      />

      {/* Top HUD */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-20 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-4">
            <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-3 bg-black/40 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/10 transition-all group"
            >
                <Book className="w-6 h-6 text-cyan-300 group-hover:scale-110 transition-transform" />
            </button>
            <div className="flex flex-col">
                <h1 className="text-xl font-bold tracking-widest text-cyan-100 uppercase drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
                    Cosmos Typewriter
                </h1>
                <span className="text-xs text-cyan-400/60 tracking-wider font-mono">
                    {currentPlanetInfo ? `ORBITING: ${currentPlanetInfo.name.toUpperCase()}` : 'SYSTEM: ADRIFT'}
                </span>
            </div>
        </div>

        <div className="pointer-events-auto flex gap-3">
             <button 
                onClick={toggleAudio}
                className={`p-3 backdrop-blur-md border rounded-full transition-all ${audioEnabled ? 'bg-cyan-900/50 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,255,255,0.3)]' : 'bg-black/40 border-white/10 text-gray-500 hover:text-white'}`}
            >
                {audioEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>
             {currentPlanet !== null && (
                 <button 
                    onClick={() => setCurrentPlanet(null)}
                    className="px-4 py-2 bg-black/40 backdrop-blur-md border border-white/20 rounded-full text-xs hover:bg-white/10 transition-all uppercase tracking-widest font-mono"
                 >
                     Zoom Out
                 </button>
             )}
        </div>
      </div>

      {/* Sidebar */}
      <div className={`absolute top-0 left-0 h-full w-80 bg-black/90 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-500 ease-out z-50 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                <h2 className="text-xl font-serif text-amber-100 italic">Archives</h2>
                <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {drafts.length === 0 ? (
                    <div className="text-center text-gray-600 mt-10 italic font-mono text-sm">No transmissions recorded...</div>
                ) : (
                    drafts.map(draft => (
                        <div key={draft.id} className="group relative p-4 bg-white/5 border border-white/5 rounded hover:border-amber-400/30 transition-all hover:bg-white/10 cursor-pointer" onClick={() => openPreview(draft)}>
                            <h3 className="text-amber-200 font-serif text-lg mb-1">{draft.title}</h3>
                            <div className="flex justify-between text-xs text-gray-500 mb-2 font-mono">
                                <span>{draft.date.split(' ')[0]}</span>
                                <span className="uppercase tracking-wider text-[10px]">{draft.planet}</span>
                            </div>
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); openPreview(draft); }} className="p-1 text-cyan-400 hover:bg-cyan-900/20 rounded"><Eye className="w-3 h-3"/></button>
                                <button onClick={(e) => deleteDraft(draft.id, e)} className="p-1 text-red-400 hover:bg-red-900/20 rounded"><Trash2 className="w-3 h-3"/></button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewDraft && (
          <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-10 animate-fade-in">
              <div className="relative w-full max-w-2xl bg-[#f0e6d2] text-gray-900 rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-4 border-b border-gray-300 flex justify-between items-center bg-[#e6dac0]">
                      <div>
                          <h2 className="font-serif text-xl font-bold">{previewDraft.title}</h2>
                          <p className="text-xs text-gray-600 uppercase tracking-wider font-mono">{previewDraft.planet}</p>
                      </div>
                      <button onClick={() => setPreviewDraft(null)} className="p-2 hover:bg-black/10 rounded-full transition-colors"><X className="w-6 h-6 text-gray-700" /></button>
                  </div>
                  <div className="p-8 overflow-y-auto custom-scrollbar font-mono text-base leading-7 whitespace-pre-wrap">{previewDraft.content}</div>
              </div>
          </div>
      )}

      {/* Floating Action Bar (FIXED POS) */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-50 pointer-events-auto">
          {/* AI: Continue */}
          <div className="relative group flex items-center justify-end gap-3">
              <span className="opacity-0 group-hover:opacity-100 text-cyan-300 text-xs font-mono transition-opacity bg-black/80 px-2 py-1 rounded">Continue</span>
              <button 
                  onClick={handleContinueWriting}
                  disabled={isGenerating}
                  className={`w-12 h-12 rounded-full border border-cyan-500/50 shadow-[0_0_15px_rgba(0,255,255,0.2)] flex items-center justify-center transition-all ${isGenerating ? 'bg-gray-800' : 'bg-black/60 backdrop-blur hover:bg-cyan-900/50 hover:scale-110'}`}
              >
                  {isGenerating ? <Loader2 className="w-5 h-5 text-cyan-200 animate-spin"/> : <Sparkles className="w-5 h-5 text-cyan-200"/>}
              </button>
          </div>

          {/* AI: Polish */}
          <div className="relative group flex items-center justify-end gap-3">
              <span className="opacity-0 group-hover:opacity-100 text-purple-300 text-xs font-mono transition-opacity bg-black/80 px-2 py-1 rounded">Polish</span>
              <button 
                  onClick={handlePolishWriting}
                  disabled={isGenerating || !text.trim()}
                  className={`w-12 h-12 rounded-full border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)] flex items-center justify-center transition-all ${isGenerating ? 'bg-gray-800' : 'bg-black/60 backdrop-blur hover:bg-purple-900/50 hover:scale-110'}`}
              >
                  <Wand2 className="w-5 h-5 text-purple-300"/>
              </button>
          </div>

          {/* Save */}
          <div className="relative group flex items-center justify-end gap-3">
             <span className="opacity-0 group-hover:opacity-100 text-amber-300 text-xs font-mono transition-opacity bg-black/80 px-2 py-1 rounded">Save Draft</span>
             <button 
                onClick={saveManuscript}
                className="w-14 h-14 rounded-full bg-amber-600 hover:bg-amber-500 border-4 border-[#222] shadow-xl flex items-center justify-center text-white transition-transform active:scale-95"
            >
                <Save className="w-6 h-6"/>
            </button>
          </div>
      </div>

      {/* Main Typewriter Area */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-2xl flex flex-col items-center justify-end z-30 pointer-events-none">
        
        {/* Paper */}
        <div className="relative w-[500px] pointer-events-auto overflow-visible flex justify-center perspective-1000 mb-[110px]">
            {/* AI Status */}
            {aiStatus && (
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 flex items-center gap-2 text-cyan-300 bg-black/60 px-4 py-2 rounded-full backdrop-blur-md border border-cyan-500/30 animate-pulse z-50">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs font-mono tracking-widest uppercase">{aiStatus}</span>
                </div>
            )}

            <div 
                className={`absolute bg-[#f0e6d2] text-gray-800 shadow-xl p-8 font-mono text-sm leading-6 transition-all duration-300 ease-out origin-bottom ${isPageFlipping ? 'animate-fly-off' : ''}`}
                style={{
                    width: '90%',
                    height: `${paperHeight}px`, 
                    bottom: '0px', 
                    transform: `rotateX(5deg)`,
                    boxShadow: '0 -5px 20px rgba(0,0,0,0.5)',
                    backgroundImage: `repeating-linear-gradient(#f0e6d2 0px, #f0e6d2 24px, #e0d6c2 25px)`,
                    zIndex: 35
                }}
            >
                <textarea 
                    ref={textareaRef}
                    autoFocus
                    value={text}
                    onChange={handleTextChange}
                    placeholder="..."
                    className="w-full h-full bg-transparent resize-none outline-none border-none font-mono text-base text-slate-800 placeholder-slate-400/30 overflow-hidden"
                    style={{ lineHeight: '25px' }}
                    spellCheck="false"
                />
                <div className="absolute bottom-1 right-2 text-[8px] text-gray-400 opacity-50">
                    {text.length} / {CHAR_LIMIT_PER_PAGE}
                </div>
            </div>
        </div>

        {/* Machine Body */}
        <div className="absolute bottom-0 w-full h-[180px] bg-[#2a2a2a] rounded-t-3xl shadow-2xl border-t-4 border-[#3a3a3a] flex flex-col items-center justify-start pt-4 z-40">
            <div className="w-[105%] h-12 bg-[#111] rounded-full -mt-8 border-b-2 border-gray-600 shadow-lg relative flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-gradient-to-b from-[#333] to-[#000] opacity-80"></div>
            </div>
            <div className="w-4/5 h-2 bg-[#1a1a1a] mt-4 mb-2 rounded-full shadow-inner"></div>
            <div className="text-[#555] text-[10px] tracking-[0.3em] font-bold uppercase mb-2">Interstellar Type-X</div>
            <div className="grid grid-cols-10 gap-1 w-3/4 opacity-50">
                {[...Array(30)].map((_, i) => (
                        <div key={i} className={`h-3 rounded-full bg-[#111] border border-[#333] shadow-[0_2px_0_#000] ${text.length % 30 === i ? 'translate-y-[2px] shadow-none bg-cyan-900' : ''}`}></div>
                ))}
            </div>
        </div>
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
    </div>
  );
}