"use client";

import React, { useState } from "react";
import { Search, Shield, BrainCircuit, LineChart, Cpu, Library, Briefcase, GraduationCap, Building2, HeartPulse, Scale } from "lucide-react";
import { useViewMode } from "./ViewModeContext";

interface Algorithm {
  id: string;
  name: string;
  type: "PURE" | "FRAMEWORK";
  detection: string;
  mitigation: string;
  sectors: string[];
}

const algorithms: Algorithm[] = [
  // PURE
  {
    id: "disparate_impact_repair",
    name: "Disparate Impact (80% Rule)",
    type: "PURE",
    detection: "BER certification against epsilon threshold",
    mitigation: "Geometric repair via quantile-aligned CDF transformation",
    sectors: ["Hiring", "Finance", "Criminal Justice"]
  },
  {
    id: "equality_of_opportunity",
    name: "Equality of Opportunity",
    type: "PURE",
    detection: "TPR/FPR parity measurement across groups",
    mitigation: "Group-specific threshold optimisation via grid search",
    sectors: ["Hiring", "Finance", "Criminal Justice"]
  },
  {
    id: "recidivism_fairness_calibration",
    name: "Recidivism Fairness Calibration",
    type: "PURE",
    detection: "Impossibility theorem validation (Eq. 2.6)",
    mitigation: "Explicit tradeoff calibration — FPR/FNR/PPV strategies",
    sectors: ["Criminal Justice"]
  },
  {
    id: "brownian_distance_covariance",
    name: "Brownian Distance Covariance",
    type: "PURE",
    detection: "Non-linear proxy detection via dCor with permutation FDR",
    mitigation: "Non-linear residualization via gradient-boosted regression",
    sectors: ["Hiring", "Finance", "Healthcare", "Education"]
  },
  {
    id: "causal_fair_inference",
    name: "Causal Fair Inference (PSE)",
    type: "PURE",
    detection: "Path-Specific Effect estimation via IPW with bootstrap CI",
    mitigation: "Constrained Maximum Likelihood with SLSQP and PSE bounds",
    sectors: ["Hiring", "Finance", "Education"]
  },
  {
    id: "causal_explanation_formula",
    name: "Causal Explanation Formula",
    type: "PURE",
    detection: "Mechanism decomposition: TV = SE + IE - DE",
    mitigation: "Narrow Tailoring optimisation with legal feasibility bounds",
    sectors: ["Hiring", "Finance", "Education"]
  },
  // FRAMEWORK
  {
    id: "intersectional_subgroup_scan",
    name: "Intersectional Subgroup Scan",
    type: "FRAMEWORK",
    detection: "4 Steps: Combinatorial generation, DIR + chi-squared, BH FDR, Ranking",
    mitigation: "Intersectional group fairness, multiple testing correction",
    sectors: ["Hiring", "Finance", "Healthcare", "Criminal Justice", "Education"]
  },
  {
    id: "mutual_info_proxy_scanner",
    name: "Mutual Information Proxy Scanner",
    type: "FRAMEWORK",
    detection: "4 Steps: KSG MI estimation, Null permutations, FDR correction",
    mitigation: "Information-theoretic dependence, Ridge residuals",
    sectors: ["Hiring", "Finance", "Healthcare", "Education"]
  },
  {
    id: "shap_proxy_detection",
    name: "SHAP Feature Attribution Auditing",
    type: "FRAMEWORK",
    detection: "4 Steps: Baseline, KernelSHAP, Proxy scoring",
    mitigation: "Game-theoretic attribution, exponential sample reweighting",
    sectors: ["Hiring", "Finance", "Healthcare", "Education"]
  },
  {
    id: "counterfactual_orthogonalization",
    name: "Counterfactual Fairness (OB)",
    type: "FRAMEWORK",
    detection: "3 Steps: Correlation audit, SVD orthogonal projection",
    mitigation: "Lagrange orthogonalization, Matrix reconstruction",
    sectors: ["Hiring", "Finance", "Education"]
  },
  {
    id: "fairness_feedback_reparation",
    name: "Fairness Feedback Loops",
    type: "FRAMEWORK",
    detection: "6 Steps: DP, EOdds, AccGap, KL-divergence, Generational tracking",
    mitigation: "Model-Induced Distribution Shifts, quota-based reparation",
    sectors: ["Hiring", "Finance", "Education"]
  },
  {
    id: "dro_fairness_no_demographics",
    name: "DRO Fairness Without Demographics",
    type: "FRAMEWORK",
    detection: "5 Steps: Group risks, Disparity dynamics, Spectral radius",
    mitigation: "Chi-squared DRO, Jacobian stability analysis",
    sectors: ["Finance", "Healthcare", "Education"]
  },
  {
    id: "relational_fairness_psl",
    name: "Relational Fairness (FairPSL)",
    type: "FRAMEWORK",
    detection: "4 Steps: FOL grounding, RD/RR/RC metrics, Linear constraints",
    mitigation: "First-Order Logic, Probabilistic Soft Logic, Convex MAP inference",
    sectors: ["Hiring", "Finance", "Education"]
  }
];

const SectorIcon = ({ sector }: { sector: string }) => {
  switch (sector) {
    case "Hiring": return <Briefcase className="w-3 h-3" />;
    case "Finance": return <Building2 className="w-3 h-3" />;
    case "Criminal Justice": return <Scale className="w-3 h-3" />;
    case "Healthcare": return <HeartPulse className="w-3 h-3" />;
    case "Education": return <GraduationCap className="w-3 h-3" />;
    default: return <Library className="w-3 h-3" />;
  }
};

export default function AlgorithmLibrary() {
  const { isSidebarCollapsed } = useViewMode();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "PURE" | "FRAMEWORK">("ALL");

  const filteredAlgorithms = algorithms.filter(algo => {
    const matchesSearch = algo.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          algo.detection.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          algo.mitigation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "ALL" || algo.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className={`mt-[64px] min-h-[calc(100vh-64px)] bg-background text-on-surface pb-12 transition-[margin] duration-300 ease-out ${
      isSidebarCollapsed ? "ml-0" : "ml-[260px]"
    }`}>
      {/* Hero Section */}
      <div className="relative border-b border-outline-variant bg-surface px-8 py-10 overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <BrainCircuit className="w-64 h-64" />
        </div>
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-inner shadow-primary/30">
              <Library className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-on-surface">Algorithm Library</h1>
          </div>
          <p className="text-on-surface-variant max-w-2xl text-sm leading-relaxed">
            Aletheia's Model Context Protocol (MCP) provides AI agents with deep statistical and causal bias detection knowledge. The registry uses a Dual-Knowledge Delivery Model, categorizing algorithms as either <strong>PURE</strong> (single mathematical formula) or <strong>FRAMEWORK</strong> (multi-step orchestrated pipelines).
          </p>

          <div className="flex flex-col gap-4 mt-6">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-on-surface-variant" />
              </div>
              <input
                type="text"
                placeholder="Search algorithms, techniques, metrics..."
                className="block w-full min-w-[300px] sm:min-w-[400px] pl-10 pr-3 py-2 border border-outline-variant rounded-lg bg-surface-container text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex p-1 bg-surface-container rounded-lg border border-outline-variant w-fit">
              <button 
                onClick={() => setFilterType("ALL")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors duration-150 ease-out active:scale-95 ${filterType === "ALL" ? "bg-outline-variant text-on-surface shadow" : "text-on-surface-variant hover:text-on-surface"}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilterType("PURE")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors duration-150 ease-out active:scale-95 ${filterType === "PURE" ? "bg-primary/20 text-primary border border-primary/30 shadow" : "text-on-surface-variant hover:text-on-surface"}`}
              >
                PURE
              </button>
              <button 
                onClick={() => setFilterType("FRAMEWORK")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors duration-150 ease-out active:scale-95 ${filterType === "FRAMEWORK" ? "bg-secondary/20 text-secondary border border-secondary/30 shadow" : "text-on-surface-variant hover:text-on-surface"}`}
              >
                FRAMEWORK
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="max-w-6xl mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAlgorithms.map((algo) => (
            <div 
              key={algo.id} 
              className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden shadow-lg hover:shadow-xl hover:border-outline transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-1 flex flex-col group relative"
            >
              {/* Type Badge */}
              <div className="absolute top-4 right-4">
                <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${
                  algo.type === "PURE" 
                    ? "bg-primary/10 text-primary border-primary/30" 
                    : "bg-secondary/10 text-secondary border-secondary/30"
                }`}>
                  {algo.type}
                </span>
              </div>

              {/* Card Header */}
              <div className="p-5 border-b border-outline-variant/50 bg-surface-container/30">
                <div className="w-8 h-8 rounded-lg bg-surface-container border border-outline flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  {algo.type === "PURE" ? <LineChart className="w-4 h-4 text-primary" /> : <Cpu className="w-4 h-4 text-secondary" />}
                </div>
                <h3 className="text-lg font-bold text-on-surface mb-1 pr-16">{algo.name}</h3>
                <code className="text-[10px] text-on-surface-variant font-mono bg-surface px-1.5 py-0.5 rounded">
                  {algo.id}
                </code>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col gap-4">
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-on-surface-variant mb-1 flex items-center gap-1.5">
                    <Search className="w-3 h-3" /> Detection Method
                  </h4>
                  <p className="text-sm text-on-surface leading-snug">{algo.detection}</p>
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-on-surface-variant mb-1 flex items-center gap-1.5">
                    <Shield className="w-3 h-3" /> Mitigation Technique
                  </h4>
                  <p className="text-sm text-on-surface leading-snug">{algo.mitigation}</p>
                </div>
              </div>

              {/* Card Footer: Sectors */}
              <div className="p-4 bg-surface-container/50 border-t border-outline-variant flex flex-wrap gap-2">
                {algo.sectors.map(sector => (
                  <span 
                    key={sector} 
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium bg-surface border border-outline-variant text-on-surface-variant group-hover:border-outline group-hover:text-on-surface transition-colors"
                  >
                    <SectorIcon sector={sector} />
                    {sector}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {filteredAlgorithms.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-on-surface-variant">
              <Search className="w-12 h-12 mb-4 text-outline" />
              <p className="text-lg">No algorithms match your criteria.</p>
              <button 
                onClick={() => { setSearchTerm(""); setFilterType("ALL"); }}
                className="mt-4 text-primary hover:text-primary/80 text-sm font-medium transition-colors cursor-pointer active:scale-95"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
