import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export interface User {
  id: string;
  email: string;
  nama: string;
  role: "guru" | "murid" | "admin";
  created_at: string;
  xp?: number;
  level?: number;
  streak?: number;
}

// Login user
export async function loginUser(email: string, password: string, role: "guru" | "murid" | "admin") {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .eq("role", role)
      .single();

    if (error || !data) {
      throw new Error("Email atau password salah");
    }

    return data as User;
  } catch (err) {
    throw err;
  }
}

// Register user baru
export async function registerUser(email: string, password: string, nama: string, role: "guru" | "murid" | "admin") {
  try {
    const { data, error } = await supabase
      .from("users")
      .insert([{ email, password, nama, role }])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as User;
  } catch (err) {
    throw err;
  }
}

// Get user by ID
export async function getUserById(id: string) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as User;
  } catch (err) {
    throw err;
  }
}

// Get all users by role
export async function getUsersByRole(role: "guru" | "murid" | "admin") {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", role);

    if (error) {
      throw new Error(error.message);
    }

    return data as User[];
  } catch (err) {
    throw err;
  }
}

// Update user
export async function updateUser(id: string, updates: Partial<UserUpdate>) {
  try {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as User;
  } catch (err) {
    throw err;
  }
}

// Delete user
export async function deleteUser(id: string) {
  try {
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  } catch (err) {
    throw err;
  }
}
