import { useAuth } from "@/contexts/AuthContext";
import LoginPage from "./LoginPage";
import { Navigate } from "react-router-dom";

export default function Index() {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) return <LoginPage />;
  
  return <Navigate to={`/${user!.role}`} replace />;
}
