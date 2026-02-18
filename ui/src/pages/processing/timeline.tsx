import { type FC } from 'react';
import type { Process } from './processing-page';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface TimelineProps {
  stages: Process['stages'];
}

export const Timeline: FC<TimelineProps> = ({ stages }) => {
  const renderStageIcon = (status: string) => {
    if (status === 'success') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (status === 'running') return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    if (status === 'error') return <AlertCircle className="w-4 h-4 text-red-500" />;
    return <div className="w-3 h-3 rounded-full bg-gray-300" />;
  };

  return (
    <div className="flex flex-wrap gap-3 mt-3">
      {Object.entries(stages).map(([stage, data]) => (
        <div key={stage} className="flex items-center gap-1 text-xs text-muted-foreground">
          {renderStageIcon(data.status)}
          <span>{stage}</span>
        </div>
      ))}
    </div>
  );
};
