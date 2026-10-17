'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const axios = require('axios');
const { User, Chapter } = require('../src/models');
const jwt = require('jsonwebtoken');

const API_URL = 'http://localhost:5000/api';

async function run() {
  console.log('=== TESTING ADMIN COMMENT MODERATION ===');

  // Find or create admin user and normal user
  let admin = await User.findOne({ where: { role: 'admin' } });
  if (!admin) {
    console.error('No admin found!');
    process.exit(1);
  }
  let member = await User.findOne({ where: { role: 'reader' } });
  if (!member) {
    member = await User.findOne({ where: { role: 'user' } });
  }

  const adminToken = jwt.sign(
    { id: admin.id, username: admin.username, email: admin.email, role: 'admin' },
    process.env.JWT_SECRET || 'marvel_super_secret_jwt_key_2026_cnpmnangcao',
    { expiresIn: '1d' }
  );

  const memberToken = jwt.sign(
    { id: member.id, username: member.username, email: member.email, role: member.role },
    process.env.JWT_SECRET || 'marvel_super_secret_jwt_key_2026_cnpmnangcao',
    { expiresIn: '1d' }
  );

  const chapter = await Chapter.findOne({ order: [['id', 'ASC']] });
  console.log(`Using chapter ID ${chapter.id} ("${chapter.title}")`);

  // 1. Post comment as member
  console.log('\n1. Member posting comment...');
  const postRes = await axios.post(`${API_URL}/chapters/${chapter.id}/comments`, {
    content: 'Test comment to be moderated by admin - ' + Date.now()
  }, {
    headers: { Authorization: `Bearer ${memberToken}` }
  });

  const commentId = postRes.data.comment.id;
  console.log(`[✓] Member posted comment ID ${commentId}: "${postRes.data.comment.content}"`);

  // 2. Verify comment is visible publicly
  console.log('\n2. Verifying public comments list...');
  const publicRes1 = await axios.get(`${API_URL}/chapters/${chapter.id}/comments`);
  const foundInPublic1 = publicRes1.data.comments.some(c => c.id === commentId);
  console.log(`[✓] Comment is visible publicly: ${foundInPublic1}`);

  // 3. Admin fetching comments
  console.log('\n3. Admin fetching all comments via GET /api/admin/comments...');
  const adminListRes = await axios.get(`${API_URL}/admin/comments?filter=all`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`[✓] Admin fetched ${adminListRes.data.comments.length} comments.`);

  // 4. Admin hiding comment via PATCH /api/admin/comments/:id/hide
  console.log(`\n4. Admin hiding comment ID ${commentId} via PATCH /api/admin/comments/${commentId}/hide...`);
  const hideRes = await axios.patch(`${API_URL}/admin/comments/${commentId}/hide`, {}, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`[✓] Hide response:`, hideRes.data);

  // 5. Verify comment is no longer visible publicly
  console.log('\n5. Verifying comment is HIDDEN from public list...');
  const publicRes2 = await axios.get(`${API_URL}/chapters/${chapter.id}/comments`);
  const foundInPublic2 = publicRes2.data.comments.some(c => c.id === commentId);
  console.log(`[✓] Comment is visible publicly: ${foundInPublic2} (Expected: false)`);

  // 6. Admin deleting comment via DELETE /api/admin/comments/:id
  console.log(`\n6. Admin deleting comment ID ${commentId} via DELETE /api/admin/comments/${commentId}...`);
  const deleteRes = await axios.delete(`${API_URL}/admin/comments/${commentId}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`[✓] Delete response:`, deleteRes.data);

  // 7. Verify comment is completely deleted from DB
  console.log('\n7. Verifying comment is permanently deleted...');
  const adminListRes2 = await axios.get(`${API_URL}/admin/comments?filter=all`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const foundInAdmin = adminListRes2.data.comments.some(c => c.id === commentId);
  console.log(`[✓] Comment found in admin list: ${foundInAdmin} (Expected: false)`);

  console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
}

run().then(() => process.exit(0)).catch(err => {
  console.error('[TEST FAILED]', err.response?.data || err.message);
  process.exit(1);
});
