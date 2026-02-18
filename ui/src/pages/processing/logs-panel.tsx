import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Process } from './processing-page';
import { useMemo } from 'react';

export default function LogsPanel({ process }: { process: Process }) {
  const allLogs = useMemo(() => {
    return [];
  }, [process]);

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="text-sm font-medium">Логи процесса</div>
        <ScrollArea className="h-40 rounded-xl bg-muted p-3 text-xs">
          {allLogs.length === 0 ? 'Нет логов' : allLogs.map((log, i) => <div key={i}>{log}</div>)}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
