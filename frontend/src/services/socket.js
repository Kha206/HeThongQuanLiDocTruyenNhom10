import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

export const joinUserRoom = (userId) => {
  if (userId && socket.connected) {
    socket.emit('join_user', userId);
  }
};

export const joinStoryRoom = (storyId) => {
  if (storyId && socket.connected) {
    socket.emit('join_story', storyId);
  }
};

export const joinChapterRoom = (chapterId) => {
  if (chapterId && socket.connected) {
    socket.emit('join_chapter', chapterId);
  }
};

// Web Push Notification Helper
export const requestPushPermission = async () => {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const showWebNotification = (title, options = {}) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/marvel-logo.png',
        badge: '/marvel-logo.png',
        ...options
      });
    } catch (e) {
      console.warn('Web notification error:', e);
    }
  }
};

export default socket;
