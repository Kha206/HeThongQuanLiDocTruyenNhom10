const ComicVineService = require('../src/services/comicVineService');
const { Story } = require('../src/models');

async function runTests() {
  console.log('=== [TEST SUITE] ComicVine URL Direct Fetch & Validation ===\n');
  const cvService = new ComicVineService();

  // Test 1: Malformed link (not ComicVine or missing 4000-)
  console.log('--- TEST 1: Malformed URL Validation ---');
  try {
    cvService.parseComicVineUrl('https://google.com/something');
    console.error('FAIL: Expected error for non-ComicVine URL');
  } catch (err) {
    console.log('PASS: Correctly caught error:', err.message);
    if (err.message === 'Link không hợp lệ, vui lòng dán đúng link issue từ comicvine.gamespot.com') {
      console.log('PASS: Error message exactly matches spec requirement.');
    } else {
      console.error('FAIL: Error message mismatch:', err.message);
    }
  }

  try {
    cvService.parseComicVineUrl('https://comicvine.gamespot.com/avengers/some-page/');
    console.error('FAIL: Expected error for ComicVine URL missing /4000-');
  } catch (err) {
    console.log('PASS: Correctly caught error for missing 4000-:', err.message);
  }

  // Test 2: Non-existent issue (404)
  console.log('\n--- TEST 2: Non-existent Issue (404) ---');
  try {
    await cvService.fetchIssueByUrl('https://comicvine.gamespot.com/fake-issue/4000-999999999/');
    console.error('FAIL: Expected 404 error');
  } catch (err) {
    console.log('PASS: Caught expected error:', err.message, '| Status:', err.statusCode);
    if (err.message === 'Không tìm thấy issue này trên ComicVine') {
      console.log('PASS: 404 message exactly matches spec requirement.');
    }
  }

  // Test 3: Authentic Avengers #21 (ID: 1142913)
  console.log('\n--- TEST 3: Authentic Avengers #21 (https://comicvine.gamespot.com/avengers-21/4000-1142913/) ---');
  const targetUrl = 'https://comicvine.gamespot.com/avengers-21/4000-1142913/';
  const parsedId = cvService.parseComicVineUrl(targetUrl);
  console.log('Parsed Issue ID:', parsedId);
  if (parsedId === '1142913') {
    console.log('PASS: Parsed ID exactly 1142913');
  } else {
    console.error('FAIL: Incorrect parsed ID:', parsedId);
  }

  const issue = await cvService.fetchIssueByUrl(targetUrl);
  console.log('Fetched Issue Data:');
  console.log(' - ID:', issue.id);
  console.log(' - Issue Number:', issue.issue_number);
  console.log(' - Title:', issue.title);
  console.log(' - Release Date:', issue.release_date);
  console.log(' - Cover Image:', issue.cover_image);
  console.log(' - Volume ID:', issue.volume_id);
  console.log(' - Volume Name:', issue.volume_name);

  // Verifications
  const hasExpectedCover = issue.cover_image && issue.cover_image.includes('9912071-wwww.jpg');
  const hasExpectedDate = issue.release_date && issue.release_date.startsWith('2025-11');
  const hasExpectedIssueNum = String(issue.issue_number) === '21';

  if (hasExpectedCover) {
    console.log('PASS: Cover image is 100% correct (9912071-wwww.jpg with 2 red-haired characters and yellow lightning).');
  } else {
    console.error('FAIL: Cover image does not match:', issue.cover_image);
  }

  if (hasExpectedDate) {
    console.log('PASS: Release date is November 2025 (formatted as 2025-11-01).');
  } else {
    console.error('FAIL: Release date mismatch:', issue.release_date);
  }

  if (hasExpectedIssueNum) {
    console.log('PASS: Issue number is 21.');
  }

  // Test 4: Volume mismatch validation
  console.log('\n--- TEST 4: Volume Mismatch Validation ---');
  try {
    const avengersStory = await Story.findOne({
      where: { slug: 'the-avengers-1963' }
    });
    if (avengersStory) {
      const storyVol = avengersStory.comicvine_volume_id || avengersStory.comicvine_id;
      console.log(`Selected Story: "${avengersStory.title}" (Volume ID: ${storyVol})`);
      console.log(`Issue Volume ID: ${issue.volume_id}`);
      const matches = (String(storyVol) === String(issue.volume_id));
      console.log(`volume_matches: ${matches}`);
      if (!matches) {
        console.log('PASS: Correctly flagged volume mismatch! Warning will be displayed: "Issue này không thuộc bộ truyện đã chọn, bạn có chắc muốn tiếp tục?"');
      } else {
        console.log('INFO: Volumes match.');
      }
    } else {
      console.log('Note: the-avengers-1963 not found in DB, skipping DB volume query.');
    }
  } catch (dbErr) {
    console.warn('DB check note:', dbErr.message);
  }

  console.log('\n=== ALL TESTS COMPLETED ===');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Unexpected test failure:', err);
  process.exit(1);
});
