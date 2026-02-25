"use client";

export default function LoadingBar({ 
  current, 
  total, 
  label = "Loading",
  isVisible = true 
}: { 
  current: number;
  total: number;
  label?: string;
  isVisible?: boolean;
}) {
  if (!isVisible || total === 0) return null;
  
  const percentage = (current / total) * 100;

  return (
    <div className="w-full mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold app-text-secondary">
          {label} {current}/{total}
        </span>
        <span className="text-xs app-text-muted">{Math.round(percentage)}%</span>
      </div>
      <div className="w-full h-2 app-bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300 ease-out shadow-lg"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
