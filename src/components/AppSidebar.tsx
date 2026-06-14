import {
  LayoutDashboard, Users, BookOpen, ClipboardList, Trophy, User,
  BarChart3, Settings, LogOut, GraduationCap, Gamepad2, Zap, Upload, Database
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const menuItems: Record<UserRole, { title: string; url: string; icon: any }[]> = {
  guru: [
    { title: "Dashboard", url: "/guru", icon: LayoutDashboard },
    { title: "Murid", url: "/guru/murid", icon: Users },
    { title: "Materi", url: "/guru/materi", icon: BookOpen },
    { title: "Quiz", url: "/guru/quiz", icon: ClipboardList },
    { title: "Cerdas Cermat", url: "/guru/cerdas-cermat", icon: Zap },
    { title: "Bank Soal CC", url: "/guru/soal-cerdas-cermat", icon: BookOpen },
    { title: "Progres", url: "/guru/progres", icon: BarChart3 },
  ],
  murid: [
    { title: "Dashboard", url: "/murid", icon: LayoutDashboard },
    { title: "Materi", url: "/murid/materi", icon: BookOpen },
    { title: "Quiz", url: "/murid/quiz", icon: ClipboardList },
    { title: "Cerdas Cermat", url: "/murid/cerdas-cermat", icon: Zap },
    { title: "Leaderboard", url: "/murid/leaderboard", icon: Trophy },
    { title: "Progres", url: "/murid/progres", icon: BarChart3 },
    { title: "Profil", url: "/murid/profil", icon: User },
  ],
  admin: [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Database", url: "/admin/database", icon: Database },
    { title: "Guru", url: "/admin/guru", icon: GraduationCap },
    { title: "Murid", url: "/admin/murid", icon: Users },
    { title: "Materi", url: "/admin/materi", icon: BookOpen },
    { title: "Quiz", url: "/admin/quiz", icon: ClipboardList },
    { title: "Cerdas Cermat", url: "/admin/cerdas-cermat", icon: Zap },
    { title: "Pengaturan", url: "/admin/pengaturan", icon: Settings },
  ],
};

const roleLabels: Record<UserRole, string> = {
  guru: "Panel Guru",
  murid: "Panel Murid",
  admin: "Panel Admin",
};

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  if (!user) return null;

  const items = menuItems[user.role];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-primary" />
              {!collapsed && <span className="font-display text-lg font-bold text-foreground">EduQuest</span>}
            </div>
          </SidebarGroupLabel>
          {!collapsed && user.role === "murid" && (
            <div className="px-4 pb-3">
              <p className="text-xs text-muted-foreground">Murid Dashboard</p>
            </div>
          )}
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{!collapsed && roleLabels[user.role]}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === `/${user.role}`}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed && (
          <div className="px-2 pb-2">
            <p className="text-sm font-medium truncate">{user.nama}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
        <Button variant="ghost" size="sm" className="w-full justify-start text-destructive" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && "Keluar"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
