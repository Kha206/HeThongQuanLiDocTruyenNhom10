'use strict';

let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    // Client joins their user-specific room
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`[Socket.IO] Client ${socket.id} joined user_${userId}`);
      }
    });

    // Client joins story room for real-time updates
    socket.on('join_story', (storyId) => {
      if (storyId) {
        socket.join(`story_${storyId}`);
        console.log(`[Socket.IO] Client ${socket.id} joined story_${storyId}`);
      }
    });

    // Client joins chapter room for live comments
    socket.on('join_chapter', (chapterId) => {
      if (chapterId) {
        socket.join(`chapter_${chapterId}`);
        console.log(`[Socket.IO] Client ${socket.id} joined chapter_${chapterId}`);
      }
    });

    socket.on('disconnect', () => {
      // Disconnected
    });
  });
};

const getIo = () => ioInstance;

const sendNotificationToUser = (userId, notification) => {
  if (ioInstance && userId) {
    ioInstance.to(`user_${userId}`).emit('new_notification', notification);
  }
};

const broadcastNewChapter = (storyId, chapter, storyTitle) => {
  if (ioInstance && storyId) {
    ioInstance.to(`story_${storyId}`).emit('new_chapter_published', {
      storyId,
      storyTitle,
      chapter
    });
  }
};

const broadcastNewComment = (chapterId, comment) => {
  if (ioInstance && chapterId) {
    ioInstance.to(`chapter_${chapterId}`).emit('new_comment_posted', comment);
  }
};

module.exports = {
  initSocket,
  getIo,
  sendNotificationToUser,
  broadcastNewChapter,
  broadcastNewComment
};
