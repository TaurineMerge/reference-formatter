import { useState, useMemo } from 'react';
import { FamilySelector } from './family-selector';
import { ProcessCard } from './process-card';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';

const TEMPLATE_FAMILIES: Record<string, any> = {
  gost2008: {
    name: 'ГОСТ 2008',
    presets: {
      book: 'Книга: {{author}} {{title}} — {{year}}.',
      journal: 'Статья: {{author}} «{{title}}» // {{journal}}. {{year}}.',
      web: 'Интернет-ресурс: {{title}} — URL: {{url}} (дата обращения: {{accessDate}}).',
    },
  },
  apa: {
    name: 'APA',
    presets: {
      book: '{{author}} ({{year}}). {{title}}.',
      journal: '{{author}} ({{year}}). {{title}}. {{journal}}.',
      web: '{{author}} ({{year}}). {{title}}. Retrieved from {{url}}',
    },
  },
};

const DEFAULT_FAMILY = 'gost2008';

type StageStatus = 'pending' | 'running' | 'success' | 'error';

export type Process = {
  id: string;
  name: string;
  stages: Record<string, { status: StageStatus; logs: string[] }>;
  json: string;
  formatted: string;
  templateOverride?: string;
};

const createMockProcess = (id: string, name: string, type: string): Process => ({
  id,
  name,
  stages: {
    Инициализация: { status: 'success', logs: ['Процесс создан'] },
    'Анализ структуры': { status: 'running', logs: ['Запрос к API...'] },
    Транслитерация: { status: 'pending', logs: [] },
    'Формирование JSON': { status: 'pending', logs: [] },
    'Форматирование по шаблону': { status: 'pending', logs: [] },
  },
  json: JSON.stringify(
    {
      type,
      author: 'Иванов И.И.',
      title: name,
      year: '2024',
      journal: 'Научный журнал',
      url: 'https://example.com',
      accessDate: '01.01.2026',
    },
    null,
    2
  ),
  formatted: '',
});

export default function ProcessingPage() {
  const [family, setFamily] = useState<string>(DEFAULT_FAMILY);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [processes, setProcesses] = useState<Process[]>([
    createMockProcess('p1', 'Книга 1', 'book'),
    createMockProcess('p2', 'Статья 1', 'journal'),
    createMockProcess('p3', 'Сайт 1', 'web'),
  ]);

  const onUpdateProcess = (updated: Process) => {
    setProcesses((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  // Авто-форматирование всех процессов
  const processesWithFormatted = useMemo(() => {
    return processes.map((process) => {
      let parsed: any = {};
      try {
        parsed = JSON.parse(process.json);
      } catch {}
      const presets = TEMPLATE_FAMILIES[family].presets;
      const template = process.templateOverride || (parsed.type ? presets[parsed.type] : '');
      let formatted = '';
      let status: StageStatus = 'error';
      try {
        if (template) {
          formatted = template.replace(
            /{{(.*?)}}/g,
            (_: string, key: string) => parsed[key.trim()] ?? ''
          );
          status = 'success';
        }
      } catch {}
      return {
        ...process,
        formatted,
        stages: {
          ...process.stages,
          'Форматирование по шаблону': { ...process.stages['Форматирование по шаблону'], status },
        },
      };
    });
  }, [processes, family]);

  const totalFormattedResult = useMemo(
    () =>
      processesWithFormatted
        .map((p) => p.formatted)
        .filter(Boolean)
        .join('\n'),
    [processesWithFormatted]
  );

  const copyToClipboard = async () => {
    if (!totalFormattedResult) return;
    await navigator.clipboard.writeText(totalFormattedResult);
  };

  return (
    <div className="p-4 sm:p-6 w-full max-w-5xl mx-auto space-y-6">
      <h1 className="text-xl sm:text-2xl font-semibold">Processes</h1>

      <FamilySelector family={family} setFamily={setFamily} families={TEMPLATE_FAMILIES} />

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Общий результат</div>
            <Button
              size="sm"
              variant="outline"
              onClick={copyToClipboard}
              disabled={!totalFormattedResult}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" /> Копировать
            </Button>
          </div>
          <ScrollArea className="h-32 rounded-xl bg-muted p-3 text-xs whitespace-pre-wrap">
            {totalFormattedResult || 'Нет данных'}
          </ScrollArea>
        </CardContent>
      </Card>

      {processesWithFormatted.map((p) => (
        <ProcessCard
          key={p.id}
          process={p}
          family={family}
          templateFamilies={TEMPLATE_FAMILIES}
          onUpdateProcess={onUpdateProcess}
          expanded={expandedId === p.id}
          onToggleExpand={() => setExpandedId(expandedId === p.id ? null : p.id)}
        />
      ))}
    </div>
  );
}
