'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Chapter extends Model {
    static associate(models) {
      Chapter.belongsTo(models.Story, {
        foreignKey: 'story_id',
        as: 'story'
      });
      Chapter.hasMany(models.ReadingProgress, {
        foreignKey: 'chapter_id',
        as: 'readingProgresses',
        onDelete: 'CASCADE'
      });
      Chapter.hasMany(models.Comment, {
        foreignKey: 'chapter_id',
        as: 'comments',
        onDelete: 'CASCADE'
      });
    }
  }

  Chapter.init({
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
    comicvine_issue_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    chapter_number: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1.0
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    release_date: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    is_preview: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    pages_data: {
      type: DataTypes.JSON,
      allowNull: true
    },
    cover_image: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: true
    },
    character_credits: {
      type: DataTypes.JSON,
      allowNull: true
    },
    accent_color: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: '#ED1D24'
    }
  }, {
    sequelize,
    modelName: 'Chapter',
    tableName: 'chapters',
    underscored: true
  });

  return Chapter;
};
