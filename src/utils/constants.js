export const baseURL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3001/api/v1"
    : "/api/v1";
