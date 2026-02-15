import { SidebarTrigger } from '../ui/sidebar';
import { ThemeToggle } from '../ui/theme-toggle';

export default function Header() {
  return (
    <header className="w-full h-16 p-8">
      <div className="flex justify-between items-center gap-4 w-full">
        <SidebarTrigger />
        <div className="flex justify-center items-center">
          <h1 className="text-4xl font-bold text-foreground">Reference Formatter</h1>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
