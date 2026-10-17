const jwt = require('jsonwebtoken');
const { User } = require('../models');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'marvel_super_secret_jwt_key_2026_cnpmnangcao',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp username, email và password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.' });
    }

    // Check existing
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: 'Email đã được đăng ký.' });
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(409).json({ success: false, message: 'Username đã được sử dụng.' });
    }

    const newUser = await User.create({
      username,
      email,
      password,
      full_name: full_name || username,
      role: 'reader',
      avatar: null
    });

    const token = generateToken(newUser);

    const userObj = newUser.toJSON();
    delete userObj.password;

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      token,
      user: userObj
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký.', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const loginId = req.body.loginId || req.body.username || req.body.email;
    const { password } = req.body;

    if (!loginId || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tài khoản/email và mật khẩu.' });
    }

    const user = await User.findOne({
      where: loginId.includes('@') ? { email: loginId } : { username: loginId }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không chính xác.' });
    }

    const isMatch = await user.checkPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không chính xác.' });
    }

    // Kiểm tra trạng thái tài khoản
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị tạm ngừng hoạt động do vi phạm điều khoản dịch vụ.' + (user.status_reason ? ` Lý do: ${user.status_reason}` : ' Vui lòng liên hệ ban quản trị để được hỗ trợ.')
      });
    }

    const token = generateToken(user);

    const userObj = user.toJSON();
    delete userObj.password;

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      token,
      user: userObj
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi đăng nhập.', error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi server.', error: error.message });
  }
};

exports.logout = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Đăng xuất thành công!'
  });
};

const crypto = require('crypto');
const emailService = require('../services/emailService');
const { PasswordReset } = require('../models');
const { Op } = require('sequelize');

/**
 * Đổi mật khẩu cho người dùng đã đăng nhập
 */
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mật khẩu cũ và mật khẩu mới.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có độ dài tối thiểu 8 ký tự.' });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Xác nhận mật khẩu mới không khớp.' });
    }

    // Lấy lại user kèm mật khẩu
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    const isMatch = await user.checkPassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu cũ không chính xác.' });
    }

    // Cập nhật mật khẩu mới (hook beforeSave sẽ tự động hash bằng bcrypt)
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công!'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi đổi mật khẩu.', error: error.message });
  }
};

/**
 * Yêu cầu đặt lại mật khẩu qua email
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập địa chỉ email.' });
    }

    const user = await User.findOne({ where: { email } });

    // Để bảo mật và tránh lộ thông tin tài khoản (enumeration attack),
    // thông báo trả về luôn giống nhau dù email có tồn tại hay không.
    if (user && user.status !== 'suspended') {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 phút

      // Vô hiệu hóa các token cũ chưa dùng của user này
      await PasswordReset.update(
        { used_at: new Date() },
        { where: { user_id: user.id, used_at: null } }
      );

      await PasswordReset.create({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt
      });

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;

      // Gửi link đặt lại qua emailService abstraction
      await emailService.sendPasswordResetEmail({
        toEmail: user.email,
        username: user.full_name || user.username,
        resetUrl
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Nếu địa chỉ email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hòm thư của bạn.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi yêu cầu đặt lại mật khẩu.', error: error.message });
  }
};

/**
 * Đặt lại mật khẩu với token
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã token và mật khẩu mới.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có tối thiểu 8 ký tự.' });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Xác nhận mật khẩu mới không khớp.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetRecord = await PasswordReset.findOne({
      where: {
        token_hash: tokenHash,
        used_at: null,
        expires_at: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn (chỉ có hiệu lực trong 30 phút và dùng 1 lần).'
      });
    }

    const user = await User.findByPk(resetRecord.user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
    }

    // Cập nhật mật khẩu mới
    user.password = newPassword;
    await user.save();

    // Đánh dấu token đã sử dụng
    resetRecord.used_at = new Date();
    await resetRecord.save();

    return res.status(200).json({
      success: true,
      message: 'Mật khẩu của bạn đã được đặt lại thành công! Bạn có thể đăng nhập ngay bằng mật khẩu mới.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi đặt lại mật khẩu.', error: error.message });
  }
};

/**
 * Cập nhật hồ sơ cá nhân
 */
exports.updateProfile = async (req, res) => {
  try {
    const { full_name } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    if (full_name !== undefined) {
      user.full_name = full_name.trim();
    }

    await user.save();

    const userObj = user.toJSON();
    delete userObj.password;

    return res.status(200).json({
      success: true,
      message: 'Cập nhật hồ sơ cá nhân thành công!',
      user: userObj
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi cập nhật hồ sơ.', error: error.message });
  }
};

/**
 * Upload ảnh đại diện từ máy tính
 */
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn file ảnh để tải lên.' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    const userObj = user.toJSON();
    delete userObj.password;

    return res.status(200).json({
      success: true,
      message: 'Cập nhật ảnh đại diện thành công!',
      avatar: user.avatar,
      avatarUrl: user.avatar,
      user: userObj
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi tải ảnh đại diện.', error: error.message });
  }
};

