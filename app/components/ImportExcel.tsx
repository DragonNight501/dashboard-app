"use client";

import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

type Props = {
  fetchData: () => Promise<void>;
};

export default function ImportExcel({ fetchData }: Props) {
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("Please upload a valid Excel file");
      return;
    }

    const reader = new FileReader();

    reader.onload = async (loadEvent) => {
      try {
        const data = new Uint8Array(loadEvent.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        if (!jsonData.length) {
          toast.error("The file is empty");
          return;
        }

        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;

        if (!user) {
          toast.error("User not authenticated");
          return;
        }

        const formattedData = jsonData.map((row) => {
          const rawAmount = Number(row.amount || row.price || 0);

          return {
            date:
              String(row.date || "").trim() ||
              new Date().toISOString().split("T")[0],
            type: rawAmount >= 0 ? "Income" : "Expenses",
            description:
              String(row.description || row.name || row.product || "").trim() ||
              "Auto-generated",
            amount: Math.abs(rawAmount),
            category: String(row.category || "").trim() || "General",
            status: String(row.status || "").trim() || "Completed",
            user_id: user.id,
          };
        });

        const { error } = await supabase
          .from("transactions")
          .insert(formattedData);

        if (error) {
          toast.error("Failed to import data");
          return;
        }

        toast.success("Data imported successfully");
        await fetchData();
      } catch (error) {
        console.error("Import error:", error);
        toast.error("Error processing file");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="importSection">
      <label className="importBtn">
        Import Excel
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          hidden
        />
      </label>
    </div>
  );
}