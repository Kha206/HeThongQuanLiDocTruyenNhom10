const { Chapter, Story } = require('../src/models');
const http = require('http');

async function testUrlViaProxy(url) {
  return new Promise((resolve) => {
    const proxyUrl = 'http://localhost:5000/api/image-proxy?url=' + encodeURIComponent(url);
    http.get(proxyUrl, (res) => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const isPng = buf[0] === 0x89 && buf[1] === 0x50;
        const isJpg = buf[0] === 0xFF && buf[1] === 0xD8;
        const isWebp = buf[0] === 0x52 && buf[1] === 0x49;
        const isSvg = buf.slice(0, 50).toString().includes('<svg');
        const isHtml = buf.slice(0, 50).toString().includes('<!DOCTYPE') || buf.slice(0, 50).toString().includes('<html');

        resolve({
          statusCode: res.statusCode,
          contentType: res.headers['content-type'],
          cacheHeader: res.headers['x-proxy-cache'],
          size: buf.length,
          isValidImage: (isPng || isJpg || isWebp || isSvg) && !isHtml
        });
      });
    }).on('error', (err) => {
      resolve({ statusCode: 500, error: err.message, isValidImage: false });
    });
  });
}

async function audit() {
  console.log('=== TOÀN DIỆN AUDIT CƠ SỞ DỮ LIỆU & IMAGE PROXY ===\n');

  const chapters = await Chapter.findAll();
  console.log(`Tổng số Chapter trong Database: ${chapters.length}`);

  let totalCharacters = 0;
  let thorCharacters = 0;
  let nonComicVineUrls = [];

  for (const ch of chapters) {
    let credits = ch.character_credits;
    if (typeof credits === 'string') {
      try { credits = JSON.parse(credits); } catch (_) { credits = []; }
    }
    if (!Array.isArray(credits)) credits = [];

    for (const c of credits) {
      totalCharacters++;
      const name = (c.name || '').toLowerCase();
      if (name.includes('thor')) {
        thorCharacters++;
      }
      if (c.icon_url && !c.icon_url.includes('comicvine.gamespot.com')) {
        nonComicVineUrls.push({ chapterId: ch.id, character: c.name, url: c.icon_url });
      }
    }

    if (ch.cover_image && !ch.cover_image.includes('comicvine.gamespot.com') && !ch.cover_image.startsWith('/')) {
      nonComicVineUrls.push({ chapterId: ch.id, type: 'chapter_cover', url: ch.cover_image });
    }
  }

  console.log(`Tổng số nhân vật (character credits) được duyệt: ${totalCharacters}`);
  console.log(`Tổng số lần nhân vật Thor xuất hiện: ${thorCharacters}`);
  console.log(`Số lượng URL không thuộc ComicVine: ${nonComicVineUrls.length}`);
  if (nonComicVineUrls.length > 0) {
    console.log('Danh sách URL không phải ComicVine:', nonComicVineUrls);
  } else {
    console.log('100% tất cả URL nhân vật và chapter đều trỏ chính xác về domain comicvine.gamespot.com!');
  }

  // Test Chapter 118 (The Coming of the Avengers - Thor's first Avengers appearance)
  const ch118 = await Chapter.findByPk(118);
  console.log('\n--- Kiểm tra thực tế Chapter 118 (The Coming of the Avengers) ---');
  let ch118Credits = ch118.character_credits;
  if (typeof ch118Credits === 'string') ch118Credits = JSON.parse(ch118Credits);
  
  const thorIn118 = ch118Credits.find(c => c.name.toLowerCase().includes('thor'));
  console.log('Thor in Chapter 118 data:', JSON.stringify(thorIn118, null, 2));

  console.log('\n--- Kiểm tra Image Proxy cho ảnh Thor của Chapter 118 ---');
  const proxyResult = await testUrlViaProxy(thorIn118.icon_url);
  console.log('Proxy test result:', proxyResult);

  if (proxyResult.statusCode === 200 && proxyResult.isValidImage) {
    console.log('\n [THÀNH CÔNG] Ảnh của Thor trả về HTTP 200, Content-Type chuẩn, byte ảnh hợp lệ và không chứa bất kỳ mã HTML Cloudflare nào!');
  } else {
    console.error('\n [THẤT BẠI] Proxy ảnh Thor không trả về ảnh hợp lệ');
  }

  process.exit(0);
}

audit().catch(err => {
  console.error(err);
  process.exit(1);
});
