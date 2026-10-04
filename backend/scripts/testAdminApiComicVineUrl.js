const http = require('http');
const axios = require('axios');
const app = require('../src/app');
const jwt = require('jsonwebtoken');

async function testApiEndpoint() {
  console.log('=== [INTEGRATION TEST] /api/admin/comicvine/issue-by-url ===\n');

  const server = http.createServer(app);
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const adminToken = jwt.sign(
    { id: 1, role: 'admin', email: 'admin@marvel.local' },
    process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_for_development',
    { expiresIn: '1h' }
  );

  const client = axios.create({
    baseURL: baseUrl,
    headers: { Authorization: `Bearer ${adminToken}` },
    validateStatus: () => true
  });

  // 1. Test malformed link
  console.log('--- 1. Testing Malformed URL ---');
  const res1 = await client.get('/api/admin/comicvine/issue-by-url', {
    params: { url: 'https://invalid-url.com/something' }
  });

  console.log('Status:', res1.status, '| Body:', res1.data);
  if (res1.status === 400 && res1.data.message === 'Link không hợp lệ, vui lòng dán đúng link issue từ comicvine.gamespot.com') {
    console.log('PASS: Correct 400 response for malformed URL.');
  } else {
    console.error('FAIL: Expected 400 with specific message.');
  }

  // 2. Test non-existent issue
  console.log('\n--- 2. Testing 404 Non-existent Issue ---');
  const res2 = await client.get('/api/admin/comicvine/issue-by-url', {
    params: { url: 'https://comicvine.gamespot.com/fake-issue/4000-999999999/' }
  });

  console.log('Status:', res2.status, '| Body:', res2.data);
  if (res2.status === 404 && res2.data.message === 'Không tìm thấy issue này trên ComicVine') {
    console.log('PASS: Correct 404 response for non-existent issue.');
  } else {
    console.error('FAIL: Expected 404 with specific message.');
  }

  // 3. Test Avengers #21 URL with volume check
  console.log('\n--- 3. Testing Valid Avengers #21 URL ---');
  const res3 = await client.get('/api/admin/comicvine/issue-by-url', {
    params: {
      url: 'https://comicvine.gamespot.com/avengers-21/4000-1142913/',
      story_id: 1
    }
  });

  console.log('Status:', res3.status);
  console.log('Issue Title:', res3.data.issue?.title);
  console.log('Issue Cover:', res3.data.issue?.cover_image);
  console.log('Release Date:', res3.data.issue?.release_date);
  console.log('Volume Matches:', res3.data.volume_matches);

  if (res3.status === 200 && res3.data.success) {
    console.log('PASS: API returned 200 with valid issue object.');
    if (res3.data.issue.cover_image.includes('9912071-wwww.jpg')) {
      console.log('PASS: Exact cover image returned by API.');
    }
  } else {
    console.error('FAIL: Expected 200 response.');
  }

  process.exit(0);
}

testApiEndpoint().catch(err => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
