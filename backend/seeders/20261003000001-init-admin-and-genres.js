'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Seed Admin User
    await queryInterface.bulkInsert('users', [{
      username: 'admin',
      email: 'admin@marvel.local',
      password: hashedPassword,
      full_name: 'Marvel Chief Administrator',
      role: 'admin',
      avatar: 'https://avatar.iran.liara.run/public/boy?username=marvel_admin',
      created_at: new Date(),
      updated_at: new Date()
    }], {});

    // Seed Default Genres
    await queryInterface.bulkInsert('genres', [
      {
        name: 'Action',
        slug: 'action',
        description: 'Những trận chiến hoành tráng và kịch tính giữa siêu anh hùng và kẻ phản diện.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Superhero',
        slug: 'superhero',
        description: 'Các câu chuyện về siêu anh hùng với năng lực phi thường bảo vệ nhân loại.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Sci-Fi',
        slug: 'sci-fi',
        description: 'Khoa học viễn tưởng, công nghệ tương lai, du hành thời gian và đa vũ trụ.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Adventure',
        slug: 'adventure',
        description: 'Hành trình phiêu lưu khám phá những miền đất và thiên hà kỳ bí.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Cosmic',
        slug: 'cosmic',
        description: 'Quy mô vũ trụ, các thực thể tối cao như Galactus, Thanos, Celestials.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Fantasy',
        slug: 'fantasy',
        description: 'Yếu tố thần thoại Asgard, phép thuật Mystic Arts của Doctor Strange.',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('users', { email: 'admin@marvel.local' }, {});
    await queryInterface.bulkDelete('genres', null, {});
  }
};
