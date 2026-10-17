'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'status', {
      type: Sequelize.ENUM('active', 'restricted', 'suspended'),
      allowNull: false,
      defaultValue: 'active',
      after: 'role'
    });

    await queryInterface.addColumn('users', 'status_reason', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'status'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'status_reason');
    await queryInterface.removeColumn('users', 'status');
  }
};
