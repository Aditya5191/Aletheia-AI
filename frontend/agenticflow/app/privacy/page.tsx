"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, Lock, Database, Cpu, ArrowRight, CheckCircle2, 
  Server, Globe, CloudOff, Info, Search, ShieldAlert,
  Zap, Brain, Network, Terminal, Container, Trash2,
  LockIcon, EyeOff, FileText, Share2, Radio
} from 'lucide-react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const FaultyTerminal = dynamic(() => import('@/components/FaultyTerminal'), { ssr: false });
const BackgroundHalo = dynamic(() => import('@/components/BackgroundHalo').then(mod => mod.BackgroundHalo), { ssr: false });

const DataSovereigntyVisualizer = () => {
  const [activeStep, setStep] = useState(0);

  const steps = [
    { 
      id: 'ingest',
      title: "Local Ingestion", 
      desc: "Files are copied into a local Docker container. No data leaves your machine.",
      icon: <Database size={24} />,
      status: "Local Environment"
    },
    { 
      id: 'process',
      title: "Agent Execution", 
      desc: "Four agents run inside the isolated sandbox, auditing your model and data.",
      icon: <Brain size={24} />,
      status: "Isolated Sandbox"
    },
    { 
      id: 'mcp',
      title: "Knowledge Injection", 
      desc: "Only Algorithm IDs are sent to MCP. In return, mathematical specs are received.",
      icon: <Radio size={24} />,
      status: "Secure Spec Exchange"
    },
    { 
      id: 'destroy',
      title: "Self-Destruction", 
      desc: "The container is wiped and destroyed. All temporary files are permanently erased.",
      icon: <Trash2 size={24} />,
      status: "Zero Persistence"
    }
  ];

  return (
    <div className="w-full max-w-[1200px] mx-auto bg-[#0d0f14] border border-white/5 rounded-[3rem] p-10 lg:p-20 relative overflow-hidden shadow-2xl">
       <div className="absolute top-0 right-0 p-20 opacity-[0.03] pointer-events-none">
          <Shield size={300} className="text-primary" />
       </div>

       <div className="flex flex-col gap-16 relative z-10">
          <div className="flex flex-col gap-4 text-center items-center">
             <span className="text-[10px] text-primary uppercase tracking-[0.5em] font-label font-bold">Privacy Flow Architecture</span>
             <h3 className="text-4xl lg:text-5xl font-display font-black uppercase text-white tracking-tight">The Isolation Lifecycle</h3>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-center">
             {/* Interaction Rail */}
             <div className="lg:col-span-5 flex flex-col gap-4">
                {steps.map((step, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={`flex items-start gap-6 p-6 rounded-2xl border transition-all text-left group ${activeStep === i ? 'bg-primary/10 border-primary/30 shadow-lg shadow-primary/5' : 'bg-white/5 border-white/5 opacity-60 hover:bg-white/[0.08] hover:opacity-100'}`}
                  >
                    <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center transition-colors ${activeStep === i ? 'bg-primary text-black' : 'bg-white/10 text-on-surface-variant group-hover:text-primary'}`}>
                       {step.icon}
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-xs font-black uppercase tracking-widest text-white">{step.title}</span>
                       <span className="text-[11px] text-on-surface-variant leading-relaxed font-sans">{step.desc}</span>
                    </div>
                  </button>
                ))}
             </div>

             {/* Visual Stage */}
             <div className="lg:col-span-7 aspect-square lg:aspect-video bg-black/40 rounded-[2rem] border border-white/5 relative flex items-center justify-center overflow-hidden">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                
                {/* The "Machine" */}
                <div className="relative z-10 w-full h-full p-12 flex items-center justify-center">
                   
                   {/* Step 0: Ingest */}
                   {activeStep === 0 && (
                     <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in-95 duration-500">
                        <div className="flex gap-4">
                           <FileText size={48} className="text-white/20" />
                           <ArrowRight size={48} className="text-primary animate-pulse" />
                           <div className="w-24 h-24 rounded-2xl bg-primary/10 border-2 border-primary border-dashed flex items-center justify-center">
                              <Container size={40} className="text-primary" />
                           </div>
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">Inbound Data &rarr; Local Container</span>
                     </div>
                   )}

                   {/* Step 1: Process */}
                   {activeStep === 1 && (
                     <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-48 h-48 rounded-full border border-primary/20 flex items-center justify-center relative">
                           <div className="absolute inset-0 border-2 border-primary border-dashed rounded-full animate-spin-slow"></div>
                           <Brain size={64} className="text-primary animate-pulse" />
                           {/* Agent Orbits */}
                           {[0, 90, 180, 270].map(deg => (
                             <div key={deg} className="absolute w-8 h-8 rounded-lg bg-[#0d0f14] border border-white/20 flex items-center justify-center text-white/40" style={{ transform: `rotate(${deg}deg) translateX(80px) rotate(-${deg}deg)` }}>
                               <Cpu size={16} />
                             </div>
                           ))}
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">4 Autonomous Agents Working Locally</span>
                     </div>
                   )}

                   {/* Step 2: MCP */}
                   {activeStep === 2 && (
                     <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in-95 duration-500 w-full px-12">
                        <div className="flex justify-between items-center w-full">
                           <div className="flex flex-col items-center gap-3">
                              <Container size={40} className="text-primary" />
                              <span className="text-[8px] font-mono uppercase text-white/40 tracking-widest">Local Sandbox</span>
                           </div>
                           
                           <div className="flex-1 flex flex-col gap-4 relative">
                              {/* Top Arrow: ID Out */}
                              <div className="flex items-center justify-center gap-2">
                                 <div className="h-[1px] flex-1 bg-gradient-to-r from-primary to-transparent"></div>
                                 <span className="text-[8px] font-mono text-primary uppercase">req: algo_id_04</span>
                                 <div className="h-[1px] flex-1 bg-gradient-to-l from-primary to-transparent"></div>
                              </div>
                              {/* Bottom Arrow: Spec In */}
                              <div className="flex items-center justify-center gap-2">
                                 <div className="h-[1px] flex-1 bg-gradient-to-r from-blue-400 to-transparent"></div>
                                 <span className="text-[8px] font-mono text-blue-400 uppercase">res: math_spec.md</span>
                                 <div className="h-[1px] flex-1 bg-gradient-to-l from-blue-400 to-transparent"></div>
                              </div>
                           </div>

                           <div className="flex flex-col items-center gap-3">
                              <Server size={40} className="text-white/20" />
                              <span className="text-[8px] font-mono uppercase text-white/40 tracking-widest">Auditor MCP</span>
                           </div>
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">Zero User Data Touches External Servers</span>
                     </div>
                   )}

                   {/* Step 3: Destroy */}
                   {activeStep === 3 && (
                     <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in-95 duration-500">
                        <div className="relative">
                           <div className="w-24 h-24 rounded-2xl bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center">
                              <Trash2 size={40} className="text-red-500" />
                           </div>
                           {/* Particles/Dust effect */}
                           <div className="absolute inset-0 bg-red-500/20 blur-2xl animate-pulse"></div>
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-red-500/60">Sandbox Destroyed. Evidence Persists locally.</span>
                     </div>
                   )}

                </div>

                {/* Bottom Status Bar */}
                <div className="absolute bottom-0 left-0 w-full p-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">Status: {steps[activeStep].status}</span>
                   </div>
                   <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Aletheia Secure Architecture v4.0</span>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default function PrivacyPage() {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.from('.hero-badge', { y: 30, opacity: 0, duration: 1, delay: 0.2 })
      .from('.hero-title-line .hero-text-inner', { yPercent: 120, duration: 1.2, stagger: 0.15 }, '-=0.8')
      .from('.hero-desc', { y: 30, opacity: 0, duration: 1 }, '-=0.8');
  }, { scope: container });

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
      <div className="fixed inset-0 z-0 opacity-[0.05] pointer-events-none">
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
                className={`text-[11px] uppercase font-bold tracking-[0.2em] transition-colors relative group ${item.path === '/privacy' ? 'text-white' : 'text-on-surface-variant hover:text-white'}`}
              >
                {item.label}
                <span className={`absolute -bottom-2 left-0 h-0.5 bg-primary transition-all ${item.path === '/privacy' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </button>
            ))}
          </nav>
        </div>
        <button onClick={() => router.push('/dashboard')} className="btn-secondary group flex items-center gap-3 bg-white/5 backdrop-blur-md border-white/10 rounded-full uppercase tracking-widest text-[10px]">
          Initialize Audit
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </header>

      <main className="flex-1 flex flex-col pt-32 relative z-20">
        
        {/* Privacy Hero */}
        <section className="px-8 lg:px-20 py-24 flex flex-col items-center text-center relative min-h-[50vh] justify-center">
          <div className="flex flex-col items-center gap-8 z-10 max-w-[1000px]">
            <span className="hero-badge text-[10px] text-primary uppercase tracking-[0.5em] font-label font-bold bg-background/40 backdrop-blur-sm px-8 py-2.5 rounded-full border border-primary/20 shadow-[0_0_30px_rgba(255,105,26,0.15)]">
              Data Sovereignty Protocol
            </span>
            <h2 className="text-5xl md:text-8xl font-display font-black text-on-surface uppercase tracking-tighter leading-[0.85] drop-shadow-2xl">
              <div className="hero-title-line overflow-hidden"><div className="hero-text-inner text-white text-3xl md:text-6xl lg:text-7xl">Your Data Never Reaches Us.</div></div> 
              <div className="hero-title-line overflow-hidden pb-4">
                <div className="hero-text-inner text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-[#9b51e0]">By Architecture.</div>
              </div>
            </h2>
            <p className="hero-desc text-lg md:text-xl text-on-surface-variant leading-relaxed max-w-[850px] font-sans opacity-90 border-l-2 border-primary/30 pl-8 text-left">
              Aletheia is built on a &quot;local-first&quot; security model. Unlike traditional SaaS tools that ingest your dataset into their cloud, Aletheia creates an isolated, ephemeral sandbox on your infrastructure. Your files stay with you; our mathematical expertise comes to you.
            </p>
          </div>
        </section>

        {/* Interactive Visualizer */}
        <section className="px-8 lg:px-20 py-24 bg-background relative z-10">
           <DataSovereigntyVisualizer />
        </section>

        {/* Technical Deep Dive */}
        <section className="px-8 lg:px-20 py-40 bg-[#050608] border-y border-white/5">
           <div className="max-w-[1200px] mx-auto flex flex-col gap-24">
              <div className="grid lg:grid-cols-2 gap-20">
                 <div className="flex flex-col gap-8">
                    <h3 className="text-3xl font-display font-black uppercase text-white tracking-widest">The Local Isolation Protocol</h3>
                    <div className="space-y-6">
                       {[
                         { title: "Isolated Containerization", desc: "Your files are copied into an isolated Docker container running on your machine or server. Nothing is sent to our servers." },
                         { title: "Sandbox Execution", desc: "All four AI agents run inside this container. Your dataset, model file, and sample data never leave the Docker boundary." },
                         { title: "Total Erasure", desc: "When the audit completes, the container stops and is destroyed. All internal data is wiped. Only your local output folder persists." },
                         { title: "Skill-Based Guaranteed", desc: "If using the Claude Code skill, the same guarantee applies. Processing happens locally; we provide the knowledge, you provide the infrastructure." }
                       ].map((item, i) => (
                         <div key={i} className="flex gap-6">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"></div>
                            <div className="flex flex-col gap-1">
                               <span className="text-sm font-black uppercase text-white tracking-widest">{item.title}</span>
                               <span className="text-sm text-on-surface-variant leading-relaxed font-sans">{item.desc}</span>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="flex flex-col gap-12">
                    <div className="p-8 bg-white/5 border border-white/10 rounded-3xl flex flex-col gap-6 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Network size={48} className="text-primary" /></div>
                       <h4 className="text-xl font-display font-black uppercase text-white">What the MCP Server receives</h4>
                       <p className="text-sm text-on-surface-variant leading-relaxed font-sans">
                         When an agent queries the MCP server, it sends only a specific **Algorithm ID**. In return, it receives a **Mathematical Specification Document**. 
                       </p>
                       <div className="bg-black/60 p-4 rounded-xl border border-red-500/20 flex items-center gap-4">
                          <EyeOff size={20} className="text-red-500 shrink-0" />
                          <span className="text-[10px] font-mono uppercase text-red-400 font-bold tracking-widest">Your data, model, and predictions NEVER touch the MCP server.</span>
                       </div>
                    </div>

                    <div className="p-8 bg-primary/5 border border-primary/20 rounded-3xl flex flex-col gap-6 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><CloudOff size={48} className="text-primary" /></div>
                       <h4 className="text-xl font-display font-black uppercase text-white">For Maximum Sovereignty</h4>
                       <p className="text-sm text-on-surface-variant leading-relaxed font-sans">
                         If you need complete air-gap isolation, you can **Self-Host the MCP server**. The full server code is open-source. Run it locally and the entire pipeline operates with **Zero External Network Calls**.
                       </p>
                       <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary hover:text-white transition-colors">
                          View self-hosting docs <ArrowRight size={14} />
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* Compliance Section */}
        <section className="px-8 lg:px-20 py-40 bg-background">
           <div className="max-w-[1000px] mx-auto p-12 bg-white/[0.02] border border-white/5 rounded-[3rem] flex flex-col md:flex-row items-center gap-12">
              <div className="w-24 h-24 shrink-0 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shadow-2xl shadow-blue-500/10">
                 <ShieldCheckIcon size={48} />
              </div>
              <div className="flex flex-col gap-4 text-center md:text-left">
                 <h3 className="text-3xl font-display font-black uppercase text-white tracking-widest">GDPR-Compatible By Design</h3>
                 <p className="text-sm text-on-surface-variant leading-relaxed font-sans font-medium">
                   Aletheia&apos;s architecture is natively compliant with the highest global privacy standards. No personal data is processed on external servers. No data retention. No persistent logs of your data on our side. You maintain 100% control over your data lifecycle.
                 </p>
              </div>
           </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-8 lg:px-20 py-40 flex flex-col items-center text-center gap-12 relative overflow-hidden bg-background">
          <div className="cta-content flex flex-col items-center gap-12 relative z-10">
            <h3 className="text-6xl lg:text-7xl font-display font-black text-on-surface uppercase tracking-tighter leading-none text-white">
              Private Audits. <br />
              Public Trust.
            </h3>
            <button onClick={() => router.push('/dashboard')} className="btn-primary group flex items-center gap-6 px-16 py-8 text-lg rounded-full shadow-[0_0_60px_rgba(255,105,26,0.3)] hover:scale-105 transition-all duration-300 ease-out active:scale-95 bg-primary">
              START YOUR SECURE AUDIT
              <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>
      </main>

      <footer className="px-8 py-20 border-t border-white/5 bg-[#050608] relative z-40">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 max-w-[1200px] mx-auto">
          <div className="flex flex-col gap-3 items-center md:items-start">
            <div className="flex items-center gap-3 text-primary mb-2">
              <Shield size={16} />
              <span className="font-display font-bold uppercase tracking-widest text-sm text-white">Aletheia</span>
            </div>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">© 2026 Aletheia Forensic AI Systems</span>
            <span className="text-[8px] text-on-surface-variant/40 uppercase tracking-[0.4em]">Team Technopaths</span>
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

const ShieldCheckIcon = ({ size, className }: { size?: number; className?: string }) => (
  <svg 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
  </svg>
);
