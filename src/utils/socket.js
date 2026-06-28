import { io } from "socket.io-client";
import { socketPath, socketURL } from "./constants";

let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(socketURL, {
      path: socketPath,
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }

  return socketInstance;
};
