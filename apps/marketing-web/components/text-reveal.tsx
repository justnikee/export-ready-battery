"use client";

import { motion } from "framer-motion";
import type { ElementType } from "react";

interface TextRevealProps {
  children: string;
  className?: string;
  as?: ElementType;
  delay?: number;
  /** Stagger between words, in seconds */
  stagger?: number;
}

export default function TextReveal({
  children,
  className = "",
  as: Tag = "div",
  delay = 0,
  stagger = 0.045,
}: TextRevealProps) {
  const words = children.split(" ");

  return (
    <Tag className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.15em] -mb-[0.15em] align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "100%", opacity: 0 }}
            whileInView={{ y: "0%", opacity: 1 }}
            viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
            transition={{
              duration: 0.7,
              delay: delay + i * stagger,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
            {i !== words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
