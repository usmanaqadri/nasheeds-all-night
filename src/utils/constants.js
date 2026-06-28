export const baseURL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3001/api/v1"
    : "/api/v1";

export const socketURL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3001"
    : window.location.origin;
