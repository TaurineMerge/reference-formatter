import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export function FormattedResult({ value }: { value: string }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="text-sm font-medium">Результат форматирования</div>
        <ScrollArea className="h-24 rounded-xl bg-muted p-3 text-xs whitespace-pre-wrap">
          {value ? value : 'Нет результата'}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
