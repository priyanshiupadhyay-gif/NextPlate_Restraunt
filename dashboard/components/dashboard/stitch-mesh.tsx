'use client'

import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'

export function StitchMesh() {
    const [nodes, setNodes] = useState<{ x: number, y: number, id: number }[]>([])
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Generate some random nodes for the mesh
        const newNodes = Array.from({ length: 12 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
        }))
        setNodes(newNodes)
    }, [])

    return (
        <div ref={containerRef} className="relative w-full h-64 bg-neutral-900 rounded-[32px] overflow-hidden border border-white/5 shadow-2xl">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'linear-gradient(rgba(56, 189, 248, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.2) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
            }} />

            <svg className="absolute inset-0 w-full h-full">
                {/* Connections (Threads) */}
                {nodes.map((node, i) => (
                    nodes.slice(i + 1, i + 4).map((target, j) => (
                        <motion.line
                            key={`line-${i}-${j}`}
                            x1={`${node.x}%`}
                            y1={`${node.y}%`}
                            x2={`${target.x}%`}
                            y2={`${target.y}%`}
                            stroke="rgba(56, 189, 248, 0.3)"
                            strokeWidth="1"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{
                                pathLength: [0, 1, 1, 0],
                                opacity: [0, 1, 1, 0],
                                stroke: ["rgba(56, 189, 248, 0.3)", "rgba(56, 189, 248, 0.8)", "rgba(56, 189, 248, 0.3)"]
                            }}
                            transition={{
                                duration: 4 + Math.random() * 4,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: Math.random() * 2
                            }}
                        />
                    ))
                ))}
            </svg>

            {/* Nodes */}
            {nodes.map((node) => (
                <motion.div
                    key={node.id}
                    className="absolute w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.8)]"
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                        duration: 2 + Math.random() * 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            ))}

            {/* Center Label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 text-center">
                    <div className="text-[10px] font-black text-sky-400 uppercase tracking-[0.3em] mb-1">Stitch AI Engine</div>
                    <div className="text-xl font-black text-white px-2">LIVE RESILIENCE MESH</div>
                </div>
            </div>

            {/* Scanning Line */}
            <motion.div
                className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-30 shadow-[0_0_15px_rgba(56,189,248,0.5)]"
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
        </div>
    )
}
