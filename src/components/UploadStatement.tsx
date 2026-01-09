import { addTransaction } from "@/services/transactionService";
import { categorizeTransaction } from "@/utils/categorize";
import Papa from "papaparse";
import { forwardRef, useState } from "react";
import { toast } from "sonner";

interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  category: string;
}

// Common CSV column name mappings
const COLUMN_MAPPINGS = {
  date: ["date", "transaction_date", "txn_date", "trans_date", "value_date", "posting_date", "Date"],
  description: ["description", "narration", "particulars", "details", "remarks", "transaction_description", "desc", "Description"],
  amount: ["amount", "debit", "withdrawal", "transaction_amount", "txn_amount", "value", "Amount"],
  credit: ["credit", "deposit", "credit_amount"],
};

// Find matching column from CSV headers
const findColumn = (headers: string[], possibleNames: string[]): string | null => {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  for (const name of possibleNames) {
    const index = normalizedHeaders.indexOf(name.toLowerCase());
    if (index !== -1) {
      return headers[index];
    }
  }
  return null;
};

// Parse various date formats
const parseDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  
  // Try ISO format first (2026-03-01)
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) return isoDate;
  
  // Try DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = dateStr.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Try MM/DD/YYYY
  const mmddyyyy = dateStr.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (mmddyyyy) {
    const [, month, day, year] = mmddyyyy;
    const fullYear = year.length === 2 ? 2000 + parseInt(year) : parseInt(year);
    return new Date(fullYear, parseInt(month) - 1, parseInt(day));
  }
  
  return new Date();
};

// Parse amount (handle negative, currency symbols, commas)
const parseAmount = (amountStr: string | number): number => {
  if (typeof amountStr === "number") return Math.abs(amountStr);
  if (!amountStr) return 0;
  
  // Remove currency symbols and commas
  const cleaned = amountStr
    .replace(/[₹$€£,]/g, "")
    .replace(/\s/g, "")
    .trim();
  
  const amount = parseFloat(cleaned);
  return isNaN(amount) ? 0 : Math.abs(amount);
};

interface UploadStatementProps {
  onUploadComplete?: (count: number) => void;
}

const UploadStatement = forwardRef<HTMLInputElement, UploadStatementProps>(
  ({ onUploadComplete }, ref) => {
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.name.toLowerCase().endsWith(".csv")) {
        toast.error("Please upload a CSV file");
        return;
      }

      setUploading(true);
      toast.info("Processing your statement...");

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: async (result) => {
          try {
            const headers = result.meta.fields || [];
            
            // Find column mappings
            const dateCol = findColumn(headers, COLUMN_MAPPINGS.date);
            const descCol = findColumn(headers, COLUMN_MAPPINGS.description);
            const amountCol = findColumn(headers, COLUMN_MAPPINGS.amount);
            const creditCol = findColumn(headers, COLUMN_MAPPINGS.credit);

            if (!dateCol && !descCol && !amountCol) {
              toast.error("Could not identify CSV columns. Expected: date, description, amount");
              setUploading(false);
              return;
            }

            const transactions: ParsedTransaction[] = [];
            let skippedRows = 0;

            for (const row of result.data as Record<string, any>[]) {
              // Get values using found columns or fallback to direct property access
              const dateValue = dateCol ? row[dateCol] : row.date || row.Date;
              const descValue = descCol ? row[descCol] : row.description || row.Description || row.narration;
              let amountValue = amountCol ? row[amountCol] : row.amount || row.Amount;
              
              // If there's a credit column, use it if amount is empty/zero
              if (creditCol && row[creditCol] && (!amountValue || parseAmount(amountValue) === 0)) {
                amountValue = row[creditCol];
              }

              // Skip rows with missing essential data
              if (!descValue || (!amountValue && amountValue !== 0)) {
                skippedRows++;
                continue;
              }

              const amount = parseAmount(amountValue);
              if (amount === 0) {
                skippedRows++;
                continue;
              }

              const description = String(descValue).trim();
              const category = categorizeTransaction(description);
              const date = parseDate(String(dateValue));

              transactions.push({
                date,
                description,
                amount,
                category,
              });
            }

            if (transactions.length === 0) {
              toast.error("No valid transactions found in the CSV file");
              setUploading(false);
              return;
            }

            // Add transactions to Firestore
            let successCount = 0;
            let errorCount = 0;

            for (const tx of transactions) {
              try {
                await addTransaction({
                  amount: tx.amount,
                  category: tx.category,
                  description: tx.description,
                  createdAt: tx.date,
                });
                successCount++;
              } catch (error) {
                console.error("Failed to add transaction:", error);
                errorCount++;
              }
            }

            // Show results
            if (successCount > 0) {
              toast.success(`Successfully imported ${successCount} transactions!`);
            }
            if (errorCount > 0) {
              toast.warning(`${errorCount} transactions failed to import`);
            }
            if (skippedRows > 0) {
              toast.info(`${skippedRows} rows were skipped (missing data)`);
            }

            // Callback and refresh
            onUploadComplete?.(successCount);
            
            // Reset file input
            if (e.target) {
              e.target.value = "";
            }

            // Refresh the page to show new data
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } catch (error) {
            console.error("CSV parsing error:", error);
            toast.error("Failed to parse CSV file. Please check the format.");
          } finally {
            setUploading(false);
          }
        },
        error: (error) => {
          console.error("Papa parse error:", error);
          toast.error("Failed to read the CSV file");
          setUploading(false);
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
        disabled={uploading}
      />
    );
  }
);

UploadStatement.displayName = "UploadStatement";

export default UploadStatement;
