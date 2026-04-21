"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Intervention {
  id: string;
  event: string;
  message: string;
  time: string;
}

export default function Dashboard() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [cpu, setCpu] = useState(0);
  const [ram, setRam] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");
    
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.cpu !== undefined) setCpu(data.cpu);
      if (data.ram !== undefined) setRam(data.ram);
      
      if (data.event && data.message) {
        setInterventions((prev) => [
          {
            id: Math.random().toString(36).substring(7),
            event: data.event,
            message: data.message,
            time: data.timestamp
          },
          ...prev
        ].slice(0, 10)); // keep last 10
      }
    };

    return () => ws.close();
  }, []);

  return (
    <main className="min-h-screen p-12 flex flex-col items-center justify-start relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-rose-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="w-full max-w-5xl"
      >
        <header className="mb-12 flex justify-between items-end border-b border-white/10 pb-6">
          <div>
            <h1 className="text-4xl font-light tracking-tight text-white mb-2">The Witness</h1>
            <p className="text-zinc-400">Prakriti Monitor & Non-Dual Engine</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                {connected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${connected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              </span>
              <span className="text-sm text-zinc-400 uppercase tracking-widest">{connected ? 'Observing' : 'Disconnected'}</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard title="System CPU" value={`${cpu}%`} trend={cpu > 80 ? "Critical" : "Stable"} />
          <StatCard title="System Memory" value={`${ram}%`} trend="Stable" />
          <StatCard title="Interventions Triggered" value={interventions.length.toString()} trend="Live State" />
        </div>

        <section>
          <h2 className="text-xl font-light text-white mb-6">Live Interventions</h2>
          <div className="space-y-4">
            <AnimatePresence>
              {interventions.map((inv) => (
                <motion.div 
                  key={inv.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.5 }}
                  className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-white/20 transition-all duration-500 mb-4"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-500/0 via-rose-500/0 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-rose-400 font-mono bg-rose-500/10 px-2 py-1 rounded">{inv.event}</span>
                    <span className="text-zinc-500">{inv.time}</span>
                  </div>
                  <p className="text-xl text-zinc-200 font-light leading-relaxed">
                    "{inv.message}"
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
            {interventions.length === 0 && (
              <p className="text-zinc-500 italic">Waiting for system stress events...</p>
            )}
          </div>
        </section>
      </motion.div>
    </main>
  );
}

function StatCard({ title, value, trend }: { title: string, value: string, trend: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass-card p-6 rounded-2xl"
    >
      <h3 className="text-zinc-400 text-sm mb-2">{title}</h3>
      <div className="text-3xl font-light text-white mb-2">{value}</div>
      <div className="text-xs text-zinc-500">{trend}</div>
    </motion.div>
  );
}
