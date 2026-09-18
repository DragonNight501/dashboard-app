export type Transaction = {
  id: number;
  date: string;
  type: string;
  description: string;
  amount: number;
  category: string;
  status: string;
  user_id: string;
};

export type NewTransaction = Omit<Transaction, "id" | "user_id">;

export type Budget = {
  id: string;
  category: string;
  amount: number;
};
