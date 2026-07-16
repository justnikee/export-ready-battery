"use client";

import { motion } from "framer-motion";
import { CheckCircle2, LucideIcon } from "lucide-react";

interface Step {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: currentStep >= step.id ? 1 : 0.85 }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
              currentStep > step.id
                ? "bg-emerald-500"
                : currentStep === step.id
                  ? "bg-emerald-500 ring-2 ring-emerald-500/25"
                  : "bg-white/5 border border-white/10"
            }`}
          >
            {currentStep > step.id ? (
              <CheckCircle2 className="w-4 h-4 text-white" />
            ) : (
              <step.icon
                className={`w-4 h-4 ${
                  currentStep >= step.id ? "text-white" : "text-slate-500"
                }`}
              />
            )}
          </motion.div>

          {index < steps.length - 1 && (
            <div
              className={`w-10 h-px mx-1 rounded-full transition-colors duration-500 ${
                currentStep > step.id ? "bg-emerald-500" : "bg-white/8"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
