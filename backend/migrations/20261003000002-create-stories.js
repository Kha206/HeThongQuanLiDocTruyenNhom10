'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('stories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      comicvine_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        unique: true
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      original_title: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      slug: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT('medium'),
        allowNull: true
      },
      cover_image: {
        type: Sequelize.STRING(1000),
        allowNull: true
      },
      banner_image: {
        type: Sequelize.STRING(1000),
        allowNull: true
      },
      publisher: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'Marvel Comics'
      },
      release_year: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('ongoing', 'completed', 'dropped'),
        allowNull: false,
        defaultValue: 'ongoing'
      },
      access_policy: {
        type: Sequelize.ENUM('free', 'paid', 'mixed'),
        allowNull: false,
        defaultValue: 'free'
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      view_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      rating: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 5.0
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('stories');
  }
};
