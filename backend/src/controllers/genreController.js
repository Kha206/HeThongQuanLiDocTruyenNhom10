const { Genre } = require('../models');

exports.getAllGenres = async (req, res) => {
  try {
    const genres = await Genre.findAll({
      order: [['name', 'ASC']]
    });
    return res.status(200).json({
      success: true,
      genres
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi tải thể loại', error: error.message });
  }
};
