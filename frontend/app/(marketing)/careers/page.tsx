"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Briefcase, Code, Shield, Users, ArrowRight, Mail } from "lucide-react";

const values = [
  {
    icon: Shield,
    title: "Build Trust with Precision",
    description:
      "We work on compliance infrastructure where correctness matters — every check, every hash, every audit entry must be right.",
  },
  {
    icon: Code,
    title: "Engineer for Real Manufacturing",
    description:
      "Code that runs on factory floors, not just browsers. Our platform connects real assembly lines to digital regulation.",
  },
  {
    icon: Users,
    title: "Solve Together",
    description:
      "Product, engineering, and compliance domain experts collaborate directly. No silos between understanding the problem and shipping the solution.",
  },
];

const roles = [
  {
    title: "Senior Full-Stack Engineer",
    department: "Engineering",
    location: "Remote (India)",
    type: "Full-time",
  },
  {
    title: "Compliance Domain Specialist",
    department: "Product",
    location: "Remote (India)",
    type: "Full-time",
  },
  {
    title: "Enterprise Sales Lead",
    department: "Growth",
    location: "Remote (India / EU)",
    type: "Full-time",
  },
];

export default function CareersPage() {
  return (
    <section className="pt-32 pb-24 px-4 bg-white">
      <div className="mx-auto w-full max-w-6xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20 space-y-4"
        >
          <span className="inline-block text-xs uppercase tracking-widest font-mono text-accent-green">
            Join Us
          </span>
          <h1 className="text-4xl md:text-5xl font-heading text-[#0B1F3B]">
            Careers at ExportReady
          </h1>
          <p className="text-lg text-zinc-600 max-w-3xl mx-auto">
            We&apos;re building compliance infrastructure for the global battery
            supply chain. High-stakes systems, real-world impact, and problems
            worth solving.
          </p>
        </motion.div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-2xl font-heading text-[#0B1F3B] text-center mb-12">
            How We Work
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {values.map((v) => (
              <div
                key={v.title}
                className="p-8 rounded-xl border border-gray-200 bg-white hover:border-green-200 hover:shadow-lg transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-green/10 flex items-center justify-center mb-4">
                  <v.icon className="h-5 w-5 text-accent-green" />
                </div>
                <h3 className="text-lg font-semibold text-[#0B1F3B] mb-2">
                  {v.title}
                </h3>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Open Roles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto mb-20"
        >
          <div className="flex items-center gap-3 mb-8 justify-center">
            <Briefcase className="h-6 w-6 text-accent-green" />
            <h2 className="text-2xl font-heading text-[#0B1F3B]">Open Roles</h2>
          </div>
          <div className="space-y-3">
            {roles.map((role) => (
              <div
                key={role.title}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-5 rounded-xl border border-gray-200 bg-white hover:border-green-200 transition-colors"
              >
                <div>
                  <h3 className="font-semibold text-[#0B1F3B]">{role.title}</h3>
                  <p className="text-sm text-zinc-500">
                    {role.department} · {role.location} · {role.type}
                  </p>
                </div>
                <a
                  href={`mailto:careers@exportready.com?subject=Application: ${encodeURIComponent(role.title)}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-green hover:text-green-700 transition-colors shrink-0"
                >
                  Apply <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-zinc-500 mt-6">
            Don&apos;t see a fit? Send your resume to{" "}
            <a
              href="mailto:careers@exportready.com"
              className="text-accent-green font-medium hover:underline"
            >
              careers@exportready.com
            </a>
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4"
        >
          <a
            href="mailto:careers@exportready.com"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-cta-button px-8 py-3.5 text-sm font-medium text-white transition-all duration-200 hover:opacity-95"
          >
            <Mail className="h-4 w-4" />
            Send Your Resume
          </a>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-8 py-3.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-accent-green hover:text-accent-green"
          >
            Learn About Us
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
