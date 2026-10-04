'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ReadingProgress extends Model {
    static associate(models) {
      ReadingProgress.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      ReadingProgress.belongsTo(models.Story, {
        foreignKey: 'story_id',
        as: 'story'
      });
      ReadingProgress.belongsTo(models.Chapter, {
        foreignKey: 'chapter_id',
        as: 'chapter'
      });
    }
  }

  ReadingProgress.init(
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
      scroll_y: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      progress_percent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00
      }
    },
    {
      sequelize,
      modelName: 'ReadingProgress',
      tableName: 'reading_progress',
      underscored: true
    }
  );

  return ReadingProgress;
};
