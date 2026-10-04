'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Subscription extends Model {
    static associate(models) {
      Subscription.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      Subscription.belongsTo(models.SubscriptionPlan, {
        foreignKey: 'plan_id',
        as: 'plan'
      });
      Subscription.belongsTo(models.Payment, {
        foreignKey: 'payment_id',
        as: 'payment'
      });
    }
  }

  Subscription.init(
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
      plan_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      payment_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('active', 'expired', 'cancelled'),
        defaultValue: 'active'
      }
    },
    {
      sequelize,
      modelName: 'Subscription',
      tableName: 'subscriptions',
      underscored: true
    }
  );

  return Subscription;
};
