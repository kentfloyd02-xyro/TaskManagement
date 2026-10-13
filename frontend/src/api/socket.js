import { io } from 'socket.io-client';

// Determine socket server URL based on VITE_API_URL or localhost
const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  if (apiUrl) {
    // Strip trailing '/api' from url
    return apiUrl.replace(/\/api\/?$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost') {
    return `http://${window.location.hostname}:5000`;
  }
  return 'http://localhost:5000';
};

const socket = io(getSocketUrl(), {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
});

export default socket;
