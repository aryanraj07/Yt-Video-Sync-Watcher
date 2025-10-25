let ioInstance;
export const setIo = (io) => {
  ioInstance = io;
};
export const getIo = () => {
  if (!ioInstance) throw new Error("Socket.io not initialized!");
  return ioInstance;
};
