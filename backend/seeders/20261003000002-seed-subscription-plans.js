'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('subscription_plans', [
      {
        name: 'Gói Độc Giả Marvel (1 Tháng)',
        slug: 'goi-doc-gia-marvel-1-thang',
        description: 'Trải nghiệm không giới hạn kho truyện Marvel chuẩn nét trong 30 ngày.',
        price: 49000.00,
        duration_days: 30,
        badge: 'Tiêu Chuẩn',
        features: JSON.stringify([
          'Đọc toàn bộ chương truyện VIP không giới hạn',
          'Ảnh độ phân giải gốc cực nét từ Comic Vine',
          'Không có quảng cáo xen kẽ',
          'Đọc trên máy tính và điện thoại'
        ]),
        is_active: true,
        display_order: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Gói Siêu Anh Hùng (3 Tháng)',
        slug: 'goi-sieu-anh-hung-3-thang',
        description: 'Lựa chọn phổ biến nhất cho fan cứng Marvel, tiết kiệm 15% chi phí.',
        price: 129000.00,
        duration_days: 90,
        badge: 'Phổ Biến Nhất',
        features: JSON.stringify([
          'Mọi quyền lợi của Gói Độc Giả',
          'Mở khóa đọc sớm các issue Marvel mới cập nhật',
          'Huy hiệu Siêu Anh Hùng nổi bật trong bình luận',
          'Tiết kiệm 15% so với mua từng tháng'
        ]),
        is_active: true,
        display_order: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Gói Đa Vũ Trụ VIP (1 Năm)',
        slug: 'goi-da-vu-tru-vip-1-nam',
        description: 'Gói đặc quyền tối thượng, mở khóa toàn bộ vũ trụ Marvel suốt 365 ngày.',
        price: 399000.00,
        duration_days: 365,
        badge: 'Tiết Kiệm 35%',
        features: JSON.stringify([
          'Toàn bộ đặc quyền cao cấp nhất của nền tảng',
          'Đọc không giới hạn toàn bộ truyện và chapter suốt 365 ngày',
          'Huy hiệu Vàng Vũ Trụ Vô Cực độc quyền',
          'Tải truyện đọc offline (khi kích hoạt)',
          'Tiết kiệm đến 35% chi phí cả năm'
        ]),
        is_active: true,
        display_order: 3,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('subscription_plans', null, {});
  }
};
