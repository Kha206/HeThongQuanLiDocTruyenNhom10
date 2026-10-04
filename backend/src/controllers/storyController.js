const { Story, Genre, Chapter, sequelize } = require('../models');
const { Op } = require('sequelize');

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
      order = [['rating', 'DESC']];
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

const axios = require('axios');

exports.proxyImage = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).send('URL query parameter is required');
    }
    console.log('[ImageProxy] Requesting image URL:', url);

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    res.set('Access-Control-Allow-Origin', '*');
    res.set('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    return res.send(Buffer.from(response.data));
  } catch (error) {
    res.set('Access-Control-Allow-Origin', '*');
    return res.status(error.response ? error.response.status : 502).send('Error loading proxy image');
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


