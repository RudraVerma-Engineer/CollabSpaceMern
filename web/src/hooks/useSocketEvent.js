import { useEffect, useRef } from "react";

import { socket } from "../socket/socket.js";

/**
 * Subscribes to a socket event for the lifetime of the component.
 * The latest `handler` is always used, so callers don't need useCallback.
 */
export const useSocketEvent = (event, handler) => {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    const listener = (...args) => handlerRef.current?.(...args);

    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [event]);
};
