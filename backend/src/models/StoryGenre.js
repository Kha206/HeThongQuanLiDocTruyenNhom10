'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StoryGenre extends Model {
    static associate(models) {
      StoryGenre.belongsTo(models.Story, { foreignKey: 'story_id' });
      StoryGenre.belongsTo(models.Genre, { foreignKey: 'genre_id' });
    }
  }

  StoryGenre.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    story_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'stories',
        key: 'id'
      }
    },
    genre_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'genres',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'StoryGenre',
    tableName: 'story_genres',
    underscored: true
  });

  return StoryGenre;
};
