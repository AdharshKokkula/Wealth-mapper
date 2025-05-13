
/// <reference types="vite/client" />

import { Dispatch, SetStateAction, ReactNode } from 'react';

declare module '@/components/ui/sidebar' {
  export interface SidebarProps {
    className?: string;
    defaultCollapsed?: boolean;
    onCollapsedChange?: Dispatch<SetStateAction<boolean>>;
    children?: ReactNode;
  }
  
  export const Sidebar: React.FC<SidebarProps>;
  export const SidebarContent: React.FC<React.HTMLProps<HTMLDivElement>>;
  export const SidebarFooter: React.FC<React.HTMLProps<HTMLDivElement>>;
  export const SidebarHeader: React.FC<React.HTMLProps<HTMLDivElement>>;
  export const SidebarProvider: React.FC<{children: ReactNode}>;
  export const SidebarTrigger: React.FC;
  export const SidebarGroup: React.FC<React.HTMLProps<HTMLDivElement>>;
  export const SidebarGroupContent: React.FC<React.HTMLProps<HTMLDivElement>>;
  export const SidebarGroupLabel: React.FC<React.HTMLProps<HTMLDivElement>>;
  export const SidebarMenu: React.FC<React.HTMLProps<HTMLDivElement>>;
  export const SidebarMenuItem: React.FC<React.HTMLProps<HTMLDivElement>>;
  export const SidebarMenuButton: React.FC<React.HTMLProps<HTMLButtonElement> & { asChild?: boolean }>;
}
