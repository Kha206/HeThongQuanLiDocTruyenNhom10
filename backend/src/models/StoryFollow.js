'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StoryFollow extends Model {
    static associate(models) {
      StoryFollow.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      StoryFollow.belongsTo(models.Story, {
        foreignKey: 'story_id',
        as: 'story'
      });
    }
  }

  StoryFollow.init(
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
      }
    },
    {
      sequelize,
      modelName: 'StoryFollow',
      tableName: 'story_follows',
      underscored: true
    }
  );

  return StoryFollow;
};
