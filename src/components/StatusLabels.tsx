import React from 'react';
import { motion } from 'motion/react';

interface MetricProps {
  label: string;
  value: number;
  color?: string;
}

const Metric: React.FC<MetricProps> = ({ label, value, color = "white" }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-sm uppercase tracking-widest text-white/40">
      <span>{label}</span>
      <span>{Math.round(value * 100)}%</span>
    </div>
    <div className="h-1 bg-white/5 w-full relative overflow-hidden">
      <motion.div 
        className="h-full bg-white"
        initial={{ width: 0 }}
        animate={{ width: `${value * 100}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  </div>
);

interface StatusLabelsProps {
  metrics: {
    stupidity: number;
    conformity: number;
    polarization: number;
  };
  labels: string[];
}

export const StatusLabels: React.FC<StatusLabelsProps> = ({ metrics, labels }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <Metric label="Stupidity_Index" value={metrics.stupidity} />
        <Metric label="Blind_Conformity" value={metrics.conformity} />
        <Metric label="Polarization_Level" value={metrics.polarization} />
      </div>

      <div className="space-y-2">
        <div className="text-xs uppercase tracking-[0.2em] text-white/40 font-bold">Active_Labels</div>
        <div className="flex flex-wrap gap-2">
          {labels.map((label, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="px-2 py-1 border border-white/20 text-md uppercase font-bold bg-white/5 hover:bg-white hover:text-black transition-colors cursor-default"
            >
              {label}
            </motion.span>
          ))}
          {labels.length === 0 && (
            <span className="text-md text-white/50 italic">No labels assigned yet. Speak, human.</span>
          )}
        </div>
      </div>
    </div>
  );
};
