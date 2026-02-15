import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import Header from './header';
import { ScrollArea } from '../ui/scroll-area';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex-1 min-h-0">
        <Header />
        <ScrollArea>
          <main className="min-h-[calc(100vh-24rem)] flex items-center justify-center">
            {children}
          </main>
        </ScrollArea>
      </div>
    </SidebarProvider>
  );
}
