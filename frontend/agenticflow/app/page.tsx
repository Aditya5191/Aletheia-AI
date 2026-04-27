"use client";

import TopAppBar from "@/components/TopAppBar";
import SideNavBar from "@/components/SideNavBar";
import FlowCanvas from "@/components/FlowCanvas";
import DocsModal from "@/components/DocsModal";
import { ViewModeProvider, useViewMode } from "@/components/ViewModeContext";

function HomeContent() {
  const { showDocs, setShowDocs } = useViewMode();
  
  return (
    <>
      <TopAppBar />
      <SideNavBar />
      <FlowCanvas />
      {showDocs && <DocsModal onClose={() => setShowDocs(false)} />}
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
