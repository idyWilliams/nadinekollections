"use client";

import { useState, useEffect, useSyncExternalStore } from "react";

function subscribeMedia(query: string) {
  return (listener: () => void) => {
    if (typeof window === "undefined") return () => {};
    const media = window.matchMedia(query);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  };
}

export function useMediaQuery(query: string, defaultState = false): boolean {
  const getSnapshot = () => {
    if (typeof window === "undefined") return defaultState;
    return window.matchMedia(query).matches;
  };

  const getServerSnapshot = () => defaultState;

  return useSyncExternalStore(subscribeMedia(query), getSnapshot, getServerSnapshot);
}
