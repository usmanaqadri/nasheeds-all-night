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

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  let newWindow;

  if (isIOS) {
    newWindow = window.open();
    if (!newWindow) {
      alert("Please allow popups to view the PDF");
      return;
    }
  }

  try {
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

    if (isIOS) {
      newWindow.location.href = url;
    } else {
      const link = document.createElement("a");
      link.href = url;
      link.download = `${cleanedEnglishTitle}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("PDF download failed", err);
    if (isIOS && newWindow) {
      newWindow.close(); // close empty tab if fetch fails
    }
  }
};
