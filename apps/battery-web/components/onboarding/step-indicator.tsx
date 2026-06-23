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
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{
              scale: currentStep >= step.id ? 1 : 0.8,
              backgroundColor:
                currentStep >= step.id ? "#10b981" : "#f4f4f5",
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              currentStep > step.id
                ? "bg-emerald-500"
                : currentStep === step.id
                  ? "bg-emerald-500 ring-2 ring-emerald-500/20"
                  : "bg-muted"
            }`}
          >
            {currentStep > step.id ? (
              <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
            ) : (
              <step.icon
                className={`w-5 h-5 ${currentStep >= step.id ? "text-primary-foreground" : "text-muted-foreground"}`}
              />
            )}
          </motion.div>
          {index < steps.length - 1 && (
            <div
              className={`w-12 h-1 mx-1 rounded-full transition-colors ${
                currentStep > step.id ? "bg-emerald-500" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
