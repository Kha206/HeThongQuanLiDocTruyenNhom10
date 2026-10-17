'use strict';

const { Chapter, Story, sequelize } = require('../src/models');
const { Op } = require('sequelize');

async function auditDataIntegrity() {
  console.log('\n================================================================');
  console.log('🔍 RÀ SOÁT DỮ LIỆU TOÀN DIỆN (NHÓM C - SPRINT 5)');
  console.log('================================================================\n');

  try {
    // 1. Kiểm tra ảnh bìa chương (Cover images)
    console.log('1️⃣ Kiểm tra trùng lặp ảnh bìa chương...');
    const allChapters = await Chapter.findAll({
      attributes: ['id', 'story_id', 'chapter_number', 'title', 'cover_image'],
      order: [['id', 'ASC']]
    });

    console.log(`- Tổng số chương trong cơ sở dữ liệu: ${allChapters.length}`);

    const coverMap = {};
    const duplicateCovers = [];

    allChapters.forEach(ch => {
      const cover = ch.cover_image;
      if (cover && typeof cover === 'string' && cover.trim() !== '' && !cover.includes('placeholder')) {
        const cleanCover = cover.trim();
        if (coverMap[cleanCover]) {
          coverMap[cleanCover].push(ch);
          duplicateCovers.push({ cover: cleanCover, chapters: coverMap[cleanCover] });
        } else {
          coverMap[cleanCover] = [ch];
        }
      }
    });

    if (duplicateCovers.length === 0) {
      console.log('✅ TUYỆT VỜI: Không có 2 chương nào bị trùng ảnh bìa!');
    } else {
      console.log(`⚠️ Phát hiện ${duplicateCovers.length} trường hợp chương dùng chung ảnh bìa:`);
      duplicateCovers.forEach((d, idx) => {
        console.log(`  [${idx + 1}] Cover: ${d.cover}`);
        d.chapters.forEach(c => console.log(`     - Chapter ID ${c.id}: ${c.title} (Story ${c.story_id}, Chap #${c.chapter_number})`));
      });
    }

    // 2. Kiểm tra nhân vật trong character_credits
    console.log('\n2️⃣ Kiểm tra nhân vật trong character_credits (không trùng ảnh giữa 2 nhân vật khác nhau)...');
    const chaptersWithCredits = await Chapter.findAll({
      attributes: ['id', 'title', 'character_credits'],
      where: {
        character_credits: { [Op.ne]: null }
      }
    });

    const characterAvatarMap = {}; // avatarUrl -> Set of character names
    const duplicateCharAvatars = [];

    chaptersWithCredits.forEach(ch => {
      const credits = Array.isArray(ch.character_credits) ? ch.character_credits : [];
      credits.forEach(char => {
        const name = (char.name || '').trim();
        const icon = (char.icon_url || char.avatar || char.image || '').trim();
        if (name && icon && !icon.includes('placeholder')) {
          if (!characterAvatarMap[icon]) {
            characterAvatarMap[icon] = new Set();
          }
          characterAvatarMap[icon].add(name);
        }
      });
    });

    Object.entries(characterAvatarMap).forEach(([iconUrl, nameSet]) => {
      if (nameSet.size > 1) {
        duplicateCharAvatars.push({
          iconUrl,
          names: Array.from(nameSet)
        });
      }
    });

    if (duplicateCharAvatars.length === 0) {
      console.log('✅ TUYỆT VỜI: Không có 2 nhân vật khác nhau nào bị trùng ảnh!');
    } else {
      console.log(`⚠️ Phát hiện ${duplicateCharAvatars.length} trường hợp ảnh nhân vật bị dùng chung cho các nhân vật khác nhau:`);
      duplicateCharAvatars.forEach((d, idx) => {
        console.log(`  [${idx + 1}] Icon: ${d.iconUrl}`);
        console.log(`     - Nhân vật: ${d.names.join(', ')}`);
      });
    }

    // 3. Kiểm tra nguồn ảnh ngoài ComicVine hoặc ảnh ngẫu nhiên
    console.log('\n3️⃣ Kiểm tra nguồn gốc ảnh (ComicVine vs nguồn ngoài)...');
    const stories = await Story.findAll({ attributes: ['id', 'title', 'cover_image', 'banner_image'] });
    let nonComicVineCount = 0;

    const checkUrl = (url, context) => {
      if (!url) return;
      if (url.startsWith('/uploads/') || url.startsWith('http://localhost') || url.includes('/placeholder-cover.svg')) {
        return; // local or placeholder
      }
      if (!url.includes('comicvine.gamespot.com') && !url.includes('comicvine1.cbsistatic.com') && !url.includes('marvel.com')) {
        console.log(`  ℹ️ URL ngoài: [${context}] -> ${url}`);
        nonComicVineCount++;
      }
    };

    stories.forEach(s => {
      checkUrl(s.cover_image, `Story ${s.id} Cover`);
      checkUrl(s.banner_image, `Story ${s.id} Banner`);
    });

    allChapters.forEach(c => {
      checkUrl(c.cover_image, `Chapter ${c.id} Cover`);
    });

    if (nonComicVineCount === 0) {
      console.log('✅ TUYỆT VỜI: 100% ảnh truyện và chương đều từ ComicVine / nội bộ hệ thống!');
    } else {
      console.log(`⚠️ Có ${nonComicVineCount} URL ảnh từ nguồn khác.`);
    }

    console.log('\n================================================================');
    console.log('🏁 KẾT QUẢ RÀ SOÁT DỮ LIỆU HOÀN TẤT.');
    console.log('================================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi kiểm tra dữ liệu:', err);
    process.exit(1);
  }
}

auditDataIntegrity();
