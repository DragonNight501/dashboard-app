import { supabase } from "./supabase";

export const getSession = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
};

export const getUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user;
};

export const login = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return error;
};

export const signup = async (email: string, password: string) => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  return error;
};

export const logout = async () => {
  await supabase.auth.signOut();
};