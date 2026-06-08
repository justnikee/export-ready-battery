"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

interface AnimatedStepProps {
  stepKey: number;
  direction: number;
  children: ReactNode;
}

export function AnimatedStep({ stepKey, direction, children }: AnimatedStepProps) {
  return (
    <motion.div
      key={stepKey}
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {children}
    </motion.div>
  );
}
