"use client";

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, Shield, Cpu, Activity, BarChart3, Database, Lock, 
  FileSearch, Telescope, Waypoints, Network, Fingerprint, 
  CheckCircle2, AlertTriangle, Users, Scale, FileText, Terminal, 
  Search, Layers, Zap, Info
} from 'lucide-react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { InfiniteMarquee } from '@/components/InfiniteMarquee';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const FaultyTerminal = dynamic(() => import('@/components/FaultyTerminal'), { ssr: false });
const BackgroundHalo = dynamic(() => import('@/components/BackgroundHalo').then(mod => mod.BackgroundHalo), { ssr: false });

export default function Landing() {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // 1. Hero Animation Timeline
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.from('.hero-badge', { y: 30, opacity: 0, duration: 1, delay: 0.2 })
      .from('.hero-text-inner', { yPercent: 120, rotationZ: 2, duration: 1.2, stagger: 0.15 }, '-=0.8')
      .from('.hero-desc', { y: 30, opacity: 0, duration: 1 }, '-=0.8')
      .from('.hero-buttons', { y: 30, opacity: 0, duration: 1 }, '-=0.8')
      .from('.hero-stats', { y: 20, opacity: 0, duration: 1 }, '-=0.8');

    // Floating background shapes
    gsap.to('.floating-shape-1', {
      y: -100,
      rotation: 15,
      scrollTrigger: {
        trigger: container.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1
      }
    });

    // 2. Metrics Section Parallax
    gsap.from('.metric-card', {
      scrollTrigger: {
        trigger: '.metrics-section',
        start: 'top 85%',
      },
      y: 60,
      opacity: 0,
      duration: 1,
      stagger: 0.15,
      ease: 'power3.out'
    });

    // 3. Core Capabilities Stagger
    gsap.from('.capability-card', {
      scrollTrigger: {
        trigger: '.capabilities-section',
        start: 'top 75%',
      },
      y: 80,
      opacity: 0,
      duration: 1,
      stagger: 0.1,
      ease: 'back.out(1.2)'
    });

    // 4. Pipeline Cards Reveal
    gsap.from('.pipeline-card', {
      scrollTrigger: {
        trigger: '.pipelines-section',
        start: 'top 70%',
      },
      x: (i) => i === 0 ? -100 : 100,
      opacity: 0,
      duration: 1.5,
      ease: 'power4.out',
      stagger: 0.2
    });

    // 5. Audience Cards Stagger
    gsap.from('.audience-card', {
      scrollTrigger: {
        trigger: '.audience-section',
        start: 'top 80%',
      },
      y: 50,
      opacity: 0,
      duration: 1,
      stagger: 0.1,
      ease: 'power2.out'
    });

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
      <div className="fixed inset-0 z-0 opacity-[0.12] pointer-events-none">
        <FaultyTerminal
          scale={1}
          digitSize={1.5}
          scanlineIntensity={0.3}
          glitchAmount={1}
          flickerAmount={1}
          noiseAmp={1}
          curvature={0.2}
          tint="#FF691A"
          mouseReact
          mouseStrength={0.15}
          brightness={1}
          dpr={1}
        />
      </div>

      {/* Navigation Header */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[1200px] z-50 px-8 py-4 flex items-center justify-between glass border border-white/5 rounded-full shadow-2xl">
        <div className="flex items-center gap-12">
          <h1 
            onClick={() => router.push('/')}
            className="text-xl font-display font-bold text-primary uppercase tracking-[0.3em] flex items-center gap-3 cursor-pointer"
          >
             <Shield size={20} />
             Aletheia
          </h1>
          <nav className="hidden md:flex gap-8">
            {navItems.map((item) => (
              <button 
                key={item.label} 
                onClick={() => router.push(item.path)}
                className="text-[11px] uppercase font-bold tracking-[0.2em] text-on-surface-variant hover:text-white transition-colors relative group"
              >
                {item.label}
                <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
              </button>
            ))}
          </nav>
        </div>
        <button 
          onClick={() => router.push('/dashboard')}
          className="btn-secondary group flex items-center gap-3 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:text-white border-white/10 rounded-full"
        >
          INITIALIZE AUDIT
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </header>

      <main className="flex-1 flex flex-col pt-32 relative z-10">
        
        {/* Hero Section */}
        <section className="px-8 lg:px-20 py-24 flex flex-col items-center text-center justify-center min-h-[90vh] relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="flex flex-col items-center gap-10 z-10 max-w-[1100px]">
            <div className="flex flex-col items-center gap-6">
              <span className="hero-badge text-[10px] text-primary uppercase tracking-[0.5em] font-label font-bold bg-background/40 backdrop-blur-sm px-8 py-2.5 rounded-full border border-primary/20 shadow-[0_0_30px_rgba(255,105,26,0.15)]">
                Autonomous Algorithmic Fairness Protocol
              </span>
              <h2 className="text-5xl md:text-7xl lg:text-[6.5rem] font-display font-black text-on-surface uppercase tracking-tighter leading-[0.9] drop-shadow-2xl">
                <div className="hero-title-line overflow-hidden"><div className="hero-text-inner">Your AI model is making</div></div> 
                <div className="hero-title-line overflow-hidden pb-4">
                  <div className="hero-text-inner text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-[#9b51e0]">Biased Decisions.</div>
                </div>
                <div className="hero-title-line overflow-hidden"><div className="hero-text-inner text-3xl md:text-5xl lg:text-6xl text-on-surface-variant font-extrabold">We prove it, measure it, and fix it — autonomously.</div></div>
              </h2>
            </div>
            
            <p className="hero-desc text-xl text-on-surface-variant leading-relaxed max-w-[700px] font-sans opacity-90 border-l-2 border-primary/30 pl-8 text-left">
              Aletheia deployes 13 scientific-grade detection algorithms to map, audit, and remediate bias in datasets and model outputs. Supporting both <span className="text-white font-bold">Dataset Audit</span> for pre-processing and <span className="text-white font-bold">Model Audit</span> for post-inference calibration.
            </p>

            <div className="hero-buttons flex flex-col sm:flex-row gap-5 mt-4">
              <button 
                onClick={() => router.push('/dashboard')}
                className="btn-primary group flex items-center justify-center gap-4 px-12 py-6 text-sm shadow-[0_0_50px_rgba(255,105,26,0.25)] rounded-full transition-all duration-300 ease-out hover:scale-105 active:scale-95 bg-primary"
              >
                START THE PIPELINE
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => router.push('/science')}
                className="flex items-center justify-center gap-3 text-[10px] uppercase font-bold tracking-[0.3em] text-on-surface-variant hover:text-on-surface px-12 border border-outline-variant/30 rounded-full py-6 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:scale-105 transition-all duration-300 ease-out active:scale-95"
              >
                EXPLORE THE SCIENCE
              </button>
            </div>

            <div className="hero-stats flex flex-wrap items-center gap-x-16 gap-y-8 mt-20 grayscale-0 brightness-100 border-t border-white/10 pt-12 w-full justify-center">
              {[
                { val: "13", label: "Algorithms" },
                { val: "02", label: "Audit Modes" },
                { val: "05", label: "Bias Layers" },
                { val: "04", label: "Frameworks" }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center gap-2 group">
                  <span className="text-4xl md:text-6xl font-display font-black text-primary drop-shadow-[0_0_15px_rgba(255,105,26,0.2)] group-hover:scale-105 transition-transform duration-300">{stat.val}</span>
                  <span className="text-[10px] md:text-xs uppercase tracking-[0.3em] font-mono text-on-surface-variant font-bold group-hover:text-primary transition-colors">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Infinite Marquee */}
        <InfiniteMarquee text="AUTONOMOUS BIAS DETECTION • MULTI-AGENT FAIRNESS AUDITING • CLINICAL DATA PROFILING • REGULATORY COMPLIANCE VERIFIED • PATH-SPECIFIC CAUSAL ANALYSIS" />

        {/* Pipelines Side by Side */}
        <section className="pipelines-section px-8 lg:px-20 py-40 bg-[#050608] relative">
          <div className="max-w-[1200px] mx-auto flex flex-col gap-24">
            <div className="flex flex-col gap-6 text-center items-center">
              <div className="flex items-center gap-4">
                <div className="h-[1px] w-16 bg-primary/30"></div>
                <span className="text-[10px] text-primary uppercase tracking-[0.5em] font-label font-bold">The Two Modes</span>
                <div className="h-[1px] w-16 bg-primary/30"></div>
              </div>
              <h3 className="text-5xl lg:text-7xl font-display font-bold text-on-surface uppercase tracking-tight">
                How it Works
              </h3>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Dataset Pipeline */}
              <div className="pipeline-card p-10 bg-[#0d0f14] border border-white/5 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 h-full bg-primary/50"></div>
                <div className="flex flex-col gap-8">
                  <div className="flex items-center justify-between">
                    <h4 className="text-3xl font-display font-black uppercase text-white">Dataset Pipeline</h4>
                    <Database className="text-primary" size={32} />
                  </div>
                  <div className="flex flex-col gap-6 relative">
                    {[
                      { icon: <Search size={18} />, label: "Upload CSV", desc: "Ingest tabular data" },
                      { icon: <Telescope size={18} />, label: "Data Surveyor", desc: "Autonomous EDA & Profiling" },
                      { icon: <Scale size={18} />, label: "Fairness Adjudicator", desc: "Statistical Bias Detection" },
                      { icon: <Zap size={18} />, label: "Bias Mitigator", desc: "Pre-processing Correction" },
                      { icon: <CheckCircle2 size={18} />, label: "PDF Report + Fixed CSV", desc: "Compliant Output" },
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-5 group/step">
                        <div className="w-10 h-10 shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover/step:bg-primary group-hover/step:text-black transition-all duration-300">
                          {step.icon}
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold uppercase tracking-widest text-white">{step.label}</span>
                          <span className="text-xs text-on-surface-variant">{step.desc}</span>
                        </div>
                        {i < 4 && <div className="absolute left-5 top-10 w-[1px] h-6 bg-white/10"></div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Model Pipeline */}
              <div className="pipeline-card p-10 bg-[#0d0f14] border border-white/5 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 h-full bg-[#9b51e0]/50"></div>
                <div className="flex flex-col gap-8">
                  <div className="flex items-center justify-between">
                    <h4 className="text-3xl font-display font-black uppercase text-white">Model Pipeline</h4>
                    <Cpu className="text-[#9b51e0]" size={32} />
                  </div>
                  <div className="flex flex-col gap-6 relative">
                    {[
                      { icon: <Layers size={18} />, label: "Upload PKL + Sample", desc: "Binary Classifier or Regressor" },
                      { icon: <Search size={18} />, label: "Model Inspector", desc: "Feature Importance & SHAP" },
                      { icon: <Activity size={18} />, label: "Behavioral Auditor", desc: "Subgroup Error Analysis" },
                      { icon: <Waypoints size={18} />, label: "Recalibrator", desc: "Threshold & Output Correction" },
                      { icon: <FileText size={18} />, label: "PDF Report + Map", desc: "Drop-in Correction Map" },
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-5 group/step">
                        <div className="w-10 h-10 shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#9b51e0] group-hover/step:bg-[#9b51e0] group-hover/step:text-white transition-all duration-300">
                          {step.icon}
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold uppercase tracking-widest text-white">{step.label}</span>
                          <span className="text-xs text-on-surface-variant">{step.desc}</span>
                        </div>
                        {i < 4 && <div className="absolute left-5 top-10 w-[1px] h-6 bg-white/10"></div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What We Actually Detect */}
        <section className="px-8 lg:px-20 py-40 border-t border-white/[0.03] bg-background relative overflow-hidden">
          <div className="max-w-[1200px] mx-auto flex flex-col gap-24">
            <div className="flex flex-col gap-6 text-center items-center">
              <div className="flex items-center gap-4">
                <div className="h-[1px] w-16 bg-primary/30"></div>
                <span className="text-[10px] text-primary uppercase tracking-[0.5em] font-label font-bold">Detection Layers</span>
                <div className="h-[1px] w-16 bg-primary/30"></div>
              </div>
              <h3 className="text-5xl lg:text-7xl font-display font-bold text-on-surface uppercase tracking-tight leading-none">
                What We Actually Detect
              </h3>
            </div>

            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { title: "Direct Discrimination", desc: "Identified via counterfactual probing — would the decision change if only the protected attribute changed?", icon: <Search /> },
                { title: "Proxy Discrimination", desc: "Detecting covert proxies using SHAP attribution + Pearson r correlation analysis.", icon: <Network /> },
                { title: "Disparate Impact", desc: "Measuring selection rate gaps via DIR (Disparate Impact Ratio) and SPD.", icon: <Scale /> },
                { title: "Unequal Error Rates", desc: "Exposing bias in FPR (False Positives) and EOD (Equalized Odds Difference).", icon: <AlertTriangle /> },
                { title: "Intersectional Bias", desc: "Combinatorial scanning for gerrymandering across Race × Gender × Age intersections.", icon: <Layers /> },
              ].map((card, i) => (
                <div key={i} className="capability-card p-8 bg-[#0d0f14] border border-white/5 rounded-2xl flex flex-col gap-6 hover:border-primary/40 transition-colors">
                  <div className="text-primary">{card.icon}</div>
                  <div className="flex flex-col gap-3">
                    <h5 className="text-sm font-black uppercase tracking-widest text-white leading-tight">{card.title}</h5>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed font-sans">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What You Get */}
        <section className="px-8 lg:px-20 py-40 bg-surface-lowest relative">
          <div className="max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-20 items-center">
            <div className="flex flex-col gap-10">
              <div className="flex flex-col gap-6">
                <span className="text-[10px] text-primary uppercase tracking-[0.5em] font-label font-bold">The Deliverables</span>
                <h3 className="text-5xl lg:text-7xl font-display font-bold text-on-surface uppercase tracking-tight leading-none">
                  Publication Ready <br /><span className="text-on-surface-variant">Audit Artifacts</span>
                </h3>
                </div>
                <p className="text-lg text-on-surface-variant font-sans leading-relaxed">
                Aletheia doesn&apos;t just show you charts. It produces the forensic evidence and drop-in fixes required for legal and engineering compliance.
                </p>
              <div className="grid sm:grid-cols-2 gap-8">
                {[
                  "Publication-ready PDF report",
                  "Compliance Verdict (EEOC/EU AI Act)",
                  "Post-Inference Correction Map",
                  "Fixed Dataset (Pre-processing)",
                  "Plain English Findings",
                  "Traceable Reasoning Logs"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-primary shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-widest text-white/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative group perspective-1000">
              <div className="absolute inset-0 bg-white/5 blur-[100px] transition-all duration-700"></div>
              {/* PDF Container */}
              <div className="relative bg-[#fdfdfc] text-[#1a1a1a] rounded-sm p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500 group-hover:-translate-y-2 border border-black/10 font-[family-name:var(--font-lora)]">
                
                {/* Academic Header */}
                <div className="flex flex-col items-center text-center border-b-2 border-black pb-6 mb-6">
                  <span className="text-[9px] uppercase tracking-[0.2em] font-sans font-bold text-black/50 mb-2">Technical Report Series · Vol 42</span>
                  <h4 className="text-2xl font-bold leading-tight text-black">Aletheia Protocol:<br/>Algorithmic Fairness Audit</h4>
                  <p className="text-[10px] italic mt-3 text-black/70">Generated autonomously via multi-agent adjudication</p>
                </div>

                <div className="flex flex-col gap-6 relative z-10">
                   {/* Abstract */}
                   <div>
                     <h5 className="text-[10px] font-sans font-bold uppercase tracking-widest text-black mb-2 border-b border-black/20 pb-1 inline-block">Executive Summary</h5>
                     <div className="text-[10px] text-justify leading-relaxed font-sans text-black/80 space-y-2">
                       <p>Analysis of 1,024,491 inference records completed.</p>
                       <p>Base rate disparity detected in Protected Attribute: Gender (DI = 0.72). Applied iterative reweighing (kamiran_calders_2012) to correct disparate impact.</p>
                       <p>Post-mitigation DI improved to 0.95. EEOC 4/5ths rule satisfied. Model artifacts compiled and cryptographically signed.</p>
                     </div>
                   </div>

                   {/* LaTeX Style Table */}
                   <div className="mt-2 text-[10px]">
                     <h5 className="text-[10px] font-sans font-bold uppercase tracking-widest text-black mb-3">Table 1. Disparate Impact (DI) Analysis</h5>
                     <div className="w-full border-t-[1.5px] border-b-[1.5px] border-black py-1">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-black/30">
                              <th className="font-serif font-bold py-1.5 w-1/2">Protected Class</th>
                              <th className="font-serif font-bold py-1.5 text-right w-1/4">Pre-DI</th>
                              <th className="font-serif font-bold py-1.5 text-right w-1/4">Post-DI</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="py-1">Gender (Female)</td>
                              <td className="py-1 text-right text-red-600">0.72</td>
                              <td className="py-1 text-right font-bold">0.95</td>
                            </tr>
                            <tr>
                              <td className="py-1">Age (&lt;25)</td>
                              <td className="py-1 text-right text-red-600">0.68</td>
                              <td className="py-1 text-right font-bold">0.88</td>
                            </tr>
                            <tr>
                              <td className="py-1">Race (Non-White)</td>
                              <td className="py-1 text-right">0.85</td>
                              <td className="py-1 text-right font-bold">0.91</td>
                            </tr>
                          </tbody>
                        </table>
                     </div>
                     <p className="text-[8px] italic mt-2 text-black/60">* Values &lt; 0.80 indicate potential disparate impact violation.</p>
                   </div>

                   {/* Math Equation Mock */}
                   <div className="py-3 px-4 bg-black/5 rounded-sm flex items-center justify-center border border-black/10">
                      <div className="font-[family-name:var(--font-lora)] text-[11px] text-center w-full flex items-center justify-center gap-2">
                        <span><span className="italic">DI</span> = </span>
                        <div className="flex flex-col items-center justify-center mx-1">
                          <span className="border-b border-black/80 px-2 pb-[1px]">Pr(<span className="italic">Y</span>=1 | <span className="italic">D</span>=unprivileged)</span>
                          <span className="pt-[1px] px-2">Pr(<span className="italic">Y</span>=1 | <span className="italic">D</span>=privileged)</span>
                        </div>
                        <span>&ge; 0.8</span>
                      </div>
                   </div>
                </div>

                {/* Academic Stamp */}
                <div className="absolute -bottom-6 -right-6 w-32 h-32 border-4 border-red-700/80 rounded-full flex items-center justify-center opacity-80 transform -rotate-12 pointer-events-none z-0">
                  <div className="w-28 h-28 border border-red-700/50 rounded-full flex items-center justify-center">
                     <div className="text-center">
                       <span className="block text-[8px] font-sans font-black text-red-700 tracking-[0.2em] uppercase">Audit</span>
                       <span className="block text-xl font-serif font-black text-red-700 leading-none">PASSED</span>
                       <span className="block text-[6px] font-mono text-red-700 mt-1">ISO/IEC 42001</span>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Who it is for */}
        <section className="audience-section px-8 lg:px-20 py-40 bg-background relative">
          <div className="max-w-[1200px] mx-auto flex flex-col gap-24">
            <div className="flex flex-col gap-6 text-center items-center">
              <span className="text-[10px] text-primary uppercase tracking-[0.5em] font-label font-bold">User Personas</span>
              <h3 className="text-5xl lg:text-7xl font-display font-bold text-on-surface uppercase tracking-tight">Who it is For</h3>
            </div>

            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[
                { title: "Enterprises", desc: "Using AI for hiring, lending, or healthcare diagnostics.", icon: <Network /> },
                { title: "Compliance", desc: "Legal teams ensuring adherence to EEOC and EU AI Act.", icon: <Shield /> },
                { title: "ML Engineers", desc: "Teams needing drop-in bias fixes without retraining.", icon: <Cpu /> },
                { title: "Regulators", desc: "Government bodies auditing automated decision systems.", icon: <Scale /> },
                { title: "Startups", desc: "Fast-moving teams without in-house fairness expertise.", icon: <Zap /> },
              ].map((audience, i) => (
                <div key={i} className="audience-card p-8 bg-[#0d0f14] border border-white/5 rounded-3xl flex flex-col gap-6 group hover:bg-white/[0.02] transition-colors text-center items-center">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                    {audience.icon}
                  </div>
                  <div className="flex flex-col gap-3">
                    <h5 className="text-sm font-black uppercase tracking-widest text-white">{audience.title}</h5>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed font-sans">{audience.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Honest Limitations Strip */}
        <div className="bg-red-500/10 border-y border-red-500/20 py-6 relative z-10">
          <div className="max-w-[1200px] mx-auto px-8 flex flex-col md:flex-row items-center justify-center gap-4 text-center">
            <AlertTriangle size={18} className="text-red-500 shrink-0" />
            <p className="text-[11px] md:text-xs uppercase font-bold tracking-[0.2em] text-red-500/80 leading-relaxed">
              Platform Limitations: Supports sklearn-compatible binary classifiers & regressors only. Requires representative sample data. Cannot audit NLP, Vision, or Multimodal models.
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <section className="cta-section px-8 lg:px-20 py-40 flex flex-col items-center text-center gap-12 relative overflow-hidden bg-background">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] pointer-events-none"></div>
          
          <div className="cta-content flex flex-col items-center gap-12 relative z-10">
            <div className="flex flex-col gap-6">
              <span className="text-[12px] text-primary uppercase tracking-[1em] font-label font-bold">Initialize Audit</span>
              <h3 className="text-7xl lg:text-8xl font-display font-black text-on-surface uppercase tracking-tighter leading-none">
                Audit Now. <br />
                Trust Forever.
              </h3>
            </div>
            <button 
              onClick={() => router.push('/dashboard')}
              className="btn-primary group flex items-center gap-6 px-16 py-8 text-lg rounded-full shadow-[0_0_60px_rgba(255,105,26,0.3)] hover:scale-105 transition-all duration-300 ease-out active:scale-95 bg-primary"
            >
              INITIALIZE YOUR FIRST AUDIT
              <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>
      </main>

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
              <button 
                key={item.label} 
                onClick={() => router.push(item.path)}
                className="text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-white transition-colors font-bold"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
