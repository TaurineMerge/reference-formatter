import { useState, useEffect, type FC } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import type { Process } from './processing-page';
import LogsPanel from './logs-panel';
import { FormattedResult } from './formatted-result';
import { Timeline } from './timeline';

interface ProcessCardProps {
  process: Process;
  family: string;
  templateFamilies: Record<string, any>;
  onUpdateProcess: (updated: Process) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}

export const ProcessCard: FC<ProcessCardProps> = ({
  process,
  family,
  templateFamilies,
  onUpdateProcess,
  expanded,
  onToggleExpand,
}) => {
  const [parsedJson, setParsedJson] = useState<any>({});

  useEffect(() => {
    try {
      setParsedJson(JSON.parse(process.json));
    } catch {
      setParsedJson({});
    }
  }, [process.json]);

  const resolveTemplate = () => {
    if (process.templateOverride) return process.templateOverride;
    const presets = templateFamilies[family]?.presets || {};
    return parsedJson.type ? presets[parsedJson.type] : '';
  };

  useEffect(() => {
    try {
      const template = resolveTemplate();
      if (!template) throw new Error();
      const formatted = template.replace(
        /{{(.*?)}}/g,
        (_: string, key: string) => parsedJson[key.trim()] ?? ''
      );
      onUpdateProcess({
        ...process,
        formatted,
        stages: {
          ...process.stages,
          'Форматирование по шаблону': {
            ...process.stages['Форматирование по шаблону'],
            status: 'success',
          },
        },
      });
    } catch {
      onUpdateProcess({
        ...process,
        formatted: '',
        stages: {
          ...process.stages,
          'Форматирование по шаблону': {
            ...process.stages['Форматирование по шаблону'],
            status: 'error',
          },
        },
      });
    }
  }, [process.json, process.templateOverride, family]);

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-center cursor-pointer" onClick={onToggleExpand}>
          <span className="font-medium">{process.name}</span>
          <ChevronDown className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>

        <Timeline stages={process.stages} />

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-6 space-y-6"
            >
              <LogsPanel process={process} />
              <Textarea
                value={process.json}
                onChange={(e) => onUpdateProcess({ ...process, json: e.target.value })}
                className="min-h-[160px] font-mono text-sm"
              />
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  Автоматический шаблон ({parsedJson.type || 'unknown'}):
                </div>
                <div className="text-xs font-mono bg-muted p-2 rounded-xl">
                  {resolveTemplate() || 'Не найден'}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Переопределить шаблон</div>
                <Input
                  value={process.templateOverride ?? ''}
                  onChange={(e) =>
                    onUpdateProcess({ ...process, templateOverride: e.target.value || undefined })
                  }
                  placeholder="Введите кастомный шаблон или оставьте пустым"
                />
              </div>
              <FormattedResult value={process.formatted} />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
