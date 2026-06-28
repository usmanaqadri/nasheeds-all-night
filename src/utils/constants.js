export const apiOrigin =
  process.env.REACT_APP_API_ORIGIN ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3001"
    : window.location.origin);

export const apiPathPrefix = process.env.REACT_APP_API_PATH_PREFIX || "/api/v1";

export const baseURL = `${apiOrigin}${apiPathPrefix}`;

export const socketURL = apiOrigin;

export const socketPath =
  process.env.REACT_APP_SOCKET_PATH || `${apiPathPrefix}/socket.io`;
