"use client";

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Shield, Cpu, Activity, BarChart3, Database, Lock, FileSearch, Telescope, Waypoints, Network, Fingerprint } from 'lucide-react';
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
    // 1. Hero Animation Timeline (Split-text style reveal)
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

    gsap.to('.floating-shape-2', {
      y: -200,
      rotation: -15,
      scrollTrigger: {
        trigger: container.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.5
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

    // 4. How it Works Pipeline Draw Effect
    gsap.fromTo('.pipeline-fill-line', 
      { height: '0%' },
      {
        height: '100%',
        ease: 'none',
        scrollTrigger: {
          trigger: '.pipeline-container',
          start: 'top 50%',
          end: 'bottom 50%',
          scrub: true,
        }
      }
    );

    const pipelineItems = gsap.utils.toArray('.pipeline-item');
    pipelineItems.forEach((item: any, i) => {
      // Slide content in
      gsap.from(item, {
        scrollTrigger: {
          trigger: item,
          start: 'top 85%',
        },
        x: i % 2 === 0 ? -80 : 80,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out'
      });

      // Icon glow trigger when the line hits it
      const icon = item.querySelector('.pipeline-icon');
      if (icon) {
        gsap.to(icon, {
          scrollTrigger: {
            trigger: item,
            start: 'center 50%',
            toggleActions: 'play reverse play reverse'
          },
          backgroundColor: 'rgba(80,220,192,0.15)',
          borderColor: 'rgba(80,220,192,0.8)',
          boxShadow: '0 0 50px rgba(80,220,192,0.4)',
          scale: 1.15,
          color: '#ffffff',
          duration: 0.4
        });
      }
    });

    // 5. CTA Section
    gsap.from('.cta-content', {
      scrollTrigger: {
        trigger: '.cta-section',
        start: 'top 80%',
      },
      scale: 0.85,
      y: 50,
      opacity: 0,
      duration: 1.2,
      ease: 'back.out(1.5)'
    });

  }, { scope: container });

  return (
    <div ref={container} className="flex-1 min-h-screen flex flex-col bg-background overflow-x-hidden relative">
      <BackgroundHalo />
      
      {/* Background Terminal Effect */}
      <div className="fixed inset-0 z-0 opacity-[0.15] pointer-events-none">
        <FaultyTerminal
          scale={1}
          digitSize={1.5}
          scanlineIntensity={0.3}
          glitchAmount={1}
          flickerAmount={1}
          noiseAmp={1}
          chromaticAberration={0}
          dither={0}
          curvature={0.2}
          tint="#42b3ad"
          mouseReact
          mouseStrength={0.2}
          brightness={1}
          dpr={1}
        />
      </div>

      {/* Floating Parallax Shapes */}
      <div className="floating-shape-1 absolute top-[20%] right-[10%] w-64 h-64 border border-primary/10 rounded-full opacity-30 blur-[2px] pointer-events-none"></div>
      <div className="floating-shape-2 absolute top-[60%] left-[5%] w-96 h-96 border border-white/5 rounded-3xl rotate-12 opacity-20 blur-[4px] pointer-events-none"></div>

      {/* Navigation Header */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[1200px] z-50 px-8 py-4 flex items-center justify-between glass border border-white/5 rounded-full shadow-2xl">
        <div className="flex items-center gap-12">
          <h1 className="text-xl font-display font-bold text-primary uppercase tracking-[0.3em] flex items-center gap-3">
             <Shield size={20} />
             Aletheia
          </h1>
          <nav className="hidden md:flex gap-8">
            {['Platform', 'Solutions', 'Scientific Basis', 'Compliance'].map((item) => (
              <button key={item} className="text-[11px] uppercase font-bold tracking-[0.2em] text-on-surface-variant hover:text-white transition-colors relative group">
                {item}
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
        <section className="px-8 lg:px-20 py-24 flex flex-col items-center text-center justify-center min-h-[85vh] relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="flex flex-col items-center gap-10 z-10 max-w-[900px]">
            <div className="flex flex-col items-center gap-4">
              <span className="hero-badge text-[10px] text-primary uppercase tracking-[0.5em] font-label font-bold bg-background/40 backdrop-blur-sm px-6 py-2 rounded-full border border-primary/10 shadow-[0_0_20px_rgba(80,220,192,0.1)]">
                Scientific Bias Auditing Protocol
              </span>
              <h2 className="text-6xl md:text-8xl lg:text-[7.5rem] font-display font-black text-on-surface uppercase tracking-tighter leading-[0.85] drop-shadow-2xl">
                <div className="hero-title-line overflow-hidden"><div className="hero-text-inner">Forensic</div></div> 
                <div className="hero-title-line overflow-hidden pb-2">
                  <div className="hero-text-inner text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-[#9b51e0]">Objectivity</div>
                </div>
                <div className="hero-title-line overflow-hidden"><div className="hero-text-inner">For AI.</div></div>
              </h2>
            </div>
            
            <p className="hero-desc text-lg text-on-surface-variant leading-relaxed max-w-[600px] font-sans opacity-90">
              Aletheia provides an immutable ledger of algorithmic fairness. Deploying 13 scientific-grade detection algorithms to map, audit, and remediate bias in datasets and model outputs with clinical precision.
            </p>

            <div className="hero-buttons flex flex-col sm:flex-row gap-5 mt-4">
              <button 
                onClick={() => router.push('/dashboard')}
                className="btn-primary group flex items-center justify-center gap-4 px-10 py-5 text-sm shadow-[0_0_50px_rgba(80,220,192,0.25)] rounded-full transition-all duration-200 ease-out hover:scale-105 active:scale-95"
              >
                BEGIN FORENSIC AUDIT
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="flex items-center justify-center gap-3 text-[10px] uppercase font-bold tracking-[0.3em] text-on-surface-variant hover:text-on-surface px-10 border border-outline-variant/20 rounded-full py-5 bg-background/40 backdrop-blur-md hover:bg-background/80 hover:scale-105 transition-all duration-200 ease-out active:scale-95">
                READ THE WHITE PAPER
              </button>
            </div>

            <div className="hero-stats flex items-center gap-12 mt-16 opacity-70 grayscale brightness-125 border-t border-outline-variant/10 pt-10 w-full justify-center">
              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] uppercase tracking-widest font-mono">Status: NOMINAL</span>
                <div className="h-0.5 w-12 bg-primary mx-auto"></div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] uppercase tracking-widest font-mono">Latency: 24ms</span>
                <div className="h-0.5 w-12 bg-on-surface-variant mx-auto"></div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] uppercase tracking-widest font-mono">Uptime: 99.98%</span>
                <div className="h-0.5 w-12 bg-on-surface-variant mx-auto"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Infinite Marquee */}
        <InfiniteMarquee text="DETERMINISTIC // IMMUTABLE // FORENSIC // TRANSPARENT" />

        {/* Metrics Banner */}
        <section className="metrics-section px-8 lg:px-20 py-24 relative z-10 border-b border-outline-variant/5 bg-transparent">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent pointer-events-none"></div>
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-outline-variant/10 relative z-10">
            <div className="metric-card flex flex-col items-center text-center gap-2 px-8 py-4">
               <span className="text-7xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-primary to-primary-dim drop-shadow-[0_0_20px_rgba(80,220,192,0.4)]">13</span>
               <span className="text-[11px] uppercase tracking-[0.3em] text-on-surface-variant font-bold mt-4">Detection Algorithms</span>
            </div>
            <div className="metric-card flex flex-col items-center text-center gap-2 px-8 py-4">
               <span className="text-7xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-[#9b51e0] to-[#6b21a8] drop-shadow-[0_0_20px_rgba(155,81,224,0.4)]">100%</span>
               <span className="text-[11px] uppercase tracking-[0.3em] text-on-surface-variant font-bold mt-4">Deterministic Audits</span>
            </div>
            <div className="metric-card flex flex-col items-center text-center gap-2 px-8 py-4">
               <span className="text-7xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-primary to-primary-dim drop-shadow-[0_0_20px_rgba(80,220,192,0.4)]">&lt;1s</span>
               <span className="text-[11px] uppercase tracking-[0.3em] text-on-surface-variant font-bold mt-4">Execution Latency</span>
            </div>
          </div>
        </section>

        {/* Core Capabilities */}
        <section className="capabilities-section px-8 lg:px-20 py-40 border-t border-white/[0.03] bg-gradient-to-b from-surface-lowest/60 to-background relative z-10">
          <div className="flex flex-col gap-24 max-w-[1200px] mx-auto">
            <div className="capability-card flex flex-col gap-5 text-center items-center">
              <div className="flex items-center gap-4">
                <div className="h-[1px] w-16 bg-primary/30"></div>
                <span className="text-[10px] text-primary uppercase tracking-[0.5em] font-label font-bold">Platform Capabilities</span>
                <div className="h-[1px] w-16 bg-primary/30"></div>
              </div>
              <h3 className="text-5xl lg:text-7xl font-display font-bold text-on-surface uppercase tracking-tight leading-none">
                The Anatomy of <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-on-surface-variant">Algorithmic Justice</span>
              </h3>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  icon: <Database size={24} />, 
                  title: 'Forensic Ingestion', 
                  desc: 'High-fidelity data profiling and automated feature-to-demographic mapping.' 
                },
                { 
                  icon: <Cpu size={24} />, 
                  title: 'Multi-Agent Auditing', 
                  desc: 'Orchestrated Surveyor and Adjudicator agents working in an isolated forensic sandbox.' 
                },
                { 
                  icon: <BarChart3 size={24} />, 
                  title: 'Bias Vector Mapping', 
                  desc: 'Mathematical decomposition of bias into direct, indirect, and spurious effects.' 
                },
                { 
                  icon: <Shield size={24} />, 
                  title: 'Immutability', 
                  desc: 'Exportable forensic certificates for regulatory compliance and stakeholder review.' 
                }
              ].map((cap, i) => (
                <div key={i} className="capability-card relative group h-full">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl blur-[12px] -z-10"></div>
                  
                  <div className="relative h-full p-8 bg-[#111317]/80 backdrop-blur-xl rounded-2xl border border-white/[0.05] group-hover:border-primary/40 transition-all duration-500 flex flex-col gap-6 overflow-hidden">
                    <div className="absolute -top-16 -right-16 w-40 h-40 bg-primary/10 rounded-full blur-[50px] group-hover:bg-primary/30 transition-all duration-700"></div>

                    <div className="w-14 h-14 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-on-surface-variant group-hover:text-background group-hover:bg-primary group-hover:border-primary/50 transition-all duration-500 relative z-10 shadow-lg group-hover:shadow-[0_0_30px_rgba(80,220,192,0.4)]">
                      {cap.icon}
                    </div>
                    <div className="flex flex-col gap-3 relative z-10">
                      <h4 className="text-xl font-display font-bold uppercase tracking-tight text-white group-hover:text-primary transition-colors">{cap.title}</h4>
                      <p className="text-sm text-on-surface-variant leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity font-sans">
                        {cap.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works Pipeline */}
        <section className="px-8 lg:px-20 py-40 relative z-10 border-t border-outline-variant/5 bg-[#08090b] overflow-hidden">
          <div className="absolute top-40 right-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-40 left-20 w-96 h-96 bg-[#9b51e0]/5 rounded-full blur-[120px] pointer-events-none"></div>

          <div className="max-w-[1000px] mx-auto flex flex-col gap-32 relative z-10">
            <div className="text-center flex flex-col items-center gap-5">
              <div className="flex items-center gap-4">
                <div className="h-[1px] w-16 bg-primary/30"></div>
                <span className="text-[10px] text-primary uppercase tracking-[0.5em] font-label font-bold">Architecture</span>
                <div className="h-[1px] w-16 bg-primary/30"></div>
              </div>
              <h3 className="text-5xl lg:text-6xl font-display font-bold text-on-surface uppercase tracking-tight">
                The Auditing Pipeline
              </h3>
            </div>

            <div className="flex flex-col gap-16 md:gap-24 relative pipeline-container">
              {/* Connecting vertical line track */}
              <div className="hidden md:block absolute left-1/2 top-8 bottom-8 w-[2px] bg-white/[0.03] -translate-x-1/2 rounded-full z-0"></div>
              {/* The animating fill line */}
              <div className="pipeline-fill-line hidden md:block absolute left-1/2 top-8 w-[2px] bg-gradient-to-b from-primary via-[#9b51e0] to-primary -translate-x-1/2 origin-top rounded-full shadow-[0_0_15px_rgba(80,220,192,0.5)] z-0"></div>
              
              {[
                { step: "01", title: "Data Surveyor", desc: "Agents autonomously profile your dataset, identifying protected attributes, proxy variables, and class imbalances.", icon: <Telescope size={32} /> },
                { step: "02", title: "Adjudicator Selection", desc: "Based on the dataset topology, the system mathematically selects the optimal algorithmic fairness definitions to apply.", icon: <Waypoints size={32} /> },
                { step: "03", title: "Forensic Analysis", desc: "A strict deterministic execution environment maps bias vectors and computes exact disparity metrics.", icon: <Network size={32} /> },
                { step: "04", title: "Immutable Certification", desc: "Results are locked into a cryptographic ledger, providing irrefutable proof of compliance for stakeholders.", icon: <Fingerprint size={32} /> }
              ].map((item, i) => (
                <div key={i} className={`pipeline-item flex flex-col md:flex-row items-center gap-6 md:gap-24 ${i % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                  <div className={`flex-1 w-full flex flex-col gap-4 text-center ${i % 2 !== 0 ? 'md:text-left' : 'md:text-right'} relative z-20`}>
                    <h4 className="text-3xl font-display font-bold text-on-surface">{item.title}</h4>
                    <p className={`text-base text-on-surface-variant font-sans opacity-80 leading-relaxed max-w-[400px] mx-auto ${i % 2 !== 0 ? 'md:ml-0 md:mr-auto' : 'md:ml-auto md:mr-0'}`}>
                      {item.desc}
                    </p>
                  </div>
                  
                  <div className="w-28 h-28 shrink-0 relative z-20 rounded-full bg-[#08090b]">
                    <div className="pipeline-icon absolute inset-0 rounded-full border border-white/10 flex items-center justify-center shadow-xl text-on-surface-variant transition-colors duration-500 bg-transparent">
                      <span className="absolute -top-3 bg-background border border-primary/30 text-primary text-[10px] font-bold px-4 py-1 rounded-full tracking-widest">{item.step}</span>
                      {item.icon}
                    </div>
                  </div>
                  
                  <div className="flex-1 w-full hidden md:block"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="cta-section px-8 lg:px-20 py-40 flex flex-col items-center text-center gap-12 relative overflow-hidden bg-background">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] pointer-events-none"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#9b51e0]/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="cta-content flex flex-col items-center gap-12 relative z-10">
            <div className="flex flex-col gap-6">
              <span className="text-[12px] text-primary uppercase tracking-[1em] font-label font-bold">Compliance Ready</span>
              <h3 className="text-7xl lg:text-8xl font-display font-black text-on-surface uppercase tracking-tighter leading-none">
                Audit Now. <br />
                Trust Forever.
              </h3>
            </div>
            <button 
              onClick={() => router.push('/dashboard')}
              className="btn-primary group flex items-center gap-6 px-16 py-6 text-lg rounded-full shadow-[0_0_60px_rgba(80,220,192,0.3)] hover:scale-105 transition-all duration-200 ease-out active:scale-95"
            >
              INITIALIZE YOUR FIRST AUDIT
              <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>
      </main>

      <footer className="px-8 py-20 border-t border-outline-variant/5 bg-[#050608] relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 max-w-[1200px] mx-auto">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-primary mb-2">
              <Shield size={16} />
              <span className="font-display font-bold uppercase tracking-widest text-sm">Aletheia</span>
            </div>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">© 2026 Aletheia Forensic AI Systems</span>
            <span className="text-[8px] text-on-surface-variant/40 uppercase tracking-[0.4em]">Protocol Version 4.0.2-Clinical</span>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-x-16 gap-y-6">
            {['Privacy', 'Standard Protocol v4', 'API Documentation', 'System Status'].map((item) => (
              <button key={item} className="text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-white transition-colors font-bold">
                {item}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
