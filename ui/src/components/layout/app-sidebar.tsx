import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Database, Settings } from 'lucide-react';

const navigationItems = [
  {
    label: 'Databases',
    icon: Database,
    onClick: () => alert('Databases clicked'),
  },
  {
    label: 'Settings',
    icon: Settings,
    onClick: () => alert('Settings clicked'),
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex justify-start items-center w-full h-full p-1">
              <h1 className="text-2xl font-bold text-foreground">
                <span className="text-accent">Ref</span>ormer
              </h1>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navigationItems.map((item, index) => (
              <SidebarMenuItem key={index}>
                <SidebarMenuButton className="cursor-pointer" onClick={item.onClick}>
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
