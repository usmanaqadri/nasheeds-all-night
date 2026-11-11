import { baseURL } from "./constants";
import unidecode from "unidecode";

export const generatePDF = async (resource) => {
  if (!resource?._id)
    throw new Error("Save the nasheed or slideshow before exporting.");
  const type = resource.type === "slideshow" ? "slideshow" : "nasheed";
  const response = await fetch(`${baseURL}/nasheedV2/generate-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Add your application's existing auth credentials/header if required.
    body: JSON.stringify({
      type,
      id: resource._id,
      ...(type === "slideshow" && resource.arrangedBy
        ? { arrangedBy: resource.arrangedBy }
        : {}),
    }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "PDF generation failed");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = `${unidecode(resource.engTitle || resource.title || type)}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
};
