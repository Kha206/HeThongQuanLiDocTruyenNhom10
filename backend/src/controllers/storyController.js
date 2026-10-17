const { Story, Genre, Chapter, StoryRating, sequelize } = require('../models');
const { Op } = require('sequelize');

const realRatingAttributes = [
  [
    sequelize.literal(`(
      SELECT ROUND(AVG(sr.score), 1)
      FROM story_ratings AS sr
      WHERE sr.story_id = Story.id
    )`),
    'average_rating'
  ],
  [
    sequelize.literal(`(
      SELECT COUNT(sr.id)
      FROM story_ratings AS sr
      WHERE sr.story_id = Story.id
    )`),
    'rating_count'
  ]
];

exports.getAllStories = async (req, res) => {
  try {
    const { search, genre, access_policy, status, sort, page = 1, limit = 12 } = req.query;

    const where = {};
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { original_title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    if (access_policy && access_policy !== 'all') {
      where.access_policy = access_policy;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    // Include genre filter
    const genreInclude = {
      model: Genre,
      as: 'genres',
      through: { attributes: [] }
    };

    if (genre && genre !== 'all') {
      genreInclude.where = {
        [Op.or]: [
          { slug: genre },
          { name: genre }
        ]
      };
    }

    let order = [['created_at', 'DESC']];
    if (sort === 'views') {
      order = [['view_count', 'DESC']];
    } else if (sort === 'rating') {
      order = [
        [sequelize.literal('rating_count'), 'DESC'],
        [sequelize.literal('average_rating'), 'DESC']
      ];
    } else if (sort === 'year') {
      order = [['release_year', 'DESC']];
    } else if (sort === 'title' || sort === 'az') {
      order = [['title', 'ASC']];
    } else if (sort === 'latest') {
      order = [['created_at', 'DESC']];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Story.findAndCountAll({
      where,
      attributes: {
        include: realRatingAttributes
      },
      include: [
        genreInclude,
        {
          model: Chapter,
          as: 'chapters',
          attributes: ['id', 'chapter_number', 'title', 'is_preview', 'release_date']
        }
      ],
      order,
      limit: parseInt(limit),
      offset,
      distinct: true
    });

    return res.status(200).json({
      success: true,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
      stories: rows
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải danh sách truyện', error: error.message });
  }
};

exports.getHeroStories = async (req, res) => {
  try {
    const stories = await Story.findAll({
      limit: 6,
      attributes: {
        include: realRatingAttributes
      },
      order: [['view_count', 'DESC']],
      include: [
        {
          model: Genre,
          as: 'genres',
          through: { attributes: [] }
        }
      ]
    });

    return res.status(200).json({
      success: true,
      stories
    });
  } catch (error) {
    console.error('Error fetching hero stories:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải danh sách hero stories', error: error.message });
  }
};

exports.getStoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const story = await Story.findByPk(id, {
      attributes: {
        include: realRatingAttributes
      },
      include: [
        {
          model: Genre,
          as: 'genres',
          through: { attributes: [] }
        },
        {
          model: Chapter,
          as: 'chapters',
          attributes: ['id', 'chapter_number', 'title', 'release_date', 'is_preview', 'comicvine_issue_id', 'cover_image', 'accent_color']
        }
      ],
      order: [
        [{ model: Chapter, as: 'chapters' }, 'chapter_number', 'ASC']
      ]
    });

    if (!story) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy truyện.' });
    }

    return res.status(200).json({
      success: true,
      story
    });
  } catch (error) {
    console.error('Error fetching story detail:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải chi tiết truyện', error: error.message });
  }
};

exports.getChapterDetail = async (req, res) => {
  try {
    const { chapterId } = req.params;

    const chapter = await Chapter.findByPk(chapterId, {
      include: [
        {
          model: Story,
          as: 'story',
          attributes: ['id', 'title', 'cover_image', 'access_policy', 'price']
        }
      ]
    });

    if (!chapter) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chương truyện.' });
    }

    // Find previous and next chapters for seamless reader navigation
    const { Op } = require('sequelize');
    const prevChapter = await Chapter.findOne({
      where: {
        story_id: chapter.story_id,
        chapter_number: { [Op.lt]: chapter.chapter_number }
      },
      order: [['chapter_number', 'DESC']],
      attributes: ['id', 'chapter_number', 'title', 'cover_image']
    });

    const nextChapter = await Chapter.findOne({
      where: {
        story_id: chapter.story_id,
        chapter_number: { [Op.gt]: chapter.chapter_number }
      },
      order: [['chapter_number', 'ASC']],
      attributes: ['id', 'chapter_number', 'title', 'cover_image']
    });

    return res.status(200).json({
      success: true,
      chapter,
      prev_chapter: prevChapter,
      next_chapter: nextChapter,
      read_access: req.readAccess || null
    });
  } catch (error) {
    console.error('Error fetching chapter detail:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải chi tiết chương truyện', error: error.message });
  }
};

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

// Ensure image cache directory exists
const CACHE_DIR = path.join(__dirname, '../../uploads/cache');
if (!fs.existsSync(CACHE_DIR)) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  } catch (e) {
    console.error('Failed to create cache dir:', e);
  }
}

// Function to generate a dynamic Marvel comic SVG cover when upstream is blocked
function generateMarvelSvgCover(url = '') {
  let displayTitle = 'MARVEL COMIC';
  try {
    const rawName = String(url).split('/').pop() || '';
    const cleanName = rawName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();
    if (cleanName) {
      displayTitle = cleanName.substring(0, 28).toUpperCase();
    }
  } catch (_) {}

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#181824"/>
      <stop offset="50%" stop-color="#0F0F14"/>
      <stop offset="100%" stop-color="#08080C"/>
    </linearGradient>
    <linearGradient id="glowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ED1D24" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#4D6FFF" stop-opacity="0.08"/>
    </linearGradient>
    <pattern id="halftone" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
      <circle cx="8" cy="8" r="1.5" fill="#ffffff" fill-opacity="0.04"/>
    </pattern>
  </defs>

  <rect width="400" height="600" fill="url(#bgGrad)"/>
  <rect width="400" height="600" fill="url(#glowGrad)"/>
  <rect width="400" height="600" fill="url(#halftone)"/>

  <rect x="12" y="12" width="376" height="576" rx="8" fill="none" stroke="#2A2A38" stroke-width="2"/>
  <rect x="16" y="16" width="368" height="568" rx="6" fill="none" stroke="#ED1D24" stroke-width="1" stroke-opacity="0.35"/>

  <g transform="translate(130, 45)">
    <rect width="140" height="46" rx="4" fill="#ED1D24"/>
    <text x="70" y="32" font-family="'Impact', 'Arial Black', sans-serif" font-size="28" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1.5">MARVEL</text>
  </g>

  <g transform="translate(60, 150)">
    <rect width="280" height="300" rx="12" fill="#1A1A24" stroke="#2E2E40" stroke-width="1.5"/>
    <rect width="280" height="300" rx="12" fill="url(#halftone)"/>
    
    <path d="M90 100 L140 70 L190 100 L190 220 L140 190 L90 220 Z" fill="#242434" stroke="#ED1D24" stroke-width="2" stroke-linejoin="round"/>
    <path d="M140 70 L140 190" stroke="#ED1D24" stroke-width="2"/>
    <path d="M90 100 L140 130 L190 100" stroke="#ED1D24" stroke-width="2" stroke-dasharray="4,4"/>

    <path d="M140 120 L155 145 L145 147 L160 175 L135 152 L143 150 Z" fill="#ED1D24"/>

    <text x="140" y="270" font-family="'Outfit', 'Segoe UI', sans-serif" font-size="11" font-weight="600" fill="#9999AA" text-anchor="middle" letter-spacing="1">${displayTitle}</text>
  </g>

  <text x="200" y="500" font-family="'Outfit', 'Segoe UI', sans-serif" font-size="15" font-weight="700" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">MARVEL COMICS</text>
  <text x="200" y="525" font-family="'Outfit', 'Segoe UI', sans-serif" font-size="11" font-weight="400" fill="#777788" text-anchor="middle" letter-spacing="0.5">Vũ Trụ Truyện Tranh Bản Quyền</text>

  <line x1="20" y1="20" x2="35" y2="20" stroke="#ED1D24" stroke-width="3"/>
  <line x1="20" y1="20" x2="20" y2="35" stroke="#ED1D24" stroke-width="3"/>
  <line x1="380" y1="20" x2="365" y2="20" stroke="#ED1D24" stroke-width="3"/>
  <line x1="380" y1="20" x2="380" y2="35" stroke="#ED1D24" stroke-width="3"/>
  <line x1="20" y1="580" x2="35" y2="580" stroke="#ED1D24" stroke-width="3"/>
  <line x1="20" y1="580" x2="20" y2="565" stroke="#ED1D24" stroke-width="3"/>
  <line x1="380" y1="580" x2="365" y2="580" stroke="#ED1D24" stroke-width="3"/>
  <line x1="380" y1="580" x2="380" y2="565" stroke="#ED1D24" stroke-width="3"/>
</svg>`;
}

function isValidImageBuffer(buf) {
  if (!buf || !Buffer.isBuffer(buf) || buf.length < 16) return false;
  // If starts with HTML tags or XML error, reject
  const headerStr = buf.slice(0, 80).toString('utf8').trim().toLowerCase();
  if (headerStr.startsWith('<!doctype') || headerStr.startsWith('<html') || headerStr.startsWith('<head') || headerStr.startsWith('<?xml') || headerStr.startsWith('<error')) {
    return false;
  }
  // JPEG: FF D8 FF
  if (buf[0] === 0xFF && buf[1] === 0xD8) return true;
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return true;
  // GIF: 47 49 46
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return true;
  // WEBP: RIFF ... WEBP
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf.slice(8, 12).toString() === 'WEBP') return true;
  // SVG: <svg
  if (headerStr.includes('<svg')) return true;
  return false;
}

function getImageContentType(buf) {
  if (buf[0] === 0xFF && buf[1] === 0xD8) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'image/png';
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif';
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return 'image/webp';
  if (buf.slice(0, 80).toString('utf8').toLowerCase().includes('<svg')) return 'image/svg+xml';
  return 'image/jpeg';
}

function generateMarvelAvatarSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="avGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#222230"/>
      <stop offset="100%" stop-color="#12121A"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="50" fill="url(#avGrad)"/>
  <circle cx="50" cy="50" r="48" fill="none" stroke="#ED1D24" stroke-width="2" stroke-opacity="0.8"/>
  <circle cx="50" cy="38" r="16" fill="#ED1D24" opacity="0.9"/>
  <path d="M24 82 C24 60, 36 56, 50 56 C64 56, 76 60, 76 82 Z" fill="#ED1D24" opacity="0.9"/>
</svg>`;
}

exports.proxyImage = async (req, res) => {
  try {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');

    const rawUrl = req.query.url;
    if (!rawUrl) {
      return res.status(400).send('URL query parameter is required');
    }

    const url = decodeURIComponent(rawUrl).trim();

    // If it's a data URL, relative path, or already SVG
    if (url.startsWith('data:') || url.startsWith('/')) {
      return res.redirect(url);
    }

    const isAvatarLike = url.includes('scale_small') || url.includes('square_small') || url.includes('avatar') || url.includes('character');

    // Check disk cache first
    const cacheKey = crypto.createHash('md5').update(url).digest('hex');
    const cachedFilePath = path.join(CACHE_DIR, `${cacheKey}.cache`);

    if (fs.existsSync(cachedFilePath)) {
      try {
        const cachedData = fs.readFileSync(cachedFilePath);
        if (isValidImageBuffer(cachedData)) {
          const ct = getImageContentType(cachedData);
          res.set('Access-Control-Allow-Origin', '*');
          res.set('Content-Type', ct);
          res.set('Cache-Control', 'public, max-age=604800');
          res.set('X-Proxy-Cache', 'HIT');
          return res.send(cachedData);
        } else {
          // Corrupted or Cloudflare HTML challenge in cache -> delete immediately
          try { fs.unlinkSync(cachedFilePath); } catch (_) {}
        }
      } catch (err) {
        console.warn('[ImageProxy] Error reading cache file:', err.message);
      }
    }

    // Try fetching from upstream via axios
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
          'Referer': 'https://comicvine.gamespot.com/',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 6000
      });

      const buffer = Buffer.from(response.data);

      if (isValidImageBuffer(buffer)) {
        try {
          fs.writeFileSync(cachedFilePath, buffer);
        } catch (e) {
          console.warn('[ImageProxy] Failed to write cache:', e.message);
        }

        const contentType = getImageContentType(buffer);
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=604800');
        res.set('X-Proxy-Cache', 'MISS');
        return res.send(buffer);
      } else {
        console.warn(`[ImageProxy] Upstream returned non-image content for ${url.substring(0, 80)}`);
      }
    } catch (fetchErr) {
      console.warn(`[ImageProxy] Upstream axios fetch failed for ${url.substring(0, 80)}... Reason: ${fetchErr.response?.status || fetchErr.message}`);
    }

    // Clean Marvel SVG Fallback when upstream is inaccessible
    const svgContent = isAvatarLike ? generateMarvelAvatarSvg() : generateMarvelSvgCover(url);
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'public, max-age=86400');
    res.set('X-Proxy-Fallback', 'true');
    return res.status(200).send(svgContent);
  } catch (error) {
    console.error('[ImageProxy] Critical proxy error:', error);
    const fallbackSvg = generateMarvelSvgCover();
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Content-Type', 'image/svg+xml');
    return res.status(200).send(fallbackSvg);
  }
};

// In-memory debounce cache to prevent view spam: Map<key, timestamp>
// Key: `${ip}_${storyId}` -> expires after 10 minutes (600,000 ms)
const viewDebounceMap = new Map();

// Periodically clean up debounce map every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of viewDebounceMap.entries()) {
    if (now - timestamp > 600000) {
      viewDebounceMap.delete(key);
    }
  }
}, 900000);

exports.recordStoryView = async (req, res) => {
  try {
    const { id } = req.params;
    const { duration_seconds = 0 } = req.body;

    const story = await Story.findByPk(id);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy truyện.' });
    }

    // Anti-cheat rule 1: Must stay on page at least 15 seconds
    if (duration_seconds < 15) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian đọc chưa đủ điều kiện tối thiểu 15 giây để ghi nhận lượt xem.',
        current_views: story.view_count
      });
    }

    // Anti-cheat rule 2: IP / Session debounce within 10 minutes
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
    const debounceKey = `${clientIp}_story_${id}`;
    const lastViewedAt = viewDebounceMap.get(debounceKey);
    const now = Date.now();

    if (lastViewedAt && now - lastViewedAt < 600000) {
      return res.status(200).json({
        success: true,
        message: 'Lượt xem đã được ghi nhận gần đây (trong vòng 10 phút).',
        view_count: story.view_count
      });
    }

    // Record view in cache
    viewDebounceMap.set(debounceKey, now);

    // Atomic increment view count
    await story.increment('view_count', { by: 1 });
    await story.reload();

    return res.status(200).json({
      success: true,
      message: 'Đã ghi nhận lượt đọc hợp lệ thành công!',
      view_count: story.view_count
    });
  } catch (error) {
    console.error('Error recording story view:', error);
    return res.status(500).json({ success: false, message: 'Lỗi ghi nhận lượt đọc', error: error.message });
  }
};

/**
 * Đánh giá truyện (1-5 sao)
 * POST /api/stories/:id/rating
 */
exports.rateStory = async (req, res) => {
  try {
    const { id } = req.params;
    const { score, review } = req.body;
    const userId = req.user.id;

    if (req.user.status === 'restricted') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đang bị giới hạn, không thể thực hiện đánh giá truyện.'
      });
    }

    const numericScore = parseInt(score, 10);
    if (isNaN(numericScore) || numericScore < 1 || numericScore > 5) {
      return res.status(400).json({
        success: false,
        message: 'Điểm đánh giá phải là số nguyên từ 1 đến 5 sao.'
      });
    }

    const story = await Story.findByPk(id);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy truyện.' });
    }

    // Lưu hoặc cập nhật đánh giá (mỗi người 1 đánh giá cho mỗi truyện, có thể sửa lại)
    const [ratingRecord, created] = await StoryRating.findOrCreate({
      where: { user_id: userId, story_id: id },
      defaults: {
        user_id: userId,
        story_id: id,
        score: numericScore,
        review: review ? review.trim() : null
      }
    });

    if (!created) {
      ratingRecord.score = numericScore;
      if (review !== undefined) {
        ratingRecord.review = review ? review.trim() : null;
      }
      await ratingRecord.save();
    }

    // Tính lại trung bình và số lượt đánh giá thật
    const stats = await StoryRating.findAll({
      where: { story_id: id },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('score')), 'avgScore'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'ratingCount']
      ],
      raw: true
    });

    const averageRating = stats[0].avgScore ? Number(parseFloat(stats[0].avgScore).toFixed(1)) : null;
    const ratingCount = Number(stats[0].ratingCount || 0);

    // Cập nhật rating vào bảng Story
    await Story.update(
      { rating: averageRating !== null ? averageRating : 0 },
      { where: { id } }
    );

    return res.status(200).json({
      success: true,
      message: created ? 'Đánh giá truyện thành công!' : 'Cập nhật đánh giá truyện thành công!',
      data: {
        user_score: numericScore,
        average_rating: averageRating,
        rating_count: ratingCount,
        review: ratingRecord.review
      }
    });
  } catch (error) {
    console.error('Rate story error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi gửi đánh giá truyện.', error: error.message });
  }
};

/**
 * Lấy thống kê đánh giá và đánh giá cá nhân của truyện
 * GET /api/stories/:id/rating
 */
exports.getStoryRating = async (req, res) => {
  try {
    const { id } = req.params;

    const stats = await StoryRating.findAll({
      where: { story_id: id },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('score')), 'avgScore'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'ratingCount']
      ],
      raw: true
    });

    const averageRating = stats[0].avgScore ? Number(parseFloat(stats[0].avgScore).toFixed(1)) : null;
    const ratingCount = Number(stats[0].ratingCount || 0);

    let userRating = null;
    if (req.user) {
      const userRecord = await StoryRating.findOne({
        where: { story_id: id, user_id: req.user.id }
      });
      if (userRecord) {
        userRating = {
          score: userRecord.score,
          review: userRecord.review,
          updated_at: userRecord.updated_at
        };
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        average_rating: averageRating,
        rating_count: ratingCount,
        user_rating: userRating
      }
    });
  } catch (error) {
    console.error('Get story rating error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải đánh giá truyện.', error: error.message });
  }
};



