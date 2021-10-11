import io from 'socket.io-client';
import {
  IO_RECONNECTION_URL,
  IS_RECONNECTION_ENABLED,
  RECONNECT_DELAY_MAX,
  RECONNECT_DELAY_MIN,
} from '../constants';

const SOCKET = io().connect(IO_RECONNECTION_URL, {
  reconnection: IS_RECONNECTION_ENABLED,
  reconnectionDelay: RECONNECT_DELAY_MIN,
  reconnectionDelayMax: RECONNECT_DELAY_MAX,
  reconnectionAttempts: Infinity,
});

export const preFetchSocket = (isAuthenticated) => {
  return isAuthenticated ? SOCKET : '';
};
