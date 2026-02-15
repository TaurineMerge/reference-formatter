import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizontal } from 'lucide-react';

export default function InputPage() {
  return (
    <section className="w-full flex flex-col items-center gap-8 mt-[25vh]">
      <div>
        <p className="text-5xl font-bold">Format your references</p>
      </div>
      <Card className="w-1/2 flex flex-col items-center gap-4 p-4">
        <CardContent className="w-full p-0">
          <Textarea
            placeholder="Paste your entries here"
            className="resize-none overflow-y-auto max-h-64 w-full outline-none border-none focus-visible:ring-0"
          />
        </CardContent>
        <CardFooter className="w-full flex justify-end">
          <Button variant="outline" className="cursor-pointer">
            <SendHorizontal />
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
}
