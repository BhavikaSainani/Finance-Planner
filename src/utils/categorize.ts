export const detectCategory = (description: string) => {
  const text = description.toLowerCase();

  if (text.includes("swiggy") || text.includes("zomato")) return "Food & Dining";
  if (text.includes("uber") || text.includes("ola")) return "Transportation";
  if (text.includes("netflix") || text.includes("prime")) return "Entertainment";
  if (text.includes("amazon") || text.includes("flipkart")) return "Shopping";
  if (text.includes("electricity") || text.includes("water")) return "Utilities";

  return "Other";
};
