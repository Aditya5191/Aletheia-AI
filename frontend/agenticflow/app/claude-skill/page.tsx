"use client";

import React, { useRef, useState } from 'react';
import Typewriter from 'typewriter-effect';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, Shield, Cpu, Activity, BarChart3, Database, Lock, 
  FileSearch, Telescope, Waypoints, Network, Fingerprint, 
  CheckCircle2, AlertTriangle, Users, Scale, FileText, Terminal, 
  Search, Layers, Zap, Info, Binary, Copy, Download, Code2,
  Settings, Plus, Upload, MessageSquare, ExternalLink, ChevronRight, ChevronLeft, ShieldAlert, Check
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';

const FaultyTerminal = dynamic(() => import('@/components/FaultyTerminal'), { ssr: false });
const BackgroundHalo = dynamic(() => import('@/components/BackgroundHalo').then(mod => mod.BackgroundHalo), { ssr: false });

export default function ClaudeSkillPage() {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('bob');
  const [claudeSlide, setClaudeSlide] = useState(0);
  const claudeSteps = [
    { img: '/claude-install/step0.png', label: 'Step 1: Run the installer' },
    { img: '/claude-install/step1.png', label: 'Step 2: Go to Settings > Connectors' },
    { img: '/claude-install/step2.png', label: 'Step 3: Create plugin > Upload plugin' },
    { img: '/claude-install/step3.png', label: 'Step 4: Upload the Aletheia plugin file' },
    { img: '/claude-install/step4.png', label: 'Step 5: Continue to install MCP servers' },
    { img: '/claude-install/step5.png', label: 'Step 6: Aletheia plugin installed!' },
  ];
  const [codexSlide, setCodexSlide] = useState(0);
  const codexSteps = [
    { img: '/codex-install/step0.png', label: 'Step 1: Run the installer' },
    { img: '/codex-install/step1.png', label: 'Step 2: Go to Plugins' },
    { img: '/codex-install/step2.png', label: 'Step 3: Search & add Aletheia plugin' },
    { img: '/codex-install/step3.png', label: 'Step 4: Start auditing with Aletheia' },
  ];
  const [antiSlide, setAntiSlide] = useState(0);
  const antiSteps = [
    { img: '/anti-install/step0.png', label: 'Step 1: Run the installer' },
    { img: '/anti-install/step1.png', label: 'Step 2: Antigravity Settings' },
    { img: '/anti-install/step2.png', label: 'Step 3: Aletheia skill installed' },
  ];
  const [bobSlide, setBobSlide] = useState(0);
  const bobSteps = [
    { img: '/ibm-bob-install/stop 0.png', label: 'Step 1: Run the installer' },
    { img: '/ibm-bob-install/step1.png', label: 'Step 2: Restart IBM Bob' },
    { img: '/ibm-bob-install/step2.png', label: 'Step 3: Check MCP Servers' },
    { img: '/ibm-bob-install/step3.png', label: 'Step 4: Enable Aletheia Skill' },
  ];


  const navItems = [
    { label: 'Science', path: '/science' },
    { label: 'Agent Plugin', path: '/claude-skill' },
    { label: 'Privacy', path: '/privacy' },
    { label: 'About and FAQ', path: '/about' },
  ];

  return (
    <div ref={container} className="flex-1 min-h-screen flex flex-col bg-background overflow-x-hidden relative text-on-surface">
      <BackgroundHalo />
      
      {/* Background Terminal Effect */}
      <div className="fixed inset-0 z-0 opacity-[0.08] pointer-events-none">
        <FaultyTerminal scale={1} digitSize={1.5} scanlineIntensity={0.2} glitchAmount={0.5} flickerAmount={0.5} noiseAmp={1} curvature={0.2} tint="#FF691A" brightness={1} dpr={1} />
      </div>

      {/* Navigation Header */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[1200px] z-[100] px-8 py-4 flex items-center justify-between glass border border-white/5 rounded-full shadow-2xl">
        <div className="flex items-center gap-12">
          <h1 onClick={() => router.push('/')} className="text-xl font-display font-bold text-primary uppercase tracking-[0.3em] flex items-center gap-3 cursor-pointer">
             <Shield size={20} />
             Aletheia
          </h1>
          <nav className="hidden md:flex gap-8">
            {navItems.map((item) => (
              <button 
                key={item.label} 
                onClick={() => router.push(item.path)}
                className={`text-[11px] uppercase font-bold tracking-[0.2em] transition-colors relative group ${item.path === '/claude-skill' ? 'text-white' : 'text-on-surface-variant hover:text-white'}`}
              >
                {item.label}
                <span className={`absolute -bottom-2 left-0 h-0.5 bg-primary transition-all ${item.path === '/claude-skill' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </button>
            ))}
          </nav>
        </div>
        <button onClick={() => router.push('/dashboard')} className="btn-secondary group flex items-center gap-3 bg-white/5 backdrop-blur-md border-white/10 rounded-full uppercase tracking-widest text-[10px]">
          Initialize Audit
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </header>

      <main className="flex-1 flex flex-col pt-40 lg:pt-48 relative z-10 items-center min-h-screen pb-32">
        
        {/* Computing Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-[#16171a]/80 backdrop-blur-sm mb-12 shadow-2xl">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-pulse">
              <circle cx="12" cy="12" r="8" stroke="#f95d2c" strokeWidth="2"/>
              <path d="M4 12 A8 8 0 0 1 20 12 Z" fill="#f95d2c"/>
           </svg>
           <span className="text-[13px] font-sans text-[#f95d2c] font-medium tracking-wide">Computing...</span>
        </div>

        {/* Big Typing Text Container to prevent layout shift */}
        <div className="h-[100px] md:h-[120px] lg:h-[150px] flex justify-center items-center mb-8 w-full px-4 overflow-hidden">
          <h2 className="text-4xl md:text-6xl lg:text-[80px] xl:text-[90px] font-display font-black text-white text-center leading-[1.1] tracking-tighter whitespace-nowrap">
            Built for <span className="text-[#f95d2c]">&gt;</span> <span className="text-[#f95d2c] opacity-90 inline-block text-left min-w-[200px]">
              <Typewriter
                options={{
                  strings: ['developers', 'engineers', 'analysts', 'auditors', 'teams'],
                  autoStart: true,
                  loop: true,
                  delay: 50,
                  deleteSpeed: 30,
                }}
              />
            </span>
          </h2>
        </div>

        {/* Subtext */}
        <p className="text-[17px] md:text-[20px] text-[#9ca3af] max-w-[850px] text-center mb-12 leading-[1.7] font-sans font-normal px-6">
          Work with Aletheia directly in your data pipeline. Audit, mitigate, and report from your terminal, IDE, or the web. Describe what you need, and the agent handles the rest.
        </p>

        {/* Command Box */}
        <div className="flex items-center bg-[#1e1f23] border border-white/[0.08] p-1.5 rounded-full mb-5 shadow-xl relative max-w-fit transition-all hover:border-white/15">
           <button className="flex items-center gap-2 px-7 py-3.5 bg-white text-[#1a1a1a] rounded-full font-semibold text-[17px] whitespace-nowrap shadow-sm transition-colors hover:bg-gray-100">
             Get Agent Plugin
             <ChevronRight size={16} className="opacity-40 rotate-90" />
           </button>
           <div className="flex-1 flex items-center justify-center px-7 py-3.5">
              <span className="font-mono text-[20px] text-[#a0a0a8] tracking-normal flex-1 text-center">
                 <span className="text-[#f95d2c] mr-1.5">npx</span>create-aletheia-skill
              </span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText('npx create-aletheia-skill');
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className={`flex items-center justify-center p-1.5 ml-3 transition-all duration-300 ${copied ? 'text-emerald-400 scale-110' : 'text-white/30 hover:text-white/70'}`}
                title="Copy to clipboard"
              >
                 {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
           </div>
        </div>

        {/* Docs Link */}
        <p className="text-[13px] text-[#6b7280] mb-16 font-sans">
          Or read the <a href="https://github.com/Aditya5191/Aletheia-AI" target="_blank" rel="noreferrer" className="text-[#6b7280] hover:text-white transition-colors underline decoration-[#6b7280]/50 hover:decoration-white underline-offset-4">documentation</a>
        </p>

        {/* Platform Tabs Section */}
        {(() => {
          const tabs = [
            { id: 'bob', label: 'IBM Bob' },
            { id: 'claude', label: 'Claude' },
            { id: 'codex', label: 'Codex' },
            { id: 'antigravity', label: 'Antigravity' },
          ];
          const previews: Record<string, React.ReactNode> = {
            claude: (
              <div className="flex flex-col h-full relative">
                {/* Image */}
                <div className="flex-1 flex items-center justify-center relative">
                  <AnimatePresence mode="wait">
                    <motion.img 
                      key={claudeSlide}
                      src={claudeSteps[claudeSlide].img} 
                      alt={claudeSteps[claudeSlide].label}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-full rounded-2xl object-cover"
                    />
                  </AnimatePresence>
                  {/* Step Number Badge */}
                  <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-[#f95d2c] flex items-center justify-center text-white font-bold text-[16px] shadow-lg font-sans">
                    {claudeSlide + 1}
                  </div>
                  {/* Left Button */}
                  <button
                    onClick={() => setClaudeSlide((prev) => (prev - 1 + claudeSteps.length) % claudeSteps.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  {/* Right Button */}
                  <button
                    onClick={() => setClaudeSlide((prev) => (prev + 1) % claudeSteps.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                {/* Dots */}
                <div className="flex items-center justify-center gap-2 py-3">
                  {claudeSteps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setClaudeSlide(i)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${i === claudeSlide ? 'bg-[#f95d2c] w-5' : 'bg-white/20 hover:bg-white/40'}`}
                    />
                  ))}
                </div>
              </div>
            ),
            codex: (
              <div className="flex flex-col h-full relative">
                {/* Image */}
                <div className="flex-1 flex items-center justify-center relative">
                  <AnimatePresence mode="wait">
                    <motion.img 
                      key={codexSlide}
                      src={codexSteps[codexSlide].img} 
                      alt={codexSteps[codexSlide].label}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-full rounded-2xl object-cover"
                    />
                  </AnimatePresence>
                  {/* Step Number Badge */}
                  <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-[#f95d2c] flex items-center justify-center text-white font-bold text-[16px] shadow-lg font-sans">
                    {codexSlide + 1}
                  </div>
                  {/* Left Button */}
                  <button
                    onClick={() => setCodexSlide((prev) => (prev - 1 + codexSteps.length) % codexSteps.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  {/* Right Button */}
                  <button
                    onClick={() => setCodexSlide((prev) => (prev + 1) % codexSteps.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                {/* Dots */}
                <div className="flex items-center justify-center gap-2 py-3">
                  {codexSteps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCodexSlide(i)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${i === codexSlide ? 'bg-[#f95d2c] w-5' : 'bg-white/20 hover:bg-white/40'}`}
                    />
                  ))}
                </div>
              </div>
            ),
            antigravity: (
              <div className="flex flex-col h-full relative">
                {/* Image */}
                <div className="flex-1 flex items-center justify-center relative">
                  <AnimatePresence mode="wait">
                    <motion.img 
                      key={antiSlide}
                      src={antiSteps[antiSlide].img} 
                      alt={antiSteps[antiSlide].label}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-full rounded-2xl object-cover"
                    />
                  </AnimatePresence>
                  {/* Step Number Badge */}
                  <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-[#f95d2c] flex items-center justify-center text-white font-bold text-[16px] shadow-lg font-sans">
                    {antiSlide + 1}
                  </div>
                  {/* Left Button */}
                  <button
                    onClick={() => setAntiSlide((prev) => (prev - 1 + antiSteps.length) % antiSteps.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  {/* Right Button */}
                  <button
                    onClick={() => setAntiSlide((prev) => (prev + 1) % antiSteps.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                {/* Dots */}
                <div className="flex items-center justify-center gap-2 py-3">
                  {antiSteps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setAntiSlide(i)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${i === antiSlide ? 'bg-[#f95d2c] w-5' : 'bg-white/20 hover:bg-white/40'}`}
                    />
                  ))}
                </div>
              </div>
            ),
            bob: (
              <div className="flex flex-col h-full relative">
                {/* Image */}
                <div className="flex-1 flex items-center justify-center relative">
                  <AnimatePresence mode="wait">
                    <motion.img 
                      key={bobSlide}
                      src={bobSteps[bobSlide].img} 
                      alt={bobSteps[bobSlide].label}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-full rounded-2xl object-cover"
                    />
                  </AnimatePresence>
                  {/* Step Number Badge */}
                  <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-[#f95d2c] flex items-center justify-center text-white font-bold text-[16px] shadow-lg font-sans">
                    {bobSlide + 1}
                  </div>
                  {/* Left Button */}
                  <button
                    onClick={() => setBobSlide((prev) => (prev - 1 + bobSteps.length) % bobSteps.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  {/* Right Button */}
                  <button
                    onClick={() => setBobSlide((prev) => (prev + 1) % bobSteps.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                {/* Dots */}
                <div className="flex items-center justify-center gap-2 py-3">
                  {bobSteps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setBobSlide(i)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${i === bobSlide ? 'bg-[#f95d2c] w-5' : 'bg-white/20 hover:bg-white/40'}`}
                    />
                  ))}
                </div>
              </div>
            ),
          };
          return (
            <div className="flex flex-col items-center w-[90%] max-w-[850px] mb-32">
              {/* Tab Header */}
              <div className="flex flex-col md:flex-row items-center gap-6 mb-10">
                <span className="text-[18px] text-[#9ca3af] font-sans">Use Aletheia where you work</span>
                <div className="flex items-center bg-[#1e1f23] border border-white/[0.08] rounded-full p-1.5">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-7 py-2.5 rounded-full text-[16px] font-semibold transition-all duration-300 ${
                        activeTab === tab.id
                          ? 'bg-white text-black shadow-sm'
                          : 'text-[#9ca3af] hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Preview Window */}
              <div className="w-full rounded-2xl overflow-hidden min-h-[320px]">
                {previews[activeTab]}
              </div>
            </div>
          );
        })()}

        {/* CTA Section */}
        <div className="flex flex-col items-center justify-center py-32 px-8 w-full">
          <h2 className="text-5xl md:text-7xl font-black text-white text-center leading-[1.1] tracking-tight font-display uppercase mb-12">
            Connect to<br />your agent now.
          </h2>
          <a
            href="#"
            className="group flex items-center gap-3 bg-[#f95d2c] hover:bg-[#ff7a4d] text-black font-bold text-sm uppercase tracking-widest px-12 py-5 rounded-full transition-all duration-300 hover:shadow-[0_0_40px_rgba(249,93,44,0.4)]"
          >
            Get the Aletheia Plugin
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

      </main>

      {/* Footer */}
      <footer className="px-8 py-20 border-t border-white/5 bg-[#050608] relative z-40">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 max-w-[1200px] mx-auto">
          <div className="flex flex-col gap-3 items-center md:items-start">
            <div className="flex items-center gap-3 text-primary mb-2">
              <Shield size={16} />
              <span className="font-display font-bold uppercase tracking-widest text-sm text-white">Aletheia</span>
            </div>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">© 2026 Aletheia Forensic AI Systems</span>
            <span className="text-[8px] text-on-surface-variant/40 uppercase tracking-[0.4em]">Google Solution Challenge — Team Technopaths</span>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-x-12 gap-y-6">
            {navItems.map((item) => (
              <button key={item.label} onClick={() => router.push(item.path)} className="text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-white transition-colors font-bold">
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
