"use client";

import TopAppBar from "@/components/TopAppBar";
import SideNavBar from "@/components/SideNavBar";
import FlowCanvas from "@/components/FlowCanvas";
import { ViewModeProvider } from "@/components/ViewModeContext";

export default function Home() {
  return (
    <ViewModeProvider>
      <TopAppBar />
      <SideNavBar />
      <FlowCanvas />
    </ViewModeProvider>
  );
}
