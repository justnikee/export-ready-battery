"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  Battery,
  Recycle,
  Leaf,
  Factory,
  ArrowRight,
  Calendar,
  MessageCircle,
} from "lucide-react";

export function CTASection() {
  return (
    <section className="relative min-h-[70vh] flex items-center overflow-hidden bg-gradient-to-br from-[#0B1F3B] via-[#0d2035] to-[#1F7A5F]/30">
      {/* Background Illustration Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#1F7A5F]/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#0B1F3B]/30 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-gradient-radial from-white/5 to-transparent rounded-full" />

        {/* Nature/Green Energy Illustration Elements */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[10%] left-[5%] text-[#1F7A5F]/20"
        >
          <Leaf className="w-32 h-32" />
        </motion.div>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-[15%] right-[8%] text-white/10"
        >
          <Factory className="w-28 h-28" />
        </motion.div>
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [0, 5, 0] }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute top-[20%] left-[15%] text-[#1F7A5F]/10"
        >
          <Recycle className="w-24 h-24" />
        </motion.div>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
          className="absolute top-[30%] right-[12%] text-white/5"
        >
          <Battery className="w-20 h-20" />
        </motion.div>

        {/* Grid Pattern */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:80px_80px]"
        />

        {/* Bottom Fade to blend with footer */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0B1F3B]/50 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1F7A5F] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1F7A5F]"></span>
            </span>
            <span className="text-xs font-medium text-white/80">
              Start your compliance journey
            </span>
          </span>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-semibold text-white mb-6 leading-tight">
            Ready to make compliance
            <span className="block text-[#1F7A5F]">
              your competitive advantage?
            </span>
          </h2>

          <p className="text-base md:text-lg text-white/70 max-w-[55ch] mx-auto mb-12">
            Join battery manufacturers simplifying EU and India compliance. Get
            started with a demo tailored to your workflow.
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <Link
              href="/contact"
              className="group inline-flex items-center justify-center gap-2 bg-[#1F7A5F] px-8 py-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#2a9d75] hover:shadow-xl hover:shadow-[#1F7A5F]/30 active:scale-[0.98]"
            >
              <Calendar className="h-4 w-4" />
              Book a Demo
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/docs"
              className="group inline-flex items-center px-8 py-4 text-sm font-medium text-white border-2 border-white/30 backdrop-blur-sm transition-all duration-300 hover:bg-white hover:text-[#0B1F3B] hover:border-white"
            >
              Explore Documentation
            </Link>
          </div>

          {/* Secondary CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <Link
              href="/contact?chat=true"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Chat with us
            </Link>
            <span className="h-4 w-px bg-white/20" />
            <a
              href="mailto:hello@exportlens.com"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
            >
              <Mail className="h-4 w-4" />
              hello@exportlens.com
            </a>
            <span className="h-4 w-px bg-white/20" />
            <a
              href="tel:+919876543210"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
            >
              <Phone className="h-4 w-4" />
              +91 98765 43210
            </a>
          </div>

          {/* Trust Note */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="pt-8 border-t border-white/10"
          >
            <p className="text-xs text-white/50">
              No credit card required · Setup in under 5 minutes · Cancel
              anytime
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
