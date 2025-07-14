import { baseURL } from "./constants";

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

  const response = await fetch(`${baseURL}/nasheed/generate-pdf`, {
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

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  if (isIOS) {
    // Open in a new tab for Safari
    const newWindow = window.open();
    if (newWindow) {
      newWindow.location.href = url;
    } else {
      alert("Please allow popups to view the PDF");
    }
  } else {
    // Trigger direct download
    const link = document.createElement("a");
    link.href = url;
    link.download = `${cleanedEnglishTitle}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  window.URL.revokeObjectURL(url); // Clean up
};
