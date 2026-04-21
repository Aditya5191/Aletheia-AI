import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Cpu, Activity, BarChart3, Database } from 'lucide-react';
import FaultyTerminal from '../components/FaultyTerminal';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 min-h-screen flex flex-col bg-background overflow-x-hidden relative">
      {/* Background Terminal Effect */}
      <div className="fixed inset-0 z-0 opacity-30">
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
        />
      </div>

      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex items-center justify-between glass border-b border-outline-variant/10">
        <div className="flex items-center gap-12">
          <h1 className="text-xl font-display font-bold text-primary uppercase tracking-[0.3em]">Aletheia AI</h1>
          <nav className="hidden md:flex gap-8">
            {['Platform', 'Solutions', 'Scientific Basis', 'Compliance'].map((item) => (
              <button key={item} className="text-[10px] uppercase font-bold tracking-[0.2em] text-on-surface-variant hover:text-primary transition-colors">
                {item}
              </button>
            ))}
          </nav>
        </div>
        <button 
          onClick={() => navigate('/upload')}
          className="btn-secondary group flex items-center gap-3 bg-background/50 backdrop-blur-md"
        >
          INITIALIZE AUDIT
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </header>

      <main className="flex-1 flex flex-col pt-24 relative z-10">
        {/* Hero Section - Centered & Cinematic */}
        <section className="px-8 lg:px-20 py-16 flex flex-col items-center text-center justify-center min-h-[75vh] relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center gap-8 z-10 max-w-4xl"
          >
            <div className="flex flex-col items-center gap-3">
              <span className="text-[10px] text-primary uppercase tracking-[0.5em] font-label font-bold bg-background/40 backdrop-blur-sm px-5 py-1.5 rounded-full border border-primary/10">
                Scientific Bias Auditing Protocol
              </span>
              <h2 className="text-6xl lg:text-8xl font-display font-bold text-on-surface uppercase tracking-tighter leading-[0.85] drop-shadow-xl">
                Forensic <br /> 
                <span className="text-primary-dim">Objectivity</span> <br />
                For AI.
              </h2>
            </div>
            
            <p className="text-lg text-on-surface-variant leading-relaxed max-w-xl font-sans opacity-90">
              Aletheia provides an immutable ledger of algorithmic fairness. Deploying 13 scientific-grade detection algorithms to map, audit, and remediate bias in datasets and model outputs with clinical precision.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 mt-4">
              <button 
                onClick={() => navigate('/upload')}
                className="btn-primary group flex items-center justify-center gap-4 px-10 py-4 text-sm shadow-[0_0_40px_rgba(80,220,192,0.2)]"
              >
                BEGIN FORENSIC AUDIT
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="flex items-center justify-center gap-3 text-[10px] uppercase font-bold tracking-[0.3em] text-on-surface-variant hover:text-on-surface transition-all px-10 border border-outline-variant/20 rounded-md py-4 bg-background/40 backdrop-blur-md hover:bg-background/60">
                READ THE WHITE PAPER
              </button>
            </div>

            <div className="flex items-center gap-12 mt-12 opacity-60 grayscale brightness-125 border-t border-outline-variant/10 pt-10 w-full justify-center">
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
          </motion.div>
        </section>

        {/* Core Capabilities */}
        <section className="px-8 lg:px-20 py-24 border-t border-outline-variant/5 bg-surface-lowest/40 relative backdrop-blur-sm">
          <div className="flex flex-col gap-16 max-w-7xl mx-auto">
            <div className="flex flex-col gap-3 max-w-2xl text-center md:text-left">
              <span className="text-[10px] text-primary uppercase tracking-[0.4em] font-label font-bold">Platform Capabilities</span>
              <h3 className="text-4xl font-display font-bold text-on-surface uppercase tracking-tight leading-none">
                The Anatomy of <br />
                Algorithmic Justice
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
                <div key={i} className="card p-8 bg-surface-low/30 hover:bg-surface-high/30 transition-all duration-500 flex flex-col gap-6 group border border-white/[0.02]">
                  <div className="w-12 h-12 rounded bg-surface-highest flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                    {cap.icon}
                  </div>
                  <div className="flex flex-col gap-3">
                    <h4 className="text-lg font-display font-bold uppercase tracking-tight">{cap.title}</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">
                      {cap.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-8 lg:px-20 py-32 flex flex-col items-center text-center gap-12 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]"></div>
          <div className="flex flex-col gap-5 relative z-10">
            <span className="text-[10px] text-primary uppercase tracking-[0.8em] font-label font-bold">Compliance Ready</span>
            <h3 className="text-6xl lg:text-7xl font-display font-bold text-on-surface uppercase tracking-tighter leading-none">
              Audit Now. <br />
              Trust Forever.
            </h3>
          </div>
          <button 
            onClick={() => navigate('/upload')}
            className="btn-primary group flex items-center gap-6 px-16 py-5 text-base relative z-10 shadow-[0_0_50px_rgba(80,220,192,0.25)]"
          >
            INITIALIZE YOUR FIRST AUDIT
            <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </section>
      </main>

      <footer className="px-8 py-16 border-t border-outline-variant/5 bg-surface-lowest relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 max-w-7xl mx-auto">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">© 2026 Aletheia Forensic AI Systems</span>
            <span className="text-[8px] text-on-surface-variant/40 uppercase tracking-[0.4em]">Protocol Version 4.0.2-Clinical</span>
          </div>
          <div className="flex gap-16">
            {['Privacy', 'Standard Protocol v4', 'API Documentation', 'System Status'].map((item) => (
              <button key={item} className="text-[9px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors font-bold">
                {item}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};
