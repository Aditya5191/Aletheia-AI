"use client";

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, Shield, Cpu, Activity, BarChart3, Database, Lock, 
  FileSearch, Telescope, Waypoints, Network, Fingerprint, 
  CheckCircle2, AlertTriangle, Users, Scale, FileText, Terminal, 
  Search, Layers, Zap, Info, Binary, HelpCircle, ChevronDown, ChevronUp,
  Mail, ExternalLink
} from 'lucide-react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const FaultyTerminal = dynamic(() => import('@/components/FaultyTerminal'), { ssr: false });
const BackgroundHalo = dynamic(() => import('@/components/BackgroundHalo').then(mod => mod.BackgroundHalo), { ssr: false });

export default function AboutPage() {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.from('.hero-badge', { y: 30, opacity: 0, duration: 1, delay: 0.2 })
      .from('.hero-text-inner', { yPercent: 120, rotationZ: 2, duration: 1.2, stagger: 0.15 }, '-=0.8')
      .from('.hero-desc', { y: 30, opacity: 0, duration: 1 }, '-=0.8');
  }, { scope: container });

  const navItems = [
    { label: 'Science', path: '/science' },
    { label: 'Agent Plugin', path: '/claude-skill' },
    { label: 'Privacy', path: '/privacy' },
    { label: 'About and FAQ', path: '/about' },
  ];

  const faqs = [
    {
      q: "What models does Aletheia support?",
      a: "Aletheia supports sklearn-compatible binary classifiers and regressors saved as .pkl or .joblib. This includes popular libraries like RandomForest, XGBoost, LightGBM, CatBoost, and standard Scikit-Learn linear/logistic models, including those wrapped in Pipelines."
    },
    {
      q: "Does it work without the training data?",
      a: "Yes for the model audit. You only need a representative sample of 200+ rows. Ground truth labels are optional—while more metrics are available when provided, the core behavioral audit can run without them using synthetic counterfactuals."
    },
    {
      q: "What does 'no retraining required' mean?",
      a: "Aletheia addresses bias at the decision layer. For classifiers, we compute per-group decision thresholds that equalize fairness metrics. For regressors, we compute per-group output correction factors. Both are applied at inference time—your model file remains untouched."
    },
    {
      q: "Why can't it audit NLP or vision models?",
      a: "These models do not expose a standard tabular feature interface. Aletheia's pipeline is optimized for tabular feature matrices. NLP and vision bias detection require fundamentally different techniques like embedding analysis or latent space probing."
    },
    {
      q: "What is the mathematical impossibility mentioned?",
      a: "According to the Kleinberg impossibility theorem, when group base rates differ, it is mathematically impossible to simultaneously equalize False Positive Rate, True Positive Rate, and Positive Predictive Value. Aletheia detects this and helps you choose the most ethical tradeoff."
    },
    {
      q: "What compliance frameworks does it cover?",
      a: "Aletheia targets the EEOC 4/5ths rule for employment, EU AI Act Article 10 for high-risk AI, ISO 24027 for bias taxonomy, ECOA for credit decisions, and the Equal Pay Act for compensation models."
    },
    {
      q: "Is the data ever sent anywhere?",
      a: "No. All processing happens inside an isolated Docker container on your own infrastructure. Your model files, sample data, and audit outputs never leave your environment."
    }
  ];

  return (
    <div ref={container} className="flex-1 min-h-screen flex flex-col bg-background overflow-x-hidden relative text-on-surface">
      <BackgroundHalo />
      
      {/* Background Terminal Effect */}
      <div className="fixed inset-0 z-0 opacity-[0.05] pointer-events-none">
        <FaultyTerminal scale={1} digitSize={1.5} scanlineIntensity={0.2} glitchAmount={0.5} flickerAmount={0.5} noiseAmp={1} curvature={0.2} tint="#FF691A" brightness={1} dpr={1} />
      </div>

      {/* Navigation Header */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[1200px] z-50 px-8 py-4 flex items-center justify-between glass border border-white/5 rounded-full shadow-2xl">
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
                className={`text-[11px] uppercase font-bold tracking-[0.2em] transition-colors relative group ${item.path === '/about' ? 'text-white' : 'text-on-surface-variant hover:text-white'}`}
              >
                {item.label}
                <span className={`absolute -bottom-2 left-0 h-0.5 bg-primary transition-all ${item.path === '/about' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
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
        
        {/* About Hero */}
        <section className="px-8 lg:px-20 py-24 flex flex-col items-center text-center relative min-h-[50vh] justify-center">
          <div className="flex flex-col items-center gap-8 z-10 max-w-[900px]">
            <span className="hero-badge text-[10px] text-primary uppercase tracking-[0.5em] font-label font-bold bg-background/40 backdrop-blur-sm px-8 py-2.5 rounded-full border border-primary/20 shadow-[0_0_30px_rgba(255,105,26,0.15)]">
              Built for algorithmic fairness auditing
            </span>
            <h2 className="text-5xl md:text-7xl font-display font-black text-on-surface uppercase tracking-tighter leading-[0.9]">
              <div className="hero-title-line overflow-hidden"><div className="hero-text-inner">Ensuring Fairness</div></div> 
              <div className="hero-title-line overflow-hidden pb-4">
                <div className="hero-text-inner text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#9b51e0]">In Every Decision.</div>
              </div>
            </h2>
            <p className="hero-desc text-xl text-on-surface-variant leading-relaxed max-w-[800px] font-sans opacity-90">
              Aletheia is an advanced forensic framework developed by <span className="text-white font-bold">Team Technopaths</span> to detect and mitigate bias in automated decision systems.
            </p>
          </div>
        </section>

        {/* The Problem Statement */}
        <section className="px-8 lg:px-20 py-32 bg-surface-lowest/50 border-y border-white/5">
           <div className="max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-20 items-start">
             <div className="flex flex-col gap-8">
               <h3 className="text-3xl font-display font-black uppercase tracking-widest text-white">The Problem</h3>
               <p className="text-lg text-on-surface-variant leading-relaxed font-sans italic border-l-4 border-primary pl-8">
                 &quot;Unbiased AI Decision — Ensuring Fairness and Detecting Bias in Automated Decisions.&quot;
               </p>
               <p className="text-base text-on-surface-variant font-sans leading-relaxed">
                 As AI takes over high-stakes domains like hiring, lending, and healthcare, biased decisions are becoming a systemic legal and ethical risk. Most existing tools are either too simple (basic stats) or too complex (requiring deep expertise). Aletheia bridges this gap with autonomous, agentic auditing.
               </p>
             </div>
             <div className="flex flex-col gap-8">
               <h3 className="text-3xl font-display font-black uppercase tracking-widest text-white">The Difference</h3>
               <div className="border border-white/5 rounded-2xl overflow-hidden text-xs">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-white/5 text-on-surface-variant uppercase font-bold tracking-widest">
                       <th className="p-4 border-b border-white/10">Feature</th>
                       <th className="p-4 border-b border-white/10">Competitors</th>
                       <th className="p-4 border-b border-white/10 text-primary">Aletheia</th>
                     </tr>
                   </thead>
                   <tbody className="text-on-surface-variant font-sans">
                     <tr className="border-b border-white/5">
                       <td className="p-4 font-bold text-white">Algorithm Delivery</td>
                       <td className="p-4">Hardcoded Libraries</td>
                       <td className="p-4 text-primary font-bold">Dynamic MCP Skills</td>
                     </tr>
                     <tr className="border-b border-white/5">
                       <td className="p-4 font-bold text-white">Bias Mitigation</td>
                       <td className="p-4">Retraining Required</td>
                       <td className="p-4 text-primary font-bold">Drop-in Threshold Maps</td>
                     </tr>
                     <tr className="border-b border-white/5">
                       <td className="p-4 font-bold text-white">Intersectional Scan</td>
                       <td className="p-4">Manual / Limited</td>
                       <td className="p-4 text-primary font-bold">Autonomous Combinatorial</td>
                     </tr>
                     <tr>
                       <td className="p-4 font-bold text-white">Target Audience</td>
                       <td className="p-4">Data Scientists Only</td>
                       <td className="p-4 text-primary font-bold">Compliance + Eng Teams</td>
                     </tr>
                   </tbody>
                 </table>
               </div>
             </div>
           </div>
        </section>

        {/* Deep Dive into Modes */}
        <section className="px-8 lg:px-20 py-40 bg-background">
          <div className="max-w-[1200px] mx-auto flex flex-col gap-32">
             <div className="grid lg:grid-cols-2 gap-20 items-center">
                <div className="flex flex-col gap-6">
                  <span className="text-[10px] text-primary uppercase tracking-[0.5em] font-label font-bold">Mode 01</span>
                  <h3 className="text-5xl font-display font-black uppercase text-white">Dataset Mode</h3>
                  <p className="text-on-surface-variant leading-relaxed">
                    Used during the data preparation phase. Ingests raw CSV data and identifies inherent bias in features and historical outcomes. Produces a &quot;fixed&quot; version of your dataset using distribution alignment algorithms.
                  </p>
                  <div className="flex flex-wrap gap-4 mt-4">
                    <span className="px-4 py-2 bg-white/5 rounded-full border border-white/10 text-[10px] uppercase font-bold text-white">CSV Input</span>
                    <span className="px-4 py-2 bg-white/5 rounded-full border border-white/10 text-[10px] uppercase font-bold text-white">Pre-processing</span>
                    <span className="px-4 py-2 bg-white/5 rounded-full border border-white/10 text-[10px] uppercase font-bold text-white">DIR/SPD Algorithms</span>
                  </div>
                </div>
                <div className="aspect-video bg-[#0d0f14] border border-white/10 rounded-2xl p-8 flex items-center justify-center">
                   <Database size={100} className="text-primary/20" />
                </div>
             </div>

             <div className="grid lg:grid-cols-2 gap-20 items-center">
                <div className="aspect-video bg-[#0d0f14] border border-white/10 rounded-2xl p-8 flex items-center justify-center lg:order-1 order-2">
                   <Cpu size={100} className="text-[#9b51e0]/20" />
                </div>
                <div className="flex flex-col gap-6 lg:order-2 order-1">
                  <span className="text-[10px] text-[#9b51e0] uppercase tracking-[0.5em] font-label font-bold">Mode 02</span>
                  <h3 className="text-5xl font-display font-black uppercase text-white">Model Mode</h3>
                  <p className="text-on-surface-variant leading-relaxed">
                    Used for post-deployment verification. Ingests a saved model (.pkl) and a sample of inference data. Produces a threshold correction map that can be dropped into your existing inference service to equalize outcomes.
                  </p>
                  <div className="flex flex-wrap gap-4 mt-4">
                    <span className="px-4 py-2 bg-white/5 rounded-full border border-white/10 text-[10px] uppercase font-bold text-white">PKL/Joblib Input</span>
                    <span className="px-4 py-2 bg-white/5 rounded-full border border-white/10 text-[10px] uppercase font-bold text-white">Post-inference</span>
                    <span className="px-4 py-2 bg-white/5 rounded-full border border-white/10 text-[10px] uppercase font-bold text-white">EOD/FPR Algorithms</span>
                  </div>
                </div>
             </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="px-8 lg:px-20 py-40 border-t border-white/5 bg-[#050608]">
          <div className="max-w-[800px] mx-auto flex flex-col gap-24">
            <div className="text-center flex flex-col items-center gap-6">
              <HelpCircle size={40} className="text-primary" />
              <h3 className="text-5xl font-display font-black uppercase text-white tracking-tight">Frequently Asked</h3>
            </div>

            <div className="space-y-6">
               {faqs.map((faq, i) => (
                 <div key={i} className="border border-white/5 rounded-2xl bg-white/[0.02] p-8 hover:bg-white/[0.04] transition-colors">
                    <h4 className="text-lg font-display font-bold uppercase text-white mb-4 flex items-center gap-4">
                      <span className="text-primary">Q.</span> {faq.q}
                    </h4>
                    <p className="text-sm text-on-surface-variant font-sans leading-relaxed pl-8">
                      {faq.a}
                    </p>
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* Limitations - Explicit & Prominent */}
        <section className="px-8 lg:px-20 py-40 bg-background relative overflow-hidden">
           <div className="max-w-[1200px] mx-auto p-16 bg-red-500/5 border border-red-500/20 rounded-[3rem] flex flex-col gap-12 relative">
             <div className="absolute top-0 right-0 p-10 opacity-10">
               <AlertTriangle size={200} className="text-red-500" />
             </div>
             <div className="flex flex-col gap-6 relative z-10">
               <span className="text-xs text-red-500 uppercase tracking-[0.5em] font-label font-bold">Notice of Constraints</span>
               <h3 className="text-5xl lg:text-6xl font-display font-black uppercase text-white tracking-widest">Platform Limitations</h3>
             </div>
             <div className="grid md:grid-cols-2 gap-12 relative z-10">
               {[
                 "Supports binary and regression sklearn models only.",
                 "Requires minimum 200 rows of representative sample data.",
                 "Cannot audit NLP, Vision, Audio, or Multimodal models.",
                 "Cannot audit API-only models without model file access.",
                 "Calibration addresses decision layer only; not root cause.",
                 "Results are relative to the representativeness of provided sample."
               ].map((item, i) => (
                 <div key={i} className="flex gap-6 items-start">
                   <AlertTriangle size={24} className="text-red-500 shrink-0 mt-1" />
                   <p className="text-lg text-on-surface-variant font-sans leading-relaxed font-black uppercase tracking-wider">{item}</p>
                 </div>
               ))}
             </div>
           </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-8 lg:px-20 py-40 flex flex-col items-center text-center gap-12 relative overflow-hidden bg-background">
          <div className="cta-content flex flex-col items-center gap-12 relative z-10">
            <h3 className="text-6xl lg:text-7xl font-display font-black text-on-surface uppercase tracking-tighter leading-none">
              Transparency <br />
              by design.
            </h3>
            <button onClick={() => router.push('/dashboard')} className="btn-primary group flex items-center gap-6 px-16 py-8 text-lg rounded-full shadow-[0_0_60px_rgba(255,105,26,0.3)] hover:scale-105 transition-all duration-300 ease-out active:scale-95 bg-primary">
              INITIALIZE YOUR FIRST AUDIT
              <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>
      </main>

      {/* Reused Footer */}
      <footer className="px-8 py-20 border-t border-white/5 bg-[#050608] relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 max-w-[1200px] mx-auto">
          <div className="flex flex-col gap-3 items-center md:items-start">
            <div className="flex items-center gap-3 text-primary mb-2">
              <Shield size={16} />
              <span className="font-display font-bold uppercase tracking-widest text-sm">Aletheia</span>
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
