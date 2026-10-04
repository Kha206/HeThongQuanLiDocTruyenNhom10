'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    static associate(models) {
      Comment.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      Comment.belongsTo(models.Story, {
        foreignKey: 'story_id',
        as: 'story'
      });
      Comment.belongsTo(models.Chapter, {
        foreignKey: 'chapter_id',
        as: 'chapter'
      });
    }
  }

  Comment.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      story_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      chapter_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('approved', 'hidden'),
        defaultValue: 'approved'
      },
      is_reported: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      report_reason: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      likes_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      }
    },
    {
      sequelize,
      modelName: 'Comment',
      tableName: 'comments',
      underscored: true
    }
  );

  return Comment;
};
