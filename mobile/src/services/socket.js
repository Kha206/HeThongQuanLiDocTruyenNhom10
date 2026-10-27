import { io } from 'socket.io-client';
import { API_BASE_URL } from '../utils/imageUrl';

let socketInstance = null;
let currentJoinedUserId = null;

/**
 * Lấy hoặc tạo mới socket singleton instance
 */
export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(API_BASE_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
      timeout: 10000
    });

    socketInstance.on('connect', () => {
      if (currentJoinedUserId) {
        socketInstance.emit('join_user', currentJoinedUserId);
      }
    });

    socketInstance.on('reconnect', () => {
      if (currentJoinedUserId) {
        socketInstance.emit('join_user', currentJoinedUserId);
      }
    });
  }

  return socketInstance;
}

/**
 * Kết nối Socket.IO cho người dùng đã đăng nhập và gia nhập phòng cá nhân
 * @param {number|string} userId 
 */
export function connectSocket(userId) {
  if (!userId) return;

  currentJoinedUserId = userId;
  const socket = getSocket();

  if (!socket.connected) {
    socket.connect();
  } else {
    socket.emit('join_user', userId);
  }
}

/**
 * Ngắt kết nối Socket.IO khi người dùng đăng xuất
 */
export function disconnectSocket() {
  currentJoinedUserId = null;
  if (socketInstance && socketInstance.connected) {
    socketInstance.disconnect();
  }
}

/**
 * Gia nhập phòng theo dõi của bộ truyện để nhận thông báo chương mới
 * @param {number|string} storyId 
 */
export function joinStoryRoom(storyId) {
  if (!storyId) return;
  const socket = getSocket();
  if (socket && socket.connected) {
    socket.emit('join_story', storyId);
  }
}

/**
 * Gia nhập phòng chương truyện để theo dõi bình luận trực tiếp
 * @param {number|string} chapterId 
 */
export function joinChapterRoom(chapterId) {
  if (!chapterId) return;
  const socket = getSocket();
  if (socket && socket.connected) {
    socket.emit('join_chapter', chapterId);
  }
}

export default {
  getSocket,
  connectSocket,
  disconnectSocket,
  joinStoryRoom,
  joinChapterRoom
};
