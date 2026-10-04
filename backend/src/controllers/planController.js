const { SubscriptionPlan } = require('../models');
const { Op } = require('sequelize');
const slugify = require('slugify');

// Lấy danh sách gói đọc (Public: chỉ lấy gói active; Admin: có thể lấy tất cả nếu truyền all=true)
exports.getAllPlans = async (req, res) => {
  try {
    const { all } = req.query;
    const where = {};
    if (!all || all !== 'true') {
      where.is_active = true;
      where.slug = { [Op.notLike]: 'test-%' };
    }

    const plans = await SubscriptionPlan.findAll({
      where,
      order: [
        ['display_order', 'ASC'],
        ['price', 'ASC']
      ]
    });

    return res.status(200).json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi tải danh sách gói đọc',
      error: error.message
    });
  }
};

// Lấy chi tiết một gói đọc
exports.getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findByPk(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy gói đọc.'
      });
    }

    return res.status(200).json({
      success: true,
      plan
    });
  } catch (error) {
    console.error('Error fetching plan detail:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi tải chi tiết gói đọc',
      error: error.message
    });
  }
};

// Tạo mới gói đọc (Admin)
exports.createPlan = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      duration_days = 30,
      badge,
      features,
      is_active = true,
      display_order = 0
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Tên gói và giá tiền là bắt buộc.'
      });
    }

    let slug = slugify(name, { lower: true, strict: true });
    const existing = await SubscriptionPlan.findOne({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const plan = await SubscriptionPlan.create({
      name,
      slug,
      description,
      price: parseFloat(price),
      duration_days: parseInt(duration_days) || 30,
      badge,
      features: Array.isArray(features) ? features : (typeof features === 'string' ? JSON.parse(features) : []),
      is_active: Boolean(is_active),
      display_order: parseInt(display_order) || 0
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo gói đọc thành công!',
      plan
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi tạo gói đọc mới',
      error: error.message
    });
  }
};

// Cập nhật gói đọc (Admin)
exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      duration_days,
      badge,
      features,
      is_active,
      display_order
    } = req.body;

    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy gói đọc.'
      });
    }

    let slug = plan.slug;
    if (name && name !== plan.name) {
      slug = slugify(name, { lower: true, strict: true });
      const existing = await SubscriptionPlan.findOne({ where: { slug } });
      if (existing && existing.id !== plan.id) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }
    }

    await plan.update({
      name: name || plan.name,
      slug,
      description: description !== undefined ? description : plan.description,
      price: price !== undefined ? parseFloat(price) : plan.price,
      duration_days: duration_days !== undefined ? parseInt(duration_days) : plan.duration_days,
      badge: badge !== undefined ? badge : plan.badge,
      features: features !== undefined
        ? (Array.isArray(features) ? features : (typeof features === 'string' ? JSON.parse(features) : []))
        : plan.features,
      is_active: is_active !== undefined ? Boolean(is_active) : plan.is_active,
      display_order: display_order !== undefined ? parseInt(display_order) : plan.display_order
    });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật gói đọc thành công!',
      plan
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật gói đọc',
      error: error.message
    });
  }
};

// Bật / tắt nhanh trạng thái gói đọc (Admin)
exports.togglePlanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy gói đọc.'
      });
    }

    await plan.update({ is_active: !plan.is_active });

    return res.status(200).json({
      success: true,
      message: `Đã ${plan.is_active ? 'kích hoạt' : 'tạm ngưng'} gói đọc thành công!`,
      plan
    });
  } catch (error) {
    console.error('Error toggling plan status:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi thay đổi trạng thái gói đọc',
      error: error.message
    });
  }
};

// Xóa gói đọc (Admin)
exports.deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy gói đọc.'
      });
    }

    await plan.destroy();

    return res.status(200).json({
      success: true,
      message: 'Đã xóa gói đọc thành công.'
    });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi xóa gói đọc',
      error: error.message
    });
  }
};
