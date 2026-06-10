"use client";

import { motion } from "framer-motion";
import { Quote, Star, Play } from "lucide-react";

const testimonials = [
  {
    quote:
      "Anviora saved us weeks of compliance work for our EU exports. The lifecycle tracking is exactly what regulators want to see.",
    author: "Rajesh Kumar",
    role: "Compliance Head",
    company: "Nexus Power Solutions",
    location: "India",
    rating: 5,
    metric: "40 hours/month saved",
    initials: "RK",
  },
  {
    quote:
      "Finally a battery passport system that understands both India EPR and EU Battery Regulation. No more juggling multiple tools.",
    author: "Maria Schmidt",
    role: "Quality Director",
    company: "EcoCell GmbH",
    location: "Germany",
    rating: 5,
    metric: "3 regulations covered",
    initials: "MS",
  },
  {
    quote:
      "The QR code generation and audit trail gives our customers confidence. Our recycling partners love the transparent history.",
    author: "David Chen",
    role: "Operations Manager",
    company: "GreenTech Batteries",
    location: "Singapore",
    rating: 5,
    metric: "100% audit pass rate",
    initials: "DC",
  },
];

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: (typeof testimonials)[0];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15 }}
      className="group relative h-full"
    >
      <div className="bg-white rounded-2xl border border-zinc-200 p-8 h-full transition-all duration-300 hover:border-[#1F7A5F]/30 hover:shadow-none hover:shadow-zinc-200/50 hover:-translate-y-1">
        {/* Quote Icon */}
        <div className="absolute -top-3 left-8">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1F7A5F] to-[#2a9d75] flex items-center justify-center shadow-none shadow-[#1F7A5F]/20">
            <Quote className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Rating */}
        <div className="flex gap-1 mb-4 pt-2">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
          ))}
        </div>

        {/* Quote */}
        <p className="text-zinc-700 leading-relaxed mb-6 text-[15px]">
          &ldquo;{testimonial.quote}&rdquo;
        </p>

        {/* Metric Badge */}
        <div className="mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1F7A5F]/10 text-[#1F7A5F] rounded-full text-xs ">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1F7A5F]"></span>
            {testimonial.metric}
          </span>
        </div>

        {/* Author */}
        <div className="flex items-center gap-4 pt-4 border-t border-zinc-100">
          {/* Avatar */}
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#0B1F3B] to-[#1F7A5F] flex items-center justify-center text-white text-sm shadow-none">
            {testimonial.initials}
          </div>
          <div className="flex-1">
            <p className=" text-[#0B1F3B] text-sm">{testimonial.author}</p>
            <p className="text-xs text-zinc-500">{testimonial.role}</p>
            <p className="text-xs text-[#1F7A5F] font-medium">
              {testimonial.company} · {testimonial.location}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-zinc-50 border-y border-zinc-200 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-[#1F7A5F]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-[#0B1F3B]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B1F3B]/5 border border-[#0B1F3B]/10 rounded-full mb-6">
            <span className="text-xs font-medium text-[#0B1F3B]">
              Customer Stories
            </span>
          </span>
          <h2 className="text-3xl md:text-4xl font-heading text-[#0B1F3B] mb-4">
            Trusted by battery manufacturers worldwide
          </h2>
          <p className="text-base text-zinc-600 max-w-[55ch] mx-auto">
            See how companies are simplifying compliance with Anviora.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <TestimonialCard key={i} testimonial={testimonial} index={i} />
          ))}
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-zinc-500 mb-4 font-medium">
            Compliance-ready for major regulations
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <span className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-mono text-zinc-600 shadow-none">
              EU Battery Regulation 2023/1542
            </span>
            <span className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-mono text-zinc-600 shadow-none">
              India EPR Compliance
            </span>
            <span className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-mono text-zinc-600 shadow-none">
              BIS Certification Ready
            </span>
          </div>
        </motion.div>

        {/* Video Testimonial CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <button className="group inline-flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 hover:border-[#1F7A5F]/30 hover:shadow-none transition-all duration-300">
            <div className="h-10 w-10 rounded-full bg-[#1F7A5F] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Play className="h-4 w-4 text-white ml-0.5" />
            </div>
            <div className="text-left">
              <p className=" text-[#0B1F3B]">Watch Customer Stories</p>
              <p className="text-xs text-zinc-500">3 min · Real results</p>
            </div>
          </button>
        </motion.div>
      </div>
    </section>
  );
}
