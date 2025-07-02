const baseURL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3001/api/v1/nasheed"
    : "/api/v1/nasheed";

export const generatePDF = async (
  arabTitle,
  engTitle,
  arabicArray,
  englishArray,
  transliterationArray
) => {
  const cleanedArabicTitle = arabTitle.replace(/\r/g, "").trim();
  const cleanedEnglishTitle = engTitle.replace(/\r/g, "").trim();
  const cleanedArabicArray = arabicArray.map((str) =>
    str.replace(/\r/g, "").trim()
  );
  const cleanedEnglishArray = englishArray.map((str) =>
    str.replace(/\r/g, "").trim()
  );
  const cleanedTransliterationArray = transliterationArray.map((str) =>
    str.replace(/\r/g, "").trim()
  );

  const response = await fetch(`${baseURL}/generate-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      arabicTitle: cleanedArabicTitle,
      engTitle: cleanedEnglishTitle,
      arabicArray: cleanedArabicArray,
      englishArray: cleanedEnglishArray,
      transliterationArray: cleanedTransliterationArray,
    }),
  });

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${cleanedEnglishTitle}.pdf`;
  link.click();
};
