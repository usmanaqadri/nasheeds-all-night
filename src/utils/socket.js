import { io } from "socket.io-client";
import { socketURL } from "./constants";

let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(socketURL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }

  return socketInstance;
};
