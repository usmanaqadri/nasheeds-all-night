import { baseURL } from "./constants";

export async function createLiveSession(slideshowId, token) {
  const response = await fetch(`${baseURL}/live-session/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ slideshowId }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create live session.");
  }

  return data.sessionId;
}
