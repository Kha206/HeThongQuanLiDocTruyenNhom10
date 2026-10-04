'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('chapters', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      story_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'stories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      comicvine_issue_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      chapter_number: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 1.0
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      release_date: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      is_preview: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      pages_data: {
        type: Sequelize.JSON,
        allowNull: true
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

    await queryInterface.addIndex('chapters', ['story_id', 'chapter_number']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('chapters');
  }
};
