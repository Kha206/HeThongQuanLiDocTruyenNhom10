'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StoryRating extends Model {
    static associate(models) {
      StoryRating.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      StoryRating.belongsTo(models.Story, {
        foreignKey: 'story_id',
        as: 'story'
      });
    }
  }

  StoryRating.init(
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
      score: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5
        }
      },
      review: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'StoryRating',
      tableName: 'story_ratings',
      underscored: true
    }
  );

  return StoryRating;
};
