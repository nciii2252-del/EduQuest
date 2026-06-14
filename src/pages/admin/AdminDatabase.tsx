import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Database, Search, Download, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getUsersWithLearningStats } from "@/services/analyticsService";

interface DbUser {
  id: string;
  nama: string;
  email: string;
  role: "admin" | "murid" | "guru";
  xp?: number;
  level?: number;
  created_at: string;
  updated_at: string;
  active: boolean;
}

export default function AdminDatabase() {
  const [users, setUsers] = useState<DbUser[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "murid" | "guru">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();

    const channel = supabase
      .channel("admin-database-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, fetchUsers)
      .on("postgres_changes", { event: "*", schema: "public", table: "student_progress" }, fetchUsers)
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_scores" }, fetchUsers)
      .on("postgres_changes", { event: "*", schema: "public", table: "materi" }, fetchUsers)
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz" }, fetchUsers)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const [userRows, { data: progressRows }, { data: scoreRows }, { data: materiRows }, { data: quizRows }] =
        await Promise.all([
          getUsersWithLearningStats(),
          supabase.from("student_progress").select("murid_id, updated_at"),
          supabase.from("quiz_scores").select("murid_id, submitted_at"),
          supabase.from("materi").select("guru_id, updated_at"),
          supabase.from("quiz").select("guru_id, updated_at"),
        ]);

      const activeIds = new Set<string>();
      (progressRows || []).forEach((row: any) => {
        if (new Date(row.updated_at).getTime() >= weekAgo) activeIds.add(row.murid_id);
      });
      (scoreRows || []).forEach((row: any) => {
        if (new Date(row.submitted_at).getTime() >= weekAgo) activeIds.add(row.murid_id);
      });
      (materiRows || []).forEach((row: any) => {
        if (new Date(row.updated_at).getTime() >= weekAgo) activeIds.add(row.guru_id);
      });
      (quizRows || []).forEach((row: any) => {
        if (new Date(row.updated_at).getTime() >= weekAgo) activeIds.add(row.guru_id);
      });

      setUsers((userRows || []).map((row: any) => ({
        ...row,
        active: activeIds.has(row.id) || new Date(row.updated_at || row.created_at).getTime() >= weekAgo,
      })));
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat database user");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = `${u.nama} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? u.active : !u.active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.active).length,
    inactive: users.filter(u => !u.active).length,
    roleActive: users.filter(u => u.role !== "admin" && u.active).length,
  }), [users]);

  const exportData = () => {
    const csv = [
      ["ID", "Nama", "Email", "Role", "XP", "Level", "Status", "Tanggal Dibuat"],
      ...users.map(u => [
        u.id,
        u.nama,
        u.email,
        u.role,
        u.xp || "",
        u.level || "",
        u.active ? "Aktif" : "Tidak Aktif",
        u.created_at,
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "codequest_users.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data berhasil diekspor");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            Database Management
          </h2>
          <p className="text-muted-foreground">Kelola dan pantau semua data pengguna sistem CodeQuest</p>
        </div>
        <Button variant="outline" onClick={exportData}>
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4 shadow-card border-0">
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card className="p-4 shadow-card border-0">
          <p className="text-sm text-muted-foreground">Role Aktif</p>
          <p className="text-2xl font-bold">{stats.roleActive}</p>
        </Card>
        <Card className="p-4 shadow-card border-0">
          <p className="text-sm text-muted-foreground">User Aktif</p>
          <p className="text-2xl font-bold">{stats.active}</p>
        </Card>
        <Card className="p-4 shadow-card border-0">
          <p className="text-sm text-muted-foreground">User Tidak Aktif</p>
          <p className="text-2xl font-bold">{stats.inactive}</p>
        </Card>
      </div>

      <Card className="p-4 shadow-card border-0">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari nama atau email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Role</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="murid">Murid</SelectItem>
              <SelectItem value="guru">Guru</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Tidak Aktif</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => { setSearch(""); setRoleFilter("all"); setStatusFilter("all"); }}>
            <RefreshCw className="mr-2 h-4 w-4" /> Reset
          </Button>
        </div>
      </Card>

      <Card className="shadow-card border-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>XP/Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal Dibuat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map(user => (
              <TableRow key={user.id}>
                <TableCell className="font-semibold">{user.nama}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "guru" ? "default" : "secondary"} className="capitalize">{user.role}</Badge>
                </TableCell>
                <TableCell>
                  {user.role === "murid" ? (
                    <span>{user.xp || 0} XP - Lv.{user.level || 1}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={user.active ? "default" : "secondary"}>{user.active ? "Aktif" : "Tidak Aktif"}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(user.created_at).toLocaleDateString("id-ID")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
        ) : filteredUsers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Tidak ada data yang sesuai filter</p>
          </div>
        )}
      </Card>
    </div>
  );
}
