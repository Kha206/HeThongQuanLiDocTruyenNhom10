'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Story extends Model {
    static associate(models) {
      Story.belongsToMany(models.Genre, {
        through: models.StoryGenre,
        foreignKey: 'story_id',
        otherKey: 'genre_id',
        as: 'genres'
      });
      Story.hasMany(models.Chapter, {
        foreignKey: 'story_id',
        as: 'chapters',
        onDelete: 'CASCADE'
      });
      Story.hasMany(models.StoryPurchase, {
        foreignKey: 'story_id',
        as: 'purchases',
        onDelete: 'CASCADE'
      });
      Story.hasMany(models.ReadingProgress, {
        foreignKey: 'story_id',
        as: 'readingProgresses',
        onDelete: 'CASCADE'
      });
      Story.hasMany(models.StoryFollow, {
        foreignKey: 'story_id',
        as: 'followers',
        onDelete: 'CASCADE'
      });
      Story.hasMany(models.Comment, {
        foreignKey: 'story_id',
        as: 'comments',
        onDelete: 'CASCADE'
      });
    }
  }

  Story.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    comicvine_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true
    },
    comicvine_volume_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    original_title: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT('medium'),
      allowNull: true
    },
    cover_image: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    banner_image: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    publisher: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Marvel Comics'
    },
    release_year: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('ongoing', 'completed', 'dropped'),
      allowNull: false,
      defaultValue: 'ongoing'
    },
    access_policy: {
      type: DataTypes.ENUM('free', 'paid', 'mixed'),
      allowNull: false,
      defaultValue: 'free'
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    view_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 5.0
    }
  }, {
    sequelize,
    modelName: 'Story',
    tableName: 'stories',
    underscored: true
  });

  return Story;
};
