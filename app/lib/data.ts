/* ===================== */
/* Data Layer */
/* One entry point for every read and write. In demo mode the calls go to
   the browser store; otherwise to Supabase, exactly as before.
*/
/* ===================== */

import { supabase } from "./supabase";
import { demoStore, isDemoMode } from "./demo";
import type { Budget, NewTransaction, Transaction } from "./types";

/** `not_authenticated` lets callers keep their specific login messages. */
export type Result = { error: null | "not_authenticated" | "failed" };

const ok: Result = { error: null };

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/* ===================== */
/* Transactions */
/* ===================== */

export async function listTransactions(): Promise<Transaction[]> {
  if (isDemoMode()) return demoStore.listTransactions();

  const userId = await currentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  return error ? [] : ((data as Transaction[]) ?? []);
}

export async function addTransactions(rows: NewTransaction[]): Promise<Result> {
  if (isDemoMode()) {
    demoStore.addTransactions(rows);
    return ok;
  }

  const userId = await currentUserId();
  if (!userId) return { error: "not_authenticated" };

  const { error } = await supabase
    .from("transactions")
    .insert(rows.map((row) => ({ ...row, user_id: userId })));

  return error ? { error: "failed" } : ok;
}

export async function updateTransaction(
  id: number,
  fields: Omit<Transaction, "id">,
): Promise<Result> {
  if (isDemoMode()) {
    demoStore.updateTransaction(id, fields);
    return ok;
  }

  const { error } = await supabase.from("transactions").update(fields).eq("id", id);
  return error ? { error: "failed" } : ok;
}

export async function deleteTransaction(id: number): Promise<Result> {
  if (isDemoMode()) {
    demoStore.deleteTransaction(id);
    return ok;
  }

  const { error } = await supabase.from("transactions").delete().eq("id", id);
  return error ? { error: "failed" } : ok;
}

/* ===================== */
/* Budgets */
/* ===================== */

export async function listBudgets(): Promise<{ data: Budget[]; error: boolean }> {
  if (isDemoMode()) return { data: demoStore.listBudgets(), error: false };

  const userId = await currentUserId();
  if (!userId) return { data: [], error: false };

  const { data, error } = await supabase.from("budgets").select("*").eq("user_id", userId);
  return { data: (data as Budget[]) ?? [], error: Boolean(error) };
}

export async function addBudget(category: string, amount: number): Promise<Result> {
  if (isDemoMode()) {
    demoStore.addBudget(category, amount);
    return ok;
  }

  const userId = await currentUserId();
  if (!userId) return { error: "not_authenticated" };

  const { error } = await supabase.from("budgets").insert([{ category, amount, user_id: userId }]);
  return error ? { error: "failed" } : ok;
}

export async function deleteBudget(id: string): Promise<Result> {
  if (isDemoMode()) {
    demoStore.deleteBudget(id);
    return ok;
  }

  const { error } = await supabase.from("budgets").delete().eq("id", id);
  return error ? { error: "failed" } : ok;
}
