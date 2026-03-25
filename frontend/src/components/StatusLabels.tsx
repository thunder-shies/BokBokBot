import { type FC } from 'react';

interface Metrics {
  stupidity: number;
  conformity: number;
  polarization: number;
}

interface StatusLabelsProps {
  metrics: Metrics;
  labels: string[];
}

interface MetricProps {
  label: string;
  value: number;
}

const Metric: FC<MetricProps> = ({ label, value }) => {
  const safeValue = Math.max(0, Math.min(value, 1));

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/50">
        <span>{label}</span>
        <span>{Math.round(safeValue * 100)}%</span>
      </div>
      <div className="h-1.5 bg-white/10 w-full overflow-hidden">
        <div
          className="h-full bg-white transition-all duration-700"
          style={{ width: `${safeValue * 100}%` }}
        />
      </div>
    </div>
  );
};

const StatusLabels: FC<StatusLabelsProps> = ({ metrics, labels }) => {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4">
        <Metric label="Stupidity_Index" value={metrics.stupidity} />
        <Metric label="Blind_Conformity" value={metrics.conformity} />
        <Metric label="Polarization_Level" value={metrics.polarization} />
      </div>

      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">Active_Labels</div>
        <div className="flex flex-wrap gap-2">
          {labels.length > 0 ? (
            labels.map((label, index) => (
              <span
                key={`${label}-${index}`}
                className="px-2 py-1 border border-white/20 text-[10px] uppercase font-bold bg-white/5"
              >
                {label}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-white/30 italic">No labels assigned yet. Speak, human.</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusLabels;
