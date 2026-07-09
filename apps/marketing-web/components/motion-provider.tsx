"use client";

import { MotionConfig } from "framer-motion";

/**
 * Respects the visitor's OS-level "reduce motion" preference for every
 * framer-motion animation on the site (infinite dots, countdown flips, pulses).
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
