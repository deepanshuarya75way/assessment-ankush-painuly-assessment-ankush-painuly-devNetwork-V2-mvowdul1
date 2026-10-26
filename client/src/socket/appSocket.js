import { io } from "socket.io-client";
import api from "../api/axios";

const socketUrl = api.defaults.baseURL.replace(/\/api$/, "");

let appSocket;

export const connectAppSocket = () => {
  if (!appSocket) {
    appSocket = io(socketUrl, {
      autoConnect: false,
      withCredentials: true,
    });
  }

  if (!appSocket.connected) {
    appSocket.connect();
  }

  return appSocket;
};

export const getAppSocket = () => appSocket;

export const disconnectAppSocket = () => {
  if (!appSocket) return;

  appSocket.disconnect();
  appSocket = null;
};
