import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizontal } from 'lucide-react';

export default function InputPage() {
  return (
    <section className="w-full min-h-full flex flex-col items-center gap-8">
      <div>
        <p className="text-5xl font-bold">Format your references</p>
      </div>
      <Card className="w-1/2 shadow-accent hover:shadow-accent-hover">
        <CardContent className="w-full px-4 py-0 flex flex-row items-end">
          <Textarea
            placeholder="Paste your entries here"
            className="resize-none overflow-y-auto max-h-64 min-h-0 w-full outline-none border-none shadow-none focus-visible:ring-0 bg-transparent dark:bg-transparent dark:border-none dark:focus-visible:ring-0"
          />
          <Button variant="secondary" className="cursor-pointer">
            <SendHorizontal />
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
