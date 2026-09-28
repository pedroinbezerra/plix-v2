"use client";

import React from "react";
import { useSpatialNavigation } from "@/lib/tv/spatial-nav";

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  useSpatialNavigation();
  return <>{children}</>;
}
