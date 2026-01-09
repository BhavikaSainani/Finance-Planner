import { addTransaction } from "@/services/transactionService";
import Papa from "papaparse";
import { forwardRef } from "react";

const categorizeTransaction = (description: string) => {
  const d = description.toLowerCase();

  if (d.includes("swiggy") || d.includes("zomato")) return "Food & Dining";
  if (d.includes("uber") || d.includes("ola")) return "Transportation";
  if (d.includes("netflix") || d.includes("prime")) return "Entertainment";
  if (d.includes("electricity") || d.includes("bill")) return "Utilities";
  if (d.includes("bazaar") || d.includes("mart")) return "Shopping";

  return "Shopping";
};

const UploadStatement = forwardRef<HTMLInputElement>((_, ref) => {
  const handleFileUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        for (const row of result.data as any[]) {
          await addTransaction({
            amount: Number(row.amount),
            category: categorizeTransaction(row.description),
            description: row.description,
            createdAt: new Date(row.date),
          });
        }

        alert("Statement uploaded successfully!");
        window.location.reload(); // refresh dashboard
      },
    });
  };

  return (
    <input
      type="file"
      accept=".csv"
      ref={ref}
      hidden
      onChange={handleFileUpload}
    />
  );
});

export default UploadStatement;
