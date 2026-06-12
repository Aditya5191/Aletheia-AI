"use client";

import TopAppBar from "@/components/TopAppBar";
import SideNavBar from "@/components/SideNavBar";
import FlowCanvas from "@/components/FlowCanvas";
import ModelFlowCanvas from "@/components/ModelFlowCanvas";
import TourWindow from "@/components/TourWindow";
import { ViewModeProvider, useViewMode } from "@/components/ViewModeContext";

function HomeContent() {
  const { showTour, setShowTour, currentView } = useViewMode();

  return (
    <>
      <TopAppBar />
      <SideNavBar />
      {currentView === "dataset" ? <FlowCanvas /> : <ModelFlowCanvas />}
      {showTour && currentView === "dataset" && <TourWindow onClose={() => setShowTour(false)} />}
    </>
  );
}

export default function Home() {
  return (
    <ViewModeProvider>
      <HomeContent />
    </ViewModeProvider>
  );
}
