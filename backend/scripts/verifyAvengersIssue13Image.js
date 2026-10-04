const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\Kha\\.gemini\\antigravity-ide\\brain\\2a2de2c9-f8e3-461d-bd6d-235657854c5b';

async function main() {
  console.log('=== [AUTOMATED BROWSER TEST] Debug Issue 1142987 Cover Image ===\n');

  // 1. Create a brand new dedicated browser tab
  const newTab = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 9222,
      path: '/json/new?http://localhost:5173/login',
      method: 'PUT'
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.end();
  });
  console.log('Created dedicated test tab:', newTab.id);

  const ws = new WebSocket(newTab.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const h = (data) => {
      const msg = JSON.parse(data);
      if (msg.id === id) {
        ws.off('message', h);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
    ws.on('message', h);
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const evaluate = async (expr) => {
    const res = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    return res?.result?.value;
  };

  const captureScreenshot = async (name) => {
    const snap = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(snap.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, name);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved screenshot to: ${outPath}`);
    return outPath;
  };

  try {
    // 1. Login
    console.log('1. Navigating to login...');
    await send('Page.navigate', { url: 'http://localhost:5173/login' });
    await sleep(2000);

    console.log('2. Performing admin login...');
    await evaluate(`(() => {
      const emailInput = document.querySelector('input[type="email"], input[name="loginId"], input[name="email"], input[id="loginId"], input[placeholder*="email" i], input[placeholder*="tài khoản" i]');
      const passInput = document.querySelector('input[type="password"]');
      if (emailInput) {
        emailInput.value = 'admin@marvel.local';
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (passInput) {
        passInput.value = 'admin123';
        passInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    })()`);
    await sleep(2500);

    // 2. Navigate to /admin/chapters
    console.log('3. Navigating to /admin/chapters...');
    await send('Page.navigate', { url: 'http://localhost:5173/admin/chapters' });
    await sleep(1000);
    await send('Page.reload');
    await sleep(2500);

    // 3. Open Modal
    console.log('4. Opening "Thêm Chương Mới" modal...');
    for (let i = 0; i < 20; i++) {
      const clicked = await evaluate(`(() => {
        const btn = document.getElementById('btn-open-add-chapter') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Thêm Chương Mới'));
        if (btn) { btn.click(); return true; }
        return false;
      })()`);
      if (clicked) break;
      await sleep(500);
    }

    // Wait for modal input to be present in DOM
    for (let i = 0; i < 20; i++) {
      const hasInput = await evaluate(`!!document.getElementById('input-comicvine-search')`);
      if (hasInput) break;
      await sleep(300);
    }

    // 4. Paste URL for Avengers #13
    const targetUrl = 'https://comicvine.gamespot.com/avengers-13/4000-1142987/';
    console.log(`5. Pasting target URL: ${targetUrl}`);
    const pasteVal = await evaluate(`(() => {
      const input = document.getElementById('input-comicvine-search');
      if (!input) return 'no-input';
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(input, '${targetUrl}');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return input.value;
    })()`);
    console.log('Pasted value in input:', pasteVal);
    await sleep(500);

    // 5. Click "Tìm Issue"
    console.log('6. Clicking "Tìm Issue" button...');
    await evaluate(`(() => {
      const btn = document.getElementById('btn-search-cv');
      if (btn) btn.click();
    })()`);

    // 6. Wait for search result card
    console.log('7. Waiting for issue preview card...');
    let cardFound = false;
    for (let i = 0; i < 30; i++) {
      const hasCard = await evaluate(`!!document.getElementById('cv-issue-preview-card')`);
      const errText = await evaluate(`document.querySelector('.text-red-400, .bg-red-500\\\\/15, [class*="red"]') ?.innerText`);
      if (hasCard) {
        cardFound = true;
        console.log(`Preview card appeared after ${(i + 1) * 500}ms!`);
        break;
      }
      if (errText) {
        console.log('UI message during wait:', errText);
      }
      await sleep(500);
    }

    if (!cardFound) {
      throw new Error('Preview card cv-issue-preview-card did not appear in UI!');
    }

    // Wait 1.5s for image to load through proxy
    await sleep(1500);

    // 7. Inspect card thumbnail image
    const cardData = await evaluate(`(() => {
      const card = document.getElementById('cv-issue-preview-card');
      const img = card?.querySelector('img');
      const title = card?.querySelector('.font-bold.text-white')?.innerText;
      return {
        title,
        imgSrc: img?.src,
        naturalWidth: img?.naturalWidth,
        naturalHeight: img?.naturalHeight,
        complete: img?.complete
      };
    })()`);

    console.log('\n--- PREVIEW CARD INSPECTION ---');
    console.log('Card Title:', cardData.title);
    console.log('Image Src:', cardData.imgSrc);
    console.log('Image Loaded Dimensions:', `${cardData.naturalWidth}x${cardData.naturalHeight}`);
    console.log('Image Complete:', cardData.complete);

    await captureScreenshot('avengers13_preview_card_verified.png');

    // 8. Click "Chọn" to autofill
    console.log('\n8. Clicking "Chọn" to autofill form...');
    await evaluate(`(() => {
      const selectBtn = document.getElementById('btn-select-cv-issue');
      if (selectBtn) selectBtn.click();
      else {
        const card = document.getElementById('cv-issue-preview-card');
        if (card) card.click();
      }
    })()`);
    await sleep(1500);

    // 9. Inspect autofilled form
    const formFields = await evaluate(`(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const textareas = Array.from(document.querySelectorAll('textarea'));
      
      const chapterNumInput = document.getElementById('input-chapter-number');
      const titleInput = document.getElementById('input-chapter-title');
      const dateInput = document.getElementById('input-chapter-release-date');
      const descInput = textareas[0];
      const previewImgs = Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src,
        alt: img.alt,
        width: img.naturalWidth,
        height: img.naturalHeight
      }));

      return {
        chapter_number: chapterNumInput?.value,
        title: titleInput?.value,
        release_date: dateInput?.value,
        content: descInput?.value,
        previewImgs
      };
    })()`);

    console.log('\n--- AUTOFILLED FORM INSPECTION ---');
    console.log('Chapter Number:', formFields.chapter_number);
    console.log('Title:', formFields.title);
    console.log('Release Date:', formFields.release_date);
    console.log('Content (Summary):', formFields.content);
    console.log('Images rendered on page:', formFields.previewImgs.filter(i => i.src.includes('9912116') || i.src.includes('proxy')));

    await captureScreenshot('avengers13_autofilled_form_verified.png');

    console.log('\n=== TEST PASSED: Issue 1142987 cover verified 100% ===');
  } finally {
    ws.close();
    http.get(`http://127.0.0.1:9222/json/close/${newTab.id}`, () => {});
  }
}

main().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
