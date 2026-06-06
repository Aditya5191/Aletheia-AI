"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Upload,
  Box,
  Brain,
  AlertTriangle,
  Rocket,
  ChevronRight,
  ChevronLeft,
  X,
  MapPin,
  BarChart3,
  FileText,
  Terminal,
} from "lucide-react";
import { useViewMode } from "./ViewModeContext";

interface TourOverlayProps {
  onClose: () => void;
}

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  selector?: string;
  popoverSide: "bottom" | "right" | "left" | "top" | "center";
  // Modal control
  openModal?: string; // nodeId to open
  modalTab?: "chart" | "review" | "code";
}

const tourSteps: TourStep[] = [
  {
    title: "Welcome to Aletheia",
    description:
      "Aletheia is an AI-powered fairness auditing platform. This tour will walk you through the complete workflow — from uploading data to generating a bias-free audit report.",
    icon: <Sparkles className="w-5 h-5" />,
    popoverSide: "center",
  },
  {
    title: "Upload Your Dataset",
    description:
      "Start by dragging your CSV file onto this node. Aletheia supports datasets up to 50MB with demographic attributes like gender, age, race, and income.",
    icon: <Upload className="w-5 h-5" />,
    selector: '[data-id="dataset-upload"]',
    popoverSide: "right",
  },
  {
    title: "Docker Sandbox",
    description:
      "Aletheia spins up a secure Docker container automatically. All AI-generated code executes in complete isolation — your system stays safe.",
    icon: <Box className="w-5 h-5" />,
    selector: '[data-id="docker-sandbox"]',
    popoverSide: "bottom",
  },
  {
    title: "Dataset Auditor Agent",
    description:
      "This is the first AI agent. Click RUN here to start the pipeline. It profiles your data, detects column types, and identifies protected attributes.",
    icon: <Brain className="w-5 h-5" />,
    selector: '[data-id="data-inspector"]',
    popoverSide: "bottom",
  },
  {
    title: "Analytics Dashboard",
    description:
      "Click on any agent to open its detail panel. The Analytics tab shows interactive charts — disparity trends, feature imbalance bars, and demographic breakdowns.",
    icon: <BarChart3 className="w-5 h-5" />,
    popoverSide: "center",
    openModal: "data-inspector",
    modalTab: "chart",
  },
  {
    title: "Review Summary",
    description:
      "The Review tab shows the agent's written analysis — a comprehensive assessment of what was found, including bias severity and recommended next steps.",
    icon: <FileText className="w-5 h-5" />,
    popoverSide: "center",
    openModal: "data-inspector",
    modalTab: "review",
  },
  {
    title: "Generated Code",
    description:
      "The Code tab shows the exact Python code the agent generated and executed inside the Docker sandbox. You can copy it to inspect or reproduce the analysis.",
    icon: <Terminal className="w-5 h-5" />,
    popoverSide: "center",
    openModal: "data-inspector",
    modalTab: "code",
  },
  {
    title: "Watch for Bias Signals",
    description:
      "As agents complete work, attribute nodes appear between them. Green means fair. Red flags a disparity. After mitigation, fixed attributes turn purple.",
    icon: <AlertTriangle className="w-5 h-5" />,
    selector: '[data-id="data-inspector"]',
    popoverSide: "right",
  },
  {
    title: "You're All Set!",
    description:
      "Click RUN on the Dataset Auditor to begin. Or switch to Test mode (🧪) in the top bar to preview the full workflow with mock data — zero API tokens used!",
    icon: <Rocket className="w-5 h-5" />,
    popoverSide: "center",
  },
];

export default function TourOverlay({ onClose }: TourOverlayProps) {
  const { setTourNodeId, setTourTab } = useViewMode();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [spotlight, setSpotlight] = useState<DOMRect | null>(null);
  const [contentKey, setContentKey] = useState(0);

  const step = tourSteps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === tourSteps.length - 1;

  // Mount animation
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // Control modal open/close and tab switching
  useEffect(() => {
    if (step.openModal) {
      setTourNodeId(step.openModal);
      if (step.modalTab) {
        // Small delay to let modal mount first
        setTimeout(() => setTourTab(step.modalTab!), 100);
      }
    } else {
      setTourNodeId(null);
      setTourTab(null);
    }
  }, [currentStep, step.openModal, step.modalTab, setTourNodeId, setTourTab]);

  // Find + highlight the target element
  const updateSpotlight = useCallback(() => {
    const sel = tourSteps[currentStep].selector;
    if (!sel || tourSteps[currentStep].openModal) {
      setSpotlight(null);
      return;
    }
    const el = document.querySelector(sel);
    if (el) {
      const rect = el.getBoundingClientRect();
      setSpotlight(rect);
    } else {
      setSpotlight(null);
    }
  }, [currentStep]);

  useEffect(() => {
    updateSpotlight();
    window.addEventListener("resize", updateSpotlight);
    window.addEventListener("scroll", updateSpotlight, true);
    return () => {
      window.removeEventListener("resize", updateSpotlight);
      window.removeEventListener("scroll", updateSpotlight, true);
    };
  }, [updateSpotlight]);

  const goTo = (next: number) => {
    setContentKey((k) => k + 1);
    setCurrentStep(next);
  };

  const handleNext = () => {
    if (isLast) {
      handleClose();
    } else {
      goTo(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (!isFirst) goTo(currentStep - 1);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTourNodeId(null);
    setTourTab(null);
    setTimeout(onClose, 250);
  };

  // Calculate popover position
  const getPopoverStyle = (): React.CSSProperties => {
    const PAD = 16;
    const ARROW = 12;

    // When the modal is open, park the popover at bottom-right so modal content is visible
    if (step.openModal) {
      return {
        position: "fixed",
        bottom: "32px",
        right: "32px",
        transform: "none",
      };
    }

    if (!spotlight || step.popoverSide === "center") {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const base: React.CSSProperties = { position: "fixed" };

    switch (step.popoverSide) {
      case "right":
        base.left = spotlight.right + PAD + ARROW;
        base.top = spotlight.top + spotlight.height / 2;
        base.transform = "translateY(-50%)";
        break;
      case "left":
        base.right = window.innerWidth - spotlight.left + PAD + ARROW;
        base.top = spotlight.top + spotlight.height / 2;
        base.transform = "translateY(-50%)";
        break;
      case "bottom":
        base.left = spotlight.left + spotlight.width / 2;
        base.top = spotlight.bottom + PAD + ARROW;
        base.transform = "translateX(-50%)";
        break;
      case "top":
        base.left = spotlight.left + spotlight.width / 2;
        base.bottom = window.innerHeight - spotlight.top + PAD + ARROW;
        base.transform = "translateX(-50%)";
        break;
    }

    return base;
  };

  // SVG overlay with cutout
  const renderOverlay = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const pad = 10;
    const radius = 12;

    // When modal is open, use a semi-transparent overlay on top of everything
    if (step.openModal) {
      return (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.3)",
            zIndex: 2000,
            pointerEvents: "none",
          }}
        />
      );
    }

    if (!spotlight) {
      return (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: isVisible ? "rgba(0,0,0,0.72)" : "rgba(0,0,0,0)",
            transition: "background-color 0.3s ease",
            zIndex: 2000,
          }}
          onClick={handleClose}
        />
      );
    }

    const x = spotlight.left - pad;
    const y = spotlight.top - pad;
    const sw = spotlight.width + pad * 2;
    const sh = spotlight.height + pad * 2;

    return (
      <svg
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 2000,
          pointerEvents: "auto",
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
        onClick={handleClose}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width={w} height={h} fill="white" />
            <rect
              x={x} y={y} width={sw} height={sh}
              rx={radius} ry={radius} fill="black"
              style={{ transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
            />
          </mask>
        </defs>
        <rect x="0" y="0" width={w} height={h} fill="rgba(0,0,0,0.72)" mask="url(#tour-spotlight-mask)" />
        <rect
          x={x} y={y} width={sw} height={sh}
          rx={radius} ry={radius} fill="none"
          stroke="rgba(139, 92, 246, 0.5)" strokeWidth="2"
          style={{ transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
    );
  };

  // Arrow pointing from popover to spotlight
  const renderArrow = () => {
    if (!spotlight || step.popoverSide === "center" || step.openModal) return null;
    const arrowStyle: React.CSSProperties = { position: "fixed", width: 0, height: 0, zIndex: 2002 };
    const size = 8;
    switch (step.popoverSide) {
      case "right":
        arrowStyle.left = spotlight.right + 16;
        arrowStyle.top = spotlight.top + spotlight.height / 2 - size;
        arrowStyle.borderTop = `${size}px solid transparent`;
        arrowStyle.borderBottom = `${size}px solid transparent`;
        arrowStyle.borderRight = `${size}px solid #1a1c23`;
        break;
      case "left":
        arrowStyle.right = window.innerWidth - spotlight.left + 16;
        arrowStyle.top = spotlight.top + spotlight.height / 2 - size;
        arrowStyle.borderTop = `${size}px solid transparent`;
        arrowStyle.borderBottom = `${size}px solid transparent`;
        arrowStyle.borderLeft = `${size}px solid #1a1c23`;
        break;
      case "bottom":
        arrowStyle.left = spotlight.left + spotlight.width / 2 - size;
        arrowStyle.top = spotlight.bottom + 16;
        arrowStyle.borderLeft = `${size}px solid transparent`;
        arrowStyle.borderRight = `${size}px solid transparent`;
        arrowStyle.borderBottom = `${size}px solid #1a1c23`;
        break;
      case "top":
        arrowStyle.left = spotlight.left + spotlight.width / 2 - size;
        arrowStyle.bottom = window.innerHeight - spotlight.top + 16;
        arrowStyle.borderLeft = `${size}px solid transparent`;
        arrowStyle.borderRight = `${size}px solid transparent`;
        arrowStyle.borderTop = `${size}px solid #1a1c23`;
        break;
    }
    return <div style={arrowStyle} />;
  };

  // Get the tab badge for modal steps
  const getTabBadge = () => {
    if (!step.modalTab) return null;
    const icons: Record<string, React.ReactNode> = {
      chart: <BarChart3 className="w-3 h-3" />,
      review: <FileText className="w-3 h-3" />,
      code: <Terminal className="w-3 h-3" />,
    };
    const labels: Record<string, string> = {
      chart: "Analytics Tab",
      review: "Review Tab",
      code: "Code Tab",
    };
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "11px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          backgroundColor: "rgba(139, 92, 246, 0.1)",
          color: "#a78bfa",
          padding: "4px 12px",
          borderRadius: "9999px",
          border: "1px solid rgba(139, 92, 246, 0.2)",
          marginBottom: "14px",
        }}
      >
        {icons[step.modalTab]}
        {labels[step.modalTab]}
      </div>
    );
  };

  return (
    <>
      {renderOverlay()}
      {renderArrow()}

      {/* Popover Card */}
      <div
        key={`popover-${contentKey}`}
        style={{
          ...getPopoverStyle(),
          zIndex: 2001,
          width: step.popoverSide === "center" || step.openModal ? "440px" : "360px",
          borderRadius: "16px",
          backgroundColor: "#1a1c23",
          border: "1px solid #2a2d37",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.1)",
          overflow: "hidden",
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.35s ease",
          animation: "tourPopIn 0.35s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderBottom: "1px solid #2a2d37",
            background: "linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(217,70,239,0.05) 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #7c3aed, #d946ef)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              {step.icon}
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#a78bfa",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Step {currentStep + 1} of {tourSteps.length}
            </span>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              color: "#6b7280",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "6px",
              display: "flex",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 18px 16px" }}>
          {getTabBadge()}
          <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#fff", marginBottom: "8px", lineHeight: 1.3 }}>
            {step.title}
          </h3>
          <p style={{ fontSize: "13px", color: "#9ca3af", lineHeight: 1.65, margin: 0 }}>
            {step.description}
          </p>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 18px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {!isFirst && (
              <button
                onClick={handleBack}
                style={{ background: "none", border: "none", fontSize: "12px", color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px", padding: "4px 0", transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
              >
                <ChevronLeft className="w-3 h-3" />
                Back
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            {tourSteps.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === currentStep ? "18px" : "6px",
                  height: "6px",
                  borderRadius: "3px",
                  backgroundColor: i === currentStep ? "#a78bfa" : "#3f3f46",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
                onClick={() => goTo(i)}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "7px 16px",
              backgroundColor: "#7c3aed",
              color: "#fff",
              borderRadius: "8px",
              border: "none",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#6d28d9")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#7c3aed")}
          >
            {isLast ? "Done" : "Next"}
            {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes tourPopIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
