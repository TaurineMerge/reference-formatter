import { Separator } from '../ui/separator';
import { SidebarTrigger } from '../ui/sidebar';
import { ThemeToggle } from '../ui/theme-toggle';

export default function Header() {
  return (
    <header className="w-full h-16 p-4">
      <div className="flex justify-start items-center gap-4 w-full h-full">
        <SidebarTrigger />
        <Separator orientation="vertical" />
        <ThemeToggle />
      </div>
    </header>
  );
}
