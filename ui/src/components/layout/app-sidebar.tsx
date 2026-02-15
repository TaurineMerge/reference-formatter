import { useNavigate, useLocation } from 'react-router';
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
import { Cpu, Database, Settings, TextCursorInput } from 'lucide-react';

const navigationItems = [
  {
    label: 'Entries',
    icon: TextCursorInput,
    path: '/entries',
  },
  {
    label: 'Processing',
    icon: Cpu,
    path: '/processing',
  },
  {
    label: 'Databases',
    icon: Database,
    path: '/databases',
  },
  {
    label: 'Settings',
    icon: Settings,
    path: '/settings',
  },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

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
            {navigationItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  className="cursor-pointer"
                  onClick={() => navigate(item.path)}
                  isActive={location.pathname === item.path}
                >
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
