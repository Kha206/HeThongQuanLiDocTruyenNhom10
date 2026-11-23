'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add publish_status column (ENUM: published, scheduled, default: published, NOT NULL)
    await queryInterface.addColumn('chapters', 'publish_status', {
      type: Sequelize.ENUM('published', 'scheduled'),
      allowNull: false,
      defaultValue: 'published',
      comment: 'Trạng thái phát hành chương: published hoặc scheduled'
    });

    // 2. Add publish_at column (DATETIME, NULL for immediate or published, UTC datetime for scheduled)
    await queryInterface.addColumn('chapters', 'publish_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Thời điểm phát hành dự kiến (lưu giờ chuẩn UTC)'
    });

    // 3. Add composite index on (publish_status, publish_at)
    await queryInterface.addIndex('chapters', ['publish_status', 'publish_at'], {
      name: 'chapters_publish_status_publish_at'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('chapters', 'chapters_publish_status_publish_at');
    await queryInterface.removeColumn('chapters', 'publish_at');
    await queryInterface.removeColumn('chapters', 'publish_status');
  }
};
