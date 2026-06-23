"use client";

import { motion } from "framer-motion";

interface StepHeaderProps {
  stepNumber: number;
  totalSteps: number;
  title: string;
  description: string;
}

export function StepHeader({ stepNumber, totalSteps, title, description }: StepHeaderProps) {
  return (
    <div className="text-center space-y-2">
      <motion.p
        key={`step-${stepNumber}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-emerald-500 text-sm font-medium uppercase tracking-wider"
      >
        Step {stepNumber} of {totalSteps}
      </motion.p>
      <motion.h1
        key={`title-${stepNumber}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl text-foreground"
      >
        {title}
      </motion.h1>
      <motion.p
        key={`desc-${stepNumber}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-muted-foreground"
      >
        {description}
      </motion.p>
    </div>
  );
}
