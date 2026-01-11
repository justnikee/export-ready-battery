"use client"

import { motion } from "framer-motion"
import { Shield, Globe, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
}

const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
}

export function FeatureGrid() {
    return (
        <section className="py-24 bg-slate-50">
            <div className="container mx-auto px-4">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={stagger}
                    className="grid md:grid-cols-3 gap-8"
                >
                    {/* Card 1 */}
                    <motion.div variants={fadeIn} className="group">
                        <Card className="h-full border-2 border-transparent hover:border-orange-100 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1">
                            <CardHeader>
                                <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Shield className="h-6 w-6 text-orange-600" />
                                </div>
                                <CardTitle className="text-xl mb-2">Battery Aadhaar (BPAN)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-600 leading-relaxed">
                                    Auto-generate 21-digit IDs instantly. Track Domestic Value Addition for <strong className="text-slate-900">PLI subsidies</strong> and local compliance.
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Card 2 */}
                    <motion.div variants={fadeIn} className="group">
                        <Card className="h-full border-2 border-transparent hover:border-blue-100 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1">
                            <CardHeader>
                                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Globe className="h-6 w-6 text-blue-600" />
                                </div>
                                <CardTitle className="text-xl mb-2">Global Passport</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-600 leading-relaxed">
                                    One switch unlocks <strong className="text-slate-900">EU compliance</strong>. Automatically track Carbon Footprint limits & Critical Material composition percentages.
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Card 3 */}
                    <motion.div variants={fadeIn} className="group">
                        <Card className="h-full border-2 border-transparent hover:border-emerald-100 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1">
                            <CardHeader>
                                <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Zap className="h-6 w-6 text-emerald-600" />
                                </div>
                                <CardTitle className="text-xl mb-2">Ops Automation</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-600 leading-relaxed">
                                    Bulk CSV Upload & PDF Sticker Printing (A4/Roll). Seamlessly integrates with your existing <strong className="text-slate-900">ERP & Manufacturing</strong> workflows.
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    )
}
