"use client";

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, Shield, Cpu, Activity, BarChart3, Database, Lock, 
  FileSearch, Telescope, Waypoints, Network, Fingerprint, 
  CheckCircle2, AlertTriangle, Users, Scale, FileText, Terminal, 
  Search, Layers, Zap, Info, Binary, Copy, Download, Code2,
  Settings, Plus, Upload, MessageSquare, ExternalLink, ChevronRight, ShieldAlert
} from 'lucide-react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const FaultyTerminal = dynamic(() => import('@/components/FaultyTerminal'), { ssr: false });
const BackgroundHalo = dynamic(() => import('@/components/BackgroundHalo').then(mod => mod.BackgroundHalo), { ssr: false });

export default function ClaudeSkillPage() {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.from('.hero-badge', { y: 30, opacity: 0, duration: 1, delay: 0.2 })
      .from('.hero-title-line .hero-text-inner', { yPercent: 120, duration: 1.2, stagger: 0.15 }, '-=0.8')
      .from('.hero-desc', { y: 30, opacity: 0, duration: 1 }, '-=0.8');

    gsap.from('.step-big', {
      scrollTrigger: {
        trigger: '.steps-visual',
        start: 'top 80%',
      },
      scale: 0.8,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2,
      ease: 'back.out(1.7)'
    });
  }, { scope: container });

  const navItems = [
    { label: 'Science', path: '/science' },
    { label: 'Claude Skill', path: '/claude-skill' },
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

      <main className="flex-1 flex flex-col pt-32 relative z-10">
        
        {/* CLI Hero */}
        <section className="px-8 lg:px-20 py-24 flex flex-col items-center text-center relative min-h-[60vh] justify-center">
          <div className="flex flex-col items-center gap-8 z-10 max-w-[1000px]">
            <span className="hero-badge text-[10px] text-primary uppercase tracking-[0.5em] font-label font-bold bg-background/40 backdrop-blur-sm px-8 py-2.5 rounded-full border border-primary/20 shadow-[0_0_30px_rgba(255,105,26,0.15)]">
              Developer First Experience
            </span>
            <h2 className="text-5xl md:text-8xl font-display font-black text-on-surface uppercase tracking-tighter leading-[0.85] drop-shadow-2xl">
              <div className="hero-title-line overflow-hidden"><div className="hero-text-inner text-white text-4xl md:text-7xl lg:text-8xl">Run Aletheia Inside Claude.</div></div> 
              <div className="hero-title-line overflow-hidden pb-4">
                <div className="hero-text-inner text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-[#9b51e0]">No Infrastructure Setup.</div>
              </div>
            </h2>
            <p className="hero-desc text-xl text-on-surface-variant leading-relaxed max-w-[850px] font-sans opacity-90 border-l-2 border-primary/30 pl-8 text-left">
              Connect Aletheia as a Claude plugin and run full bias audits directly from your Claude conversation — your data stays on your machine, the intelligence comes from our MCP.
            </p>
          </div>
        </section>

        {/* Big Visual Steps */}
        <section className="px-8 lg:px-20 py-20 bg-surface-lowest/30 border-y border-white/5 relative">
          <div className="max-w-[1000px] mx-auto grid md:grid-cols-3 gap-8 items-center text-center steps-visual">
             <div className="step-big flex flex-col gap-6 items-center">
                <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white relative">
                   <span className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-black font-display font-black flex items-center justify-center text-sm shadow-xl">1</span>
                   <Terminal size={32} />
                </div>
                <div className="flex flex-col gap-1">
                   <h4 className="text-sm font-black uppercase tracking-widest text-white">Open Claude</h4>
                   <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">Launch Desktop App</span>
                </div>
             </div>

             <div className="hidden md:block text-white/10"><ChevronRight size={40} /></div>

             <div className="step-big flex flex-col gap-6 items-center">
                <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white relative">
                   <span className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-black font-display font-black flex items-center justify-center text-sm shadow-xl">2</span>
                   <div className="flex flex-col items-center gap-1">
                      <Settings size={20} />
                      <Plus size={16} className="text-primary" />
                   </div>
                </div>
                <div className="flex flex-col gap-1">
                   <h4 className="text-sm font-black uppercase tracking-widest text-white">Go to Connectors</h4>
                   <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">Create + &rarr; Upload</span>
                </div>
             </div>

             <div className="hidden md:block text-white/10"><ChevronRight size={40} /></div>

             <div className="step-big flex flex-col gap-6 items-center">
                <div className="w-20 h-20 rounded-3xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary relative">
                   <span className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-black font-display font-black flex items-center justify-center text-sm shadow-xl">3</span>
                   <CheckCircle2 size={32} />
                </div>
                <div className="flex flex-col gap-1">
                   <h4 className="text-sm font-black uppercase tracking-widest text-primary">You&apos;re Done</h4>
                   <span className="text-[10px] text-primary/60 uppercase font-bold tracking-widest">Ready to Audit</span>
                </div>
             </div>
          </div>
        </section>

        {/* Detailed Instructions Block */}
        <section className="px-8 lg:px-20 py-40 bg-background relative overflow-hidden">
           <div className="max-w-[1200px] mx-auto grid lg:grid-cols-12 gap-20">
              {/* Left Side: Step by Step */}
              <div className="lg:col-span-7 flex flex-col gap-20">
                 
                 {/* Step 1: Install */}
                 <div className="flex flex-col gap-8">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-display font-black text-sm">01</div>
                       <h3 className="text-2xl font-display font-black uppercase text-white tracking-widest">Install the Skill</h3>
                    </div>
                    <div className="flex flex-col gap-4">
                       <p className="text-on-surface-variant leading-relaxed">Run this once in your terminal to build the Aletheia plugin file on your machine.</p>
                       <div className="bg-[#0d0f14] border border-white/10 rounded-xl p-6 font-mono text-sm group relative">
                          <div className="text-on-surface-variant flex gap-4">
                            <span className="text-primary">$</span>
                            <span className="text-white">npx create-aletheia-skill</span>
                          </div>
                          <button className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors opacity-0 group-hover:opacity-100"><Copy size={16} /></button>
                       </div>
                       <p className="text-[11px] text-white/40 font-sans italic">This command generates a configuration file and tells you the exact path to upload.</p>
                    </div>
                 </div>

                 {/* Step 2: Connect */}
                 <div className="flex flex-col gap-8">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-display font-black text-sm">02</div>
                       <h3 className="text-2xl font-display font-black uppercase text-white tracking-widest">Connect to Claude</h3>
                    </div>
                    <ul className="space-y-4">
                       {[
                         "Open Claude Desktop app.",
                         "Go to Settings → Connectors.",
                         "Click Create + → Upload plugin.",
                         "Upload the file generated in Step 1."
                       ].map((item, i) => (
                         <li key={i} className="flex items-center gap-4 group">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/30 group-hover:bg-primary transition-colors"></div>
                            <span className="text-on-surface-variant font-bold uppercase tracking-widest text-[11px]">{item}</span>
                         </li>
                       ))}
                    </ul>
                 </div>

                 {/* Step 3: Tell Claude */}
                 <div className="flex flex-col gap-8">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-display font-black text-sm">03</div>
                       <h3 className="text-2xl font-display font-black uppercase text-white tracking-widest">Initialize via Prompt</h3>
                    </div>
                    <div className="flex flex-col gap-6">
                       <p className="text-on-surface-variant leading-relaxed">Once connected, open a new Claude conversation and use one of these prompts:</p>
                       
                       <div className="bg-white/5 border border-white/5 rounded-2xl p-8 flex flex-col gap-6 hover:border-primary/20 transition-all group">
                          <div className="flex items-center justify-between border-b border-white/5 pb-4">
                             <span className="text-[10px] font-mono text-primary uppercase font-bold tracking-widest">Dataset Audit Prompt</span>
                             <MessageSquare size={16} className="text-primary" />
                          </div>
                          <p className="text-sm font-mono text-white leading-relaxed">
                             &quot;The Aletheia sandbox container is already built. <br />
                             Audit this dataset: [attach your CSV]&quot;
                          </p>
                       </div>

                       <div className="bg-white/5 border border-white/5 rounded-2xl p-8 flex flex-col gap-6 hover:border-primary/20 transition-all group">
                          <div className="flex items-center justify-between border-b border-white/5 pb-4">
                             <span className="text-[10px] font-mono text-purple-400 uppercase font-bold tracking-widest">Model Audit Prompt</span>
                             <MessageSquare size={16} className="text-purple-400" />
                          </div>
                          <p className="text-sm font-mono text-white leading-relaxed">
                             &quot;The Aletheia sandbox container is already built. <br />
                             Audit this model: [attach your .pkl and sample.csv]&quot;
                          </p>
                       </div>
                       
                       <p className="text-xs text-on-surface-variant italic border-l-2 border-primary/20 pl-6">
                          Claude handles everything from there — all four agents run autonomously, and audit outputs appear in your local working directory.
                       </p>
                    </div>
                 </div>

              </div>

              {/* Right Side: Visual Proof */}
              <div className="lg:col-span-5 flex flex-col gap-10">
                 <div className="flex flex-col gap-4">
                    <span className="text-[10px] text-primary uppercase tracking-[0.4em] font-label font-bold">Integration Preview</span>
                    <h3 className="text-3xl font-display font-black uppercase text-white leading-none">What you see <br />in Claude</h3>
                 </div>

                 {/* Simulated Claude Connectors Panel */}
                 <div className="bg-[#1a1b26] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative group">
                    <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                       <span className="text-[10px] font-mono text-white/40 uppercase">Settings &rarr; Connectors</span>
                       <div className="flex gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500/30"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/30"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500/30"></div>
                       </div>
                    </div>
                    <div className="p-8 flex flex-col gap-8">
                       <div className="flex flex-col gap-2">
                          <span className="text-[10px] font-bold uppercase text-white/20 tracking-widest">Personal Plugins</span>
                          <div className="h-[1px] w-full bg-white/5"></div>
                       </div>
                       
                       {/* The Aletheia Plugin Entry */}
                       <div className="flex items-center justify-between p-6 bg-primary/5 border border-primary/20 rounded-2xl">
                          <div className="flex items-center gap-5">
                             <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-black">
                                <Shield size={28} />
                             </div>
                             <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-black uppercase text-white tracking-widest">Aletheia-AI</span>
                                <span className="text-[9px] font-mono text-primary uppercase font-bold tracking-widest italic">Personal Plugin</span>
                             </div>
                          </div>
                          {/* Toggle Switch */}
                          <div className="w-12 h-6 bg-primary rounded-full relative p-1 shadow-[0_0_15px_rgba(255,105,26,0.3)]">
                             <div className="absolute right-1 top-1 w-4 h-4 bg-black rounded-full"></div>
                          </div>
                       </div>

                       <div className="flex flex-col gap-4 mt-4">
                          <div className="flex items-start gap-4">
                             <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white/40"><Database size={16} /></div>
                             <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-white uppercase tracking-widest leading-none mt-1">Data Sovereignty Active</span>
                                <p className="text-[9px] text-on-surface-variant font-sans leading-relaxed">Agentic Sandbox is locked to local environment.</p>
                             </div>
                          </div>
                       </div>
                    </div>
                    <div className="absolute bottom-4 left-0 w-full text-center">
                       <span className="text-[9px] font-mono text-white/10 uppercase tracking-[0.5em]">Forensic Audit System v4.0</span>
                    </div>
                 </div>

                 <div className="p-8 bg-primary/10 border border-primary/20 rounded-[2rem] flex flex-col gap-4 text-center items-center">
                    <ShieldAlert size={40} className="text-primary" />
                    <p className="text-sm text-white font-display font-black uppercase tracking-widest leading-tight">
                       Aletheia appears as a personal plugin. <br />
                       <span className="text-primary/80">Your data never leaves your machine.</span>
                    </p>
                 </div>
              </div>
           </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-8 lg:px-20 py-40 flex flex-col items-center text-center gap-12 relative overflow-hidden bg-background">
          <div className="cta-content flex flex-col items-center gap-12 relative z-10">
            <h3 className="text-6xl lg:text-7xl font-display font-black text-on-surface uppercase tracking-tighter leading-none text-white">
              Connect to <br />
              Claude Now.
            </h3>
            <button onClick={() => router.push('/dashboard')} className="btn-primary group flex items-center gap-6 px-16 py-8 text-lg rounded-full shadow-[0_0_60px_rgba(255,105,26,0.3)] hover:scale-105 transition-all duration-300 ease-out active:scale-95 bg-primary">
              GET THE ALETHEIA PLUGIN
              <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>
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
