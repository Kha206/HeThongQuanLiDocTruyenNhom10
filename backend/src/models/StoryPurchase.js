'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StoryPurchase extends Model {
    static associate(models) {
      StoryPurchase.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      StoryPurchase.belongsTo(models.Story, {
        foreignKey: 'story_id',
        as: 'story'
      });
      StoryPurchase.belongsTo(models.Payment, {
        foreignKey: 'payment_id',
        as: 'payment'
      });
    }
  }

  StoryPurchase.init(
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
      payment_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      price_paid: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: DataTypes.ENUM('completed', 'refunded'),
        defaultValue: 'completed'
      }
    },
    {
      sequelize,
      modelName: 'StoryPurchase',
      tableName: 'story_purchases',
      underscored: true
    }
  );

  return StoryPurchase;
};
