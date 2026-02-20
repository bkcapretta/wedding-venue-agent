"use client";

import dynamic from "next/dynamic";

export const MapView = dynamic(() => import("./MapViewInner"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center">
      <span className="text-gray-400 text-sm">Loading map...</span>
    </div>
  ),
});
