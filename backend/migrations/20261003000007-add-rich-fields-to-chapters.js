'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add cover_image
    await queryInterface.addColumn('chapters', 'cover_image', {
      type: Sequelize.STRING(1000),
      allowNull: true,
      comment: 'Cover image URL from ComicVine'
    });

    // Add content
    await queryInterface.addColumn('chapters', 'content', {
      type: Sequelize.TEXT('long'),
      allowNull: true,
      comment: 'Detailed summary/synopsis of the issue'
    });

    // Add character_credits
    await queryInterface.addColumn('chapters', 'character_credits', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Array of up to 8 characters with name and icon_url'
    });

    // Add accent_color
    await queryInterface.addColumn('chapters', 'accent_color', {
      type: Sequelize.STRING(20),
      allowNull: true,
      defaultValue: '#ED1D24',
      comment: 'Dominant accent color extracted via node-vibrant'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('chapters', 'accent_color');
    await queryInterface.removeColumn('chapters', 'character_credits');
    await queryInterface.removeColumn('chapters', 'content');
    await queryInterface.removeColumn('chapters', 'cover_image');
  }
};
