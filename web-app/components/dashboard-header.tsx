
'use client'

import { motion } from 'framer-motion'
import { Infinity, Sparkles, Zap } from 'lucide-react'

export default function DashboardHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-center mb-12"
    >
      {/* Logo and Title */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <motion.div
          className="relative"
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.6 }}
        >
          <Infinity className="h-12 w-12 text-purple-400" />
          <motion.div
            className="absolute inset-0 bg-purple-400 rounded-full opacity-20"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          />
        </motion.div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
          THANOS
        </h1>
      </div>
      
      {/* Tagline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="flex items-center justify-center gap-2 mb-6"
      >
        <Sparkles className="h-5 w-5 text-yellow-400" />
        <p className="text-xl text-muted-foreground">
          Transform chaos to organized with one click
        </p>
        <Zap className="h-5 w-5 text-yellow-400" />
      </motion.div>
      
      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="text-muted-foreground max-w-2xl mx-auto leading-relaxed"
      >
        Upload your mixed files and watch as our AI-powered system automatically organizes them 
        into smart folders. Experience the power of instant file organization.
      </motion.p>
    </motion.div>
  )
}
