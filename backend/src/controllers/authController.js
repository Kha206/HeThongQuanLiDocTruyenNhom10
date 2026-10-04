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
    const { loginId, password } = req.body; // loginId can be email or username

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
