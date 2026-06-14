import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

import GuruDashboard from "./pages/guru/GuruDashboard";
import GuruMurid from "./pages/guru/GuruMurid";
import GuruMateri from "./pages/guru/GuruMateri";
import GuruQuiz from "./pages/guru/GuruQuiz";
import GuruProgres from "./pages/guru/GuruProgres";

import MuridDashboard from "./pages/murid/MuridDashboard";
import MuridMateri from "./pages/murid/MuridMateri";
import MuridQuiz from "./pages/murid/MuridQuiz";
import MuridLeaderboard from "./pages/murid/MuridLeaderboard";
import MuridProgres from "./pages/murid/MuridProgres";
import MuridProfil from "./pages/murid/MuridProfil";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminGuru from "./pages/admin/AdminGuru";
import AdminMurid from "./pages/admin/AdminMurid";
import AdminMateri from "./pages/admin/AdminMateri";
import AdminQuiz from "./pages/admin/AdminQuiz";
import AdminCerdasCermat from "./pages/admin/AdminCerdasCermat";
import AdminDatabase from "./pages/admin/AdminDatabase";
import AdminPengaturan from "./pages/admin/AdminPengaturan";

import GuruCerdasCermat from "./pages/cerdas-cermat/GuruCerdasCermat";
import GuruSoalCerdasCermat from "./pages/guru/GuruSoalCerdasCermat";
import MuridCerdasCermat from "./pages/cerdas-cermat/MuridCerdasCermat";

const queryClient = new QueryClient();

function ProtectedRoute({ children, role }: { children: React.ReactNode; role: string }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (user?.role !== role) return <Navigate to={`/${user?.role}`} replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />

            <Route path="/guru" element={<ProtectedRoute role="guru"><GuruDashboard /></ProtectedRoute>} />
            <Route path="/guru/murid" element={<ProtectedRoute role="guru"><GuruMurid /></ProtectedRoute>} />
            <Route path="/guru/materi" element={<ProtectedRoute role="guru"><GuruMateri /></ProtectedRoute>} />
            <Route path="/guru/quiz" element={<ProtectedRoute role="guru"><GuruQuiz /></ProtectedRoute>} />
            <Route path="/guru/progres" element={<ProtectedRoute role="guru"><GuruProgres /></ProtectedRoute>} />
            <Route path="/guru/cerdas-cermat" element={<ProtectedRoute role="guru"><GuruCerdasCermat /></ProtectedRoute>} />
            <Route path="/guru/soal-cerdas-cermat" element={<ProtectedRoute role="guru"><GuruSoalCerdasCermat /></ProtectedRoute>} />

            <Route path="/murid" element={<ProtectedRoute role="murid"><MuridDashboard /></ProtectedRoute>} />
            <Route path="/murid/materi" element={<ProtectedRoute role="murid"><MuridMateri /></ProtectedRoute>} />
            <Route path="/murid/quiz" element={<ProtectedRoute role="murid"><MuridQuiz /></ProtectedRoute>} />
            <Route path="/murid/cerdas-cermat" element={<ProtectedRoute role="murid"><MuridCerdasCermat /></ProtectedRoute>} />
            <Route path="/murid/leaderboard" element={<ProtectedRoute role="murid"><MuridLeaderboard /></ProtectedRoute>} />
            <Route path="/murid/progres" element={<ProtectedRoute role="murid"><MuridProgres /></ProtectedRoute>} />
            <Route path="/murid/profil" element={<ProtectedRoute role="murid"><MuridProfil /></ProtectedRoute>} />

            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/guru" element={<ProtectedRoute role="admin"><AdminGuru /></ProtectedRoute>} />
            <Route path="/admin/murid" element={<ProtectedRoute role="admin"><AdminMurid /></ProtectedRoute>} />
            <Route path="/admin/materi" element={<ProtectedRoute role="admin"><AdminMateri /></ProtectedRoute>} />
            <Route path="/admin/quiz" element={<ProtectedRoute role="admin"><AdminQuiz /></ProtectedRoute>} />
            <Route path="/admin/cerdas-cermat" element={<ProtectedRoute role="admin"><AdminCerdasCermat /></ProtectedRoute>} />
            <Route path="/admin/database" element={<ProtectedRoute role="admin"><AdminDatabase /></ProtectedRoute>} />
            <Route path="/admin/pengaturan" element={<ProtectedRoute role="admin"><AdminPengaturan /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
