import { addTransaction } from "@/services/transactionService";

const UploadStatement = () => {
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    const rows = text.split("\n").slice(1); // skip header

    for (const row of rows) {
      if (!row.trim()) continue;

      const [date, description, amount, category] = row.split(",");

      if (!amount || !category) continue;

      await addTransaction({
        amount: Number(amount),
        category: category.trim(),
        createdAt: new Date(date),
        month: new Date(date).toLocaleString("en-US", { month: "short" }),
      });
    }

    alert("Statement uploaded successfully 🚀");
  };

  return (
    <>
      <input
        type="file"
        accept=".csv"
        onChange={handleUpload}
        className="hidden"
        id="uploadStatement"
      />
    </>
  );
};

export default UploadStatement;
