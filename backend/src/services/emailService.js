'use strict';

/**
 * emailService.js
 * Abstraction layer for sending emails.
 * In development / test environments without SMTP, prints email details cleanly to the console.
 * Easily replaceable with Nodemailer / SendGrid / Amazon SES in production.
 */
class EmailService {
  async sendPasswordResetEmail({ toEmail, username, resetUrl }) {
    console.log('\n================================================================');
    console.log('📧 [EMAIL SERVICE - MÔ PHỎNG GỬI EMAIL]');
    console.log(`Người nhận: ${username ? `${username} <${toEmail}>` : toEmail}`);
    console.log('Tiêu đề: [Marvel Comics Hub] Yêu cầu đặt lại mật khẩu');
    console.log('Nội dung:');
    console.log(`  Xin chào ${username || 'bạn'},`);
    console.log('  Hệ thống nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.');
    console.log(`  Vui lòng nhấn vào đường link bên dưới để đặt lại mật khẩu (hiệu lực trong 30 phút):`);
    console.log(`  👉 ${resetUrl}`);
    console.log('  Nếu bạn không yêu cầu điều này, xin vui lòng bỏ qua thư này.');
    console.log('================================================================\n');

    return {
      success: true,
      simulated: true,
      to: toEmail,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new EmailService();
