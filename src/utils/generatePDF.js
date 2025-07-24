import { baseURL } from "./constants";

export const generatePDF = async (
  arabTitle,
  engTitle,
  arabicArray,
  englishArray,
  transliterationArray,
  footnotes
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

  const response = await fetch(`${baseURL}/nasheed/generate-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      arabicTitle: cleanedArabicTitle,
      engTitle: cleanedEnglishTitle,
      arabicArray: cleanedArabicArray,
      englishArray: cleanedEnglishArray,
      transliterationArray: cleanedTransliterationArray,
      footnotes,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Unknown PDF generation error");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${cleanedEnglishTitle}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
