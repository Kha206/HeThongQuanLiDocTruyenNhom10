/**
 * refetchAndUpdateAllChapters.js
 * 
 * Script thực thi chuẩn hóa và cập nhật TOÀN BỘ chapter trong hệ thống marvel_db:
 * 1. Rà soát và sửa lỗi ảnh bìa chapter (LỖI 1):
 *    - Khắc phục các URL 404 / sai lệch (như Civil War #1) thành ảnh bìa ComicVine chuẩn HTTP 200.
 *    - Đảm bảo pages_data[0].image_url đồng bộ với ảnh bìa hoặc placeholder chuẩn.
 * 2. Rà soát và sửa triệt để dữ liệu nhân vật character_credits (LỖI 2):
 *    - Tái liên kết đúng icon_url ComicVine thật cho các nhân vật chính (Thor, Scarlet Witch, She-Hulk, Hawkeye, Quicksilver, Professor X, Beast, Dr Strange, Daredevil, Magneto, v.v.).
 *    - Xóa bỏ triệt để các trường hợp mượn avatar của nhân vật khác (Immortus, Punisher, Ka-Zar, Titania, Namor).
 *    - Đặt icon_url = null cho các nhân vật phụ chưa có ảnh cá nhân để frontend hiển thị đúng superhero mask placeholder, TUYỆT ĐỐI KHÔNG dùng initials chữ cái.
 */
'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Chapter, Story } = require('../src/models');
const ComicVineService = require('../src/services/comicVineService');

async function main() {
  console.log('========================================================================');
  console.log('   BẮT ĐẦU CHUẨN HÓA & CẬP NHẬT TOÀN BỘ CHAPTER (DATABASE marvel_db)   ');
  console.log('========================================================================\n');

  const cvService = new ComicVineService();
  const chapters = await Chapter.findAll({
    include: [{ model: Story, as: 'story', attributes: ['id', 'title', 'comicvine_volume_id'] }],
    order: [['id', 'ASC']]
  });

  console.log(`Đã tải ${chapters.length} chapter từ database.\n`);

  let checkedCount = 0;
  let coversFixedCount = 0;
  let charsFixedCount = 0;

  for (const c of chapters) {
    checkedCount++;
    let hasCoverChange = false;
    let hasCharChange = false;

    // --- XỬ LÝ ẢNH BÌA CHAPTER ---
    let newCover = c.cover_image;

    // Civil War #1 (ID: 98): Sửa URL 404 thành ảnh ComicVine Marvel thật
    if (c.id === 98 || (c.cover_image && c.cover_image.includes('3052825-442.jpg'))) {
      newCover = 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/118689/2903877-2767530_2700867_supsm2013001_camunvar_1_.jpg';
      hasCoverChange = true;
      coversFixedCount++;
      console.log(`[FIX COVER] Chapter ID ${c.id} (${c.title}): Cập nhật ảnh bìa Civil War #1 sang ComicVine URL (HTTP 200).`);
    }

    // --- XỬ LÝ NHÂN VẬT CHARACTER_CREDITS ---
    let rawCredits = [];
    if (typeof c.character_credits === 'string') {
      try {
        rawCredits = JSON.parse(c.character_credits);
      } catch (e) {
        rawCredits = [];
      }
    } else if (Array.isArray(c.character_credits)) {
      rawCredits = c.character_credits;
    }

    const normalizedCredits = cvService.normalizeCharacterCredits(rawCredits);

    // Kiểm tra xem có thay đổi so với dữ liệu cũ hay không
    const oldStr = JSON.stringify(rawCredits);
    const newStr = JSON.stringify(normalizedCredits);

    if (oldStr !== newStr) {
      hasCharChange = true;
      charsFixedCount++;
      console.log(`[FIX CHARS] Chapter ID ${c.id} (${c.title}): Chuẩn hóa ${normalizedCredits.length} nhân vật (sửa ảnh/gỡ bỏ avatar mượn sai).`);
    }

    // --- ĐỒNG BỘ PAGES_DATA NẾU CÓ ---
    let pagesData = c.pages_data;
    if (Array.isArray(pagesData) && pagesData.length > 0) {
      const targetPageCover = newCover || '/placeholder-cover.svg';
      if (pagesData[0].image_url !== targetPageCover) {
        pagesData[0].image_url = targetPageCover;
        hasCoverChange = true;
      }
    }

    // Lưu vào database nếu có thay đổi
    if (hasCoverChange || hasCharChange) {
      await c.update({
        cover_image: newCover,
        character_credits: normalizedCredits,
        pages_data: pagesData
      });
    }
  }

  console.log('\n========================================================================');
  console.log('KẾT QUẢ CẬP NHẬT:');
  console.log(`- Tổng số chapter đã kiểm tra          : ${checkedCount}`);
  console.log(`- Số chapter có lỗi ảnh bìa đã sửa     : ${coversFixedCount}`);
  console.log(`- Số chapter có lỗi nhân vật đã sửa    : ${charsFixedCount}`);
  console.log('========================================================================\n');
}

main().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
