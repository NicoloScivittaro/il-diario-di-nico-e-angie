"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { Heart, BookHeart, Image as ImageIcon, MapPin, PawPrint, Sparkles, ArrowRight } from "lucide-react";

export default function Home() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-[10%] text-pink-200/50"
        >
          <Heart size={120} fill="currentColor" />
        </motion.div>
        <motion.div
          animate={{ y: [0, 30, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-40 right-[15%] text-rose-200/40"
        >
          <Heart size={180} fill="currentColor" />
        </motion.div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-200/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-20">

        {/* Header / Nav Placeholder */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-16"
        >
          <div className="flex items-center gap-2">
            <Heart className="text-rose-500 fill-rose-500 animate-pulse-soft" size={24} />
            <span className="font-handwritten text-2xl text-rose-800 font-bold">Nico & Angie</span>
          </div>
          <Link href="/auth/login" className="px-6 py-2 rounded-full glass-button text-rose-700 font-medium hover:text-rose-900 transition-colors">
            Accedi
          </Link>
        </motion.header>

        {/* Hero Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center mb-24"
        >
          <motion.div variants={itemVariants} className="inline-block mb-4 px-4 py-1 bg-white/50 backdrop-blur-sm rounded-full border border-pink-100/50">
            <span className="text-rose-500 text-sm font-medium tracking-wide flex items-center gap-2">
              <Sparkles size={14} /> Il nostro spazio privato
            </span>
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl font-bold text-rose-900 mb-6 leading-tight">
            Il Diario di <br />
            <span className="text-gradient">Nico & Angie</span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-lg md:text-2xl text-rose-700/80 max-w-2xl mx-auto mb-10 font-handwritten">
            "Un luogo segreto dove l'amore cresce ogni giorno.
            Ogni ricordo è una stella che illumina il nostro cielo."
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <Link href="/auth/register" className="group relative px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-600 rounded-full text-white shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 transition-all hover:-translate-y-1">
              <span className="relative z-10 flex items-center gap-2 text-lg font-semibold">
                Inizia a scrivere <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link href="/auth/login" className="px-8 py-4 glass-button rounded-full text-rose-700 font-semibold hover:bg-white/80">
              Entra nel nostro mondo
            </Link>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="glass-card p-6 rounded-2xl flex flex-col items-center text-center group cursor-pointer"
            >
              <div className={`p-4 rounded-full mb-4 ${feature.bgColor} ${feature.textColor} group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2 font-handwritten">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Emotional CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden glass-card p-8 md:p-16 text-center"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-rose-100/50 to-purple-100/50 z-0" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-rose-900 mb-6 font-handwritten">Pronti a scrivere la vostra storia?</h2>
            <p className="text-gray-600 text-lg mb-8 max-w-xl mx-auto">
              Non lasciare che i momenti preziosi svaniscano. Custodiscili qui, per sempre.
            </p>
            <Link href="/auth/register" className="inline-flex items-center gap-2 px-8 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-full font-semibold transition-colors shadow-lg shadow-rose-200">
              <Heart size={18} fill="currentColor" /> Crea il vostro diario
            </Link>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="mt-20 text-center text-rose-400/60 text-sm">
          <p>© {new Date().getFullYear()} Il Diario di Nico & Angie. Fatto con Amore.</p>
        </footer>

      </div>
    </main>
  );
}

const features = [
  {
    title: "Diario Condiviso",
    description: "Scrivete pensieri e dedicatevi parole dolci, creando un filo diretto tra i vostri cuori.",
    icon: BookHeart,
    bgColor: "bg-pink-100",
    textColor: "text-pink-600"
  },
  {
    title: "Album Fotografico",
    description: "Raccogliete gli scatti dei vostri momenti più felici in una galleria esclusiva.",
    icon: ImageIcon,
    bgColor: "bg-purple-100",
    textColor: "text-purple-600"
  },
  {
    title: "Mappa dei Ricordi",
    description: "Segnate sulla mappa i luoghi magici che hanno fatto da sfondo alla vostra storia.",
    icon: MapPin,
    bgColor: "bg-rose-100",
    textColor: "text-rose-600"
  },
  {
    title: "I Nostri Cuccioli",
    description: "Uno spazio speciale dedicato ai vostri piccoli amici a quattro zampe.",
    icon: PawPrint,
    bgColor: "bg-amber-100",
    textColor: "text-amber-600"
  }
];
