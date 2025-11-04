interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ScoreGauge({ score, size = 'md', showLabel = true }: ScoreGaugeProps) {
  const getColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStrokeColor = (score: number) => {
    if (score >= 80) return '#16a34a'; // green-600
    if (score >= 60) return '#ca8a04'; // yellow-600
    if (score >= 40) return '#ea580c'; // orange-600
    return '#dc2626'; // red-600
  };

  const sizes = {
    sm: { width: 80, height: 80, strokeWidth: 6, fontSize: 'text-xl' },
    md: { width: 120, height: 120, strokeWidth: 8, fontSize: 'text-3xl' },
    lg: { width: 160, height: 160, strokeWidth: 10, fontSize: 'text-4xl' }
  };

  const { width, height, strokeWidth, fontSize } = sizes[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width, height }}>
        <svg width={width} height={height} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={width / 2}
            cy={height / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={width / 2}
            cy={height / 2}
            r={radius}
            stroke={getStrokeColor(score)}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${fontSize} font-bold ${getColor(score)}`}>
            {score}
          </span>
        </div>
      </div>
      {showLabel && (
        <span className="mt-2 text-sm font-medium text-gray-600">Overall Score</span>
      )}
    </div>
  );
}
