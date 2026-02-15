import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import Header from './header';
import { ScrollArea } from '../ui/scroll-area';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-col h-screen w-full">
        <ScrollArea>
          <Header />
          <main className="w-full overflow-y-auto overflow-x-hidden">{children}</main>
        </ScrollArea>
      </div>
    </SidebarProvider>
  );
}
