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
    <div className="space-y-1.5">
      <motion.p
        key={`step-${stepNumber}`}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs font-medium uppercase tracking-widest"
        style={{ color: "#10b981" }}
      >
        Step {stepNumber} of {totalSteps}
      </motion.p>
      <motion.h1
        key={`title-${stepNumber}`}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="text-2xl font-semibold"
        style={{ color: "#f1f5f9" }}
      >
        {title}
      </motion.h1>
      <motion.p
        key={`desc-${stepNumber}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-sm"
        style={{ color: "#64748b" }}
      >
        {description}
      </motion.p>
    </div>
  );
}
