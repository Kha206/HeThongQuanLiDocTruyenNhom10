'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Subscription, {
        foreignKey: 'user_id',
        as: 'subscriptions'
      });
      User.hasMany(models.StoryPurchase, {
        foreignKey: 'user_id',
        as: 'storyPurchases'
      });
      User.hasMany(models.Payment, {
        foreignKey: 'user_id',
        as: 'payments'
      });
      User.hasMany(models.ReadingProgress, {
        foreignKey: 'user_id',
        as: 'readingProgresses'
      });
      User.hasMany(models.StoryFollow, {
        foreignKey: 'user_id',
        as: 'follows'
      });
      User.hasMany(models.Notification, {
        foreignKey: 'user_id',
        as: 'notifications'
      });
      User.hasMany(models.Comment, {
        foreignKey: 'user_id',
        as: 'comments'
      });
    }

    // Method to check password validity
    async checkPassword(plainPassword) {
      return bcrypt.compare(plainPassword, this.password);
    }
  }

  User.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50]
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('reader', 'admin'),
      allowNull: false,
      defaultValue: 'reader'
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true,
    hooks: {
      beforeSave: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  return User;
};
