"use client";

import TopAppBar from "@/components/TopAppBar";
import SideNavBar from "@/components/SideNavBar";
import FlowCanvas from "@/components/FlowCanvas";
import TourWindow from "@/components/TourWindow";
import { ViewModeProvider, useViewMode } from "@/components/ViewModeContext";

function HomeContent() {
  const { showTour, setShowTour } = useViewMode();
  
  return (
    <>
      <TopAppBar />
      <SideNavBar />
      <FlowCanvas />
      {showTour && <TourWindow onClose={() => setShowTour(false)} />}
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
