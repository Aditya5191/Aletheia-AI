"use client";

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, Shield, Cpu, Activity, Database, Lock, 
  FileSearch, Telescope, Waypoints, Network, Fingerprint, 
  CheckCircle2, AlertTriangle, Users, Scale, FileText, Terminal, 
  Search, Layers, Zap, Info, Binary, Brain, Microscope, FlaskConical,
  ChevronRight, List, LogIn, Settings, Code, FileJson, Sparkles,
  BarChart4, Eye, Crosshair, ClipboardCheck, Workflow
} from 'lucide-react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ReasoningSimulator } from '@/components/ReasoningSimulator';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const FaultyTerminal = dynamic(() => import('@/components/FaultyTerminal'), { ssr: false });
const BackgroundHalo = dynamic(() => import('@/components/BackgroundHalo').then(mod => mod.BackgroundHalo), { ssr: false });

export default function SciencePage() {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // ONLY animate the hero. The rest should be visible by default to avoid "empty" page bugs.
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

  const algoCategories = [
    {
      title: "Finding Hidden Bias",
      short: "Detection",
      icon: <Eye size={28} />,
      theme: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      desc: "Identifying systemic bias and proxy relationships through combinatorial and axiomatic methods.",
      algos: [
        { name: "Intersectional Scanner", desc: "Finds bias hiding at group intersections — like young women being harmed even when groups separately appear fine.", bestFor: "Multiple protected attributes" },
        { name: "Mutual Information Proxy Scanner", desc: "Detects indirect discrimination through features that carry demographic information without naming it.", bestFor: "Non-linear proxy relationships" },
        { name: "Distance Covariance Scanner", desc: "A more powerful proxy detector that catches complex U-shaped relationships that simple correlation misses entirely.", bestFor: "Small datasets under 5000 rows" },
        { name: "SHAP Proxy Detector", desc: "Uses game theory to calculate exactly how much each feature contributed to each decision.", bestFor: "Model auditing, feature attribution" }
      ]
    },
    {
      title: "Fixing the Bias",
      short: "Mitigation",
      icon: <Zap size={28} />,
      theme: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
      desc: "Surgical corrections for biased outcomes using pre-processing and post-inference calibration.",
      algos: [
        { name: "Disparate Impact Repair", desc: "Equalizes the distribution of outcomes across groups at the data level, before decisions are made.", bestFor: "When you have no ground truth labels" },
        { name: "Equal Opportunity Calibrator", desc: "Finds the right decision threshold per demographic group so equally qualified people get equal chances.", bestFor: "Hiring, lending, education" },
        { name: "Recidivism Fairness Calibrator", desc: "Handles the mathematically proven impossibility of simultaneously satisfying all fairness metrics when base rates differ.", bestFor: "High-stakes risk scoring" }
      ]
    },
    {
      title: "Understanding Why",
      short: "Causal",
      icon: <Workflow size={28} />,
      theme: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      desc: "Decomposing the paths of discrimination to understand root causes and direct effects.",
      algos: [
        { name: "Causal Fair Inference", desc: "Separates discrimination that flows directly from protected attributes versus discrimination that flows through proxy features.", bestFor: "Salary prediction, lending" },
        { name: "Counterfactual Fairness", desc: "Transforms features mathematically so that changing only someone's protected attribute would not change their predicted outcome.", bestFor: "Pre-processing before training" },
        { name: "Causal Explanation Formula", desc: "Decomposes the total discrimination gap into its direct, indirect, and spurious components.", bestFor: "Policy design, regulatory review" }
      ]
    },
    {
      title: "Advanced Structural",
      short: "Specialist",
      icon: <Layers size={28} />,
      theme: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      desc: "Handling feedback loops, relational complexity, and datasets without explicit labels.",
      algos: [
        { name: "Fairness Feedback Reparation", desc: "Tracks how bias compounds across model generations — detecting when repeated automated decisions erase minority groups.", bestFor: "Systems with feedback loops" },
        { name: "Fairness Without Demographics", desc: "Audits for bias even when demographic labels are unavailable by optimising for worst-case group performance.", bestFor: "Healthcare, privacy-first data" },
        { name: "Relational Domain Fairness", desc: "Detects discrimination patterns in networked data where decisions about one person affect outcomes for connected people.", bestFor: "Social network analysis" }
      ]
    }
  ];

  return (
    <div ref={container} className="flex-1 min-h-screen flex flex-col bg-background overflow-x-hidden relative text-on-surface">
      <BackgroundHalo />
      
      {/* Background Terminal Effect */}
      <div className="fixed inset-0 z-0 opacity-[0.04] pointer-events-none">
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
                className={`text-[11px] uppercase font-bold tracking-[0.2em] transition-colors relative group ${item.path === '/science' ? 'text-white' : 'text-on-surface-variant hover:text-white'}`}
              >
                {item.label}
                <span className={`absolute -bottom-2 left-0 h-0.5 bg-primary transition-all ${item.path === '/science' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
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
        
        {/* Science Hero */}
        <section className="px-8 lg:px-20 py-24 flex flex-col items-center text-center relative min-h-[50vh] justify-center">
          <div className="flex flex-col items-center gap-8 z-10 max-w-[1000px]">
            <span className="hero-badge text-[10px] text-primary uppercase tracking-[0.5em] font-label font-bold bg-background/40 backdrop-blur-sm px-8 py-2.5 rounded-full border border-primary/20 shadow-[0_0_30px_rgba(255,105,26,0.15)]">
              The Forensic Engine
            </span>
            <h2 className="text-5xl md:text-8xl font-display font-black text-on-surface uppercase tracking-tighter leading-[0.85] drop-shadow-2xl">
              <div className="hero-title-line overflow-hidden"><div className="hero-text-inner text-white">13 Algorithms.</div></div> 
              <div className="hero-title-line overflow-hidden pb-4">
                <div className="hero-text-inner text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-[#9b51e0]">One Autonomous Pipeline.</div>
              </div>
            </h2>
            <div className="grid md:grid-cols-2 gap-12 text-left max-w-[1100px] mx-auto mt-8">
              <div className="flex flex-col gap-6 p-8 bg-white/5 border border-white/5 rounded-3xl">
                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-on-surface-variant">The Legacy Problem</h3>
                <p className="text-lg text-on-surface-variant leading-relaxed font-sans">
                  Most fairness tools hardcode a single algorithm and apply it blindly to every dataset, regardless of the unique ethical or mathematical context.
                </p>
              </div>
              <div className="flex flex-col gap-6 p-8 bg-primary/10 border border-primary/20 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={48} /></div>
                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary">The Aletheia Protocol</h3>
                <div className="space-y-4">
                  {[
                    "Query custom MCP server for 13 peer-reviewed algorithms",
                    "Reason through data domain, structure, and label availability",
                    "Implement mathematical specs from first principles",
                    "Full audit trail for every autonomous decision"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 size={16} className="text-primary mt-1 shrink-0" />
                      <span className="text-sm font-bold text-white uppercase tracking-tight leading-tight">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Selection simulator */}
        <section className="px-8 lg:px-20 py-24 bg-background relative z-10">
          <div className="max-w-[1200px] mx-auto flex flex-col gap-12 text-center items-center mb-16">
            <span className="text-[10px] text-primary uppercase tracking-[0.5em] font-label font-bold">Live Reasoning Engine</span>
            <h3 className="text-4xl lg:text-5xl font-display font-black uppercase text-white tracking-tight">Agentic Selection Simulator</h3>
            <p className="text-on-surface-variant text-lg max-w-[700px]">Tell us your data constraints, and see Aletheia&apos;s reasoning engine identify the optimal scientific pipeline for your audit.</p>
          </div>
          <ReasoningSimulator />
        </section>

        {/* Algorithm Library - NO GSAP TRIGGER FOR FULL VISIBILITY */}
        <section className="px-8 lg:px-20 py-40 bg-background relative z-10">
          <div className="max-w-[1200px] mx-auto flex flex-col gap-32">
            
            <div className="flex flex-col gap-6 text-center items-center">
              <span className="text-[10px] text-primary uppercase tracking-[0.5em] font-label font-bold">Scientific Library</span>
              <h3 className="text-5xl lg:text-7xl font-display font-bold text-on-surface uppercase tracking-tight leading-none">
                The 13 Algorithms
              </h3>
            </div>

            <div className="flex flex-col gap-40">
              {algoCategories.map((cat, idx) => (
                <div key={idx} className="flex flex-col gap-12">
                  {/* Category Header */}
                  <div className="flex flex-col gap-4 border-l-4 border-primary pl-8 bg-white/[0.01] py-8 rounded-r-3xl">
                    <div className={`flex items-center gap-4 ${cat.theme}`}>
                       {cat.icon}
                       <span className="text-xs font-black uppercase tracking-[0.4em]">{cat.short}</span>
                    </div>
                    <h4 className="text-4xl lg:text-6xl font-display font-black text-white uppercase tracking-tight leading-none">{cat.title}</h4>
                    <p className="text-on-surface-variant font-sans text-lg md:text-xl opacity-90 max-w-[800px] leading-relaxed">{cat.desc}</p>
                  </div>

                  {/* Algos Grid - Static Visibility */}
                  <div className="grid md:grid-cols-2 gap-10">
                    {cat.algos.map((algo, i) => (
                      <div key={i} className={`p-10 ${cat.bg} border ${cat.border} rounded-[2.5rem] hover:bg-white/[0.05] transition-all group flex flex-col gap-8 relative overflow-hidden bg-[#0d0f14] shadow-2xl`}>
                        {/* Background Category Icon */}
                        <div className={`absolute -top-10 -right-10 p-20 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${cat.theme}`}>
                           {cat.icon}
                        </div>
                        
                        <div className="flex flex-col gap-6 z-10">
                          <h5 className="text-2xl md:text-4xl font-display font-black text-white uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">
                            {algo.name}
                          </h5>
                          <p className="text-base md:text-lg text-on-surface-variant leading-relaxed opacity-100 font-sans font-medium text-white/80">
                            {algo.desc}
                          </p>
                        </div>

                        <div className="mt-auto pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-6 z-10">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-white/30">Strategic Fit</span>
                            <div className="flex items-center gap-2">
                               <div className={`w-1.5 h-1.5 rounded-full ${cat.theme} animate-pulse`}></div>
                               <span className={`text-xs font-bold ${cat.theme} uppercase tracking-widest`}>{algo.bestFor}</span>
                            </div>
                          </div>
                          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-black group-hover:border-primary transition-all shadow-xl group-hover:shadow-primary/20">
                            <ArrowRight size={24} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* Verification Strip */}
        <div className="bg-primary/10 border-y border-primary/20 py-16 relative z-30">
          <div className="max-w-[1200px] mx-auto px-8 flex flex-col md:flex-row items-center justify-center gap-8 text-center">
            <Sparkles size={40} className="text-primary shrink-0 animate-pulse" />
            <p className="text-lg md:text-2xl uppercase font-black tracking-[0.3em] text-white leading-relaxed">
              Every selection is verifiable via <span className="text-primary">selection_log.json</span>
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <section className="px-8 lg:px-20 py-40 flex flex-col items-center text-center gap-12 relative overflow-hidden bg-background z-10">
          <div className="cta-content flex flex-col items-center gap-12 relative z-10">
            <h3 className="text-6xl lg:text-8xl font-display font-black text-on-surface uppercase tracking-tighter leading-none">
              Transparency <br />
              At Scale.
            </h3>
            <button onClick={() => router.push('/dashboard')} className="btn-primary group flex items-center gap-6 px-16 py-8 text-lg rounded-full shadow-[0_0_60px_rgba(255,105,26,0.3)] hover:scale-105 transition-all duration-300 ease-out active:scale-95 bg-primary">
              INITIALIZE YOUR FIRST AUDIT
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
              <span className="font-display font-bold uppercase tracking-widest text-sm">Aletheia</span>
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
