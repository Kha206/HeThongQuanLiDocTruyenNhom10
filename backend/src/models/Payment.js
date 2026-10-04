'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      Payment.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      Payment.hasOne(models.Subscription, {
        foreignKey: 'payment_id',
        as: 'subscription'
      });
      Payment.hasOne(models.StoryPurchase, {
        foreignKey: 'payment_id',
        as: 'storyPurchase'
      });
    }
  }

  Payment.init(
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
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
      },
      payment_method: {
        type: DataTypes.ENUM('vnpay', 'momo', 'sandbox'),
        defaultValue: 'sandbox'
      },
      payment_type: {
        type: DataTypes.ENUM('subscription', 'story_purchase'),
        allowNull: false
      },
      item_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      transaction_code: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
      },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
        defaultValue: 'pending'
      },
      payment_details: {
        type: DataTypes.JSON,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'Payment',
      tableName: 'payments',
      underscored: true
    }
  );

  return Payment;
};
