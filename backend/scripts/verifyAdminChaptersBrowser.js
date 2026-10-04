const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\Kha\\.gemini\\antigravity-ide\\brain\\2a2de2c9-f8e3-461d-bd6d-235657854c5b';

async function main() {
  console.log('=== [BROWSER AUTOMATION TEST] Testing ComicVine URL Search in Admin Chapters ===\n');

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
  console.log('Created dedicated test tab:', newTab.id, newTab.url);

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

  // Enable Page & Runtime
  await send('Page.enable');
  await send('Runtime.enable');

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Helper evaluate
  const evaluate = async (expr) => {
    const res = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    return res?.result?.value;
  };

  // Helper screenshot
  const captureScreenshot = async (name) => {
    const snap = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(snap.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, name);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved screenshot to: ${outPath}`);
    return outPath;
  };

  try {
    // Step 1: Navigate to login
    console.log('1. Navigating to http://localhost:5173/login...');
    await send('Page.navigate', { url: 'http://localhost:5173/login' });
    await sleep(2000);

    // Step 2: Login as admin
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

    // Step 3: Navigate to /admin/chapters
    console.log('3. Navigating to http://localhost:5173/admin/chapters...');
    await send('Page.navigate', { url: 'http://localhost:5173/admin/chapters' });
    await sleep(1000);
    await send('Page.reload');
    await sleep(2500);

    // Step 4: Open Add Chapter Modal
    console.log('4. Opening "Thêm Chương Mới" modal...');
    await evaluate(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Thêm Chương Mới') || b.innerText.includes('Thêm chương'));
      if (btn) btn.click();
    })()`);
    await sleep(1500);

    // Step 5: Check input label & placeholder
    console.log('5. Checking input label and placeholder...');
    const inputMeta = await evaluate(`(() => {
      const input = document.getElementById('input-comicvine-search');
      const label = document.querySelector('label[for="input-comicvine-search"], .text-xs.font-bold.text-white');
      return {
        placeholder: input?.placeholder,
        exists: !!input,
        labelText: input?.parentElement?.previousElementSibling?.innerText || label?.innerText
      };
    })()`);
    console.log('Input Info:', inputMeta);

    // Step 6: Paste URL: https://comicvine.gamespot.com/avengers-21/4000-1142913/
    console.log('6. Pasting ComicVine issue URL...');
    const targetUrl = 'https://comicvine.gamespot.com/avengers-21/4000-1142913/';
    const pasteResult = await evaluate(`(() => {
      const input = document.getElementById('input-comicvine-search');
      if (!input) return 'input not found';
      const lastVal = input.value;
      input.value = '${targetUrl}';
      if (input._valueTracker) {
        input._valueTracker.setValue(lastVal);
      }
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return input.value;
    })()`);
    console.log('Paste result:', pasteResult);
    await sleep(500);

    // Step 7: Click "Tìm Issue"
    console.log('7. Clicking "Tìm Issue" button...');
    await evaluate(`(() => {
      const btn = document.getElementById('btn-search-cv');
      if (btn) btn.click();
    })()`);

    // Wait for search result to load (poll up to 15s)
    console.log('Waiting for search results...');
    for (let i = 0; i < 30; i++) {
      const hasCard = await evaluate(`!!document.getElementById('cv-issue-preview-card')`);
      const errText = await evaluate(`document.querySelector('.text-red-400, .bg-red-500\\\\/15')?.innerText`);
      if (hasCard) {
        console.log(`Search result appeared after ${(i + 1) * 500}ms!`);
        break;
      }
      if (errText) {
        console.log(`UI error displayed: ${errText}`);
      }
      await sleep(500);
    }

    // Step 8: Verify result preview card and volume warning
    const searchResultData = await evaluate(`(() => {
      const warningEl = document.querySelector('.bg-amber-500\\\\/15, [class*="amber"]');
      const card = document.getElementById('cv-issue-preview-card');
      const img = card?.querySelector('img')?.src;
      const title = card?.querySelector('.font-bold.text-white')?.innerText;
      const selectBtn = document.getElementById('btn-select-cv-issue');
      
      const warningText = warningEl?.innerText;

      return {
        cardFound: !!card,
        title,
        img,
        warningText,
        hasSelectBtn: !!selectBtn
      };
    })()`);
    console.log('Search Result in UI:', searchResultData);

    await captureScreenshot('comicvine_search_result_preview.png');

    // Step 9: Click "Chọn" to autofill form
    console.log('8. Clicking "Chọn" to autofill form...');
    await evaluate(`(() => {
      const selectBtn = document.getElementById('btn-select-cv-issue');
      if (selectBtn) {
        selectBtn.click();
      } else {
        const card = document.getElementById('cv-issue-preview-card');
        if (card) card.click();
      }
    })()`);
    await sleep(1500);

    // Step 10: Inspect autofilled form fields
    console.log('9. Checking autofilled form fields...');
    const formFields = await evaluate(`(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const textareas = Array.from(document.querySelectorAll('textarea'));
      
      const chapterNumInput = inputs.find(i => i.placeholder?.includes('Ví dụ: 1') || i.name === 'chapter_number' || i.id === 'chapter_number');
      const titleInput = inputs.find(i => i.placeholder?.includes('Ví dụ: Chapter 1') || i.name === 'title' || i.id === 'title');
      const dateInput = inputs.find(i => i.type === 'date' || i.name === 'release_date');
      const descInput = textareas[0];
      const previewImg = document.querySelector('img[alt="Cover Preview"], img[src*="9912071-wwww"]');

      return {
        chapter_number: chapterNumInput?.value,
        title: titleInput?.value,
        release_date: dateInput?.value,
        content: descInput?.value?.slice(0, 80) + '...',
        cover_preview_src: previewImg?.src
      };
    })()`);
    console.log('Autofilled Form Data:', formFields);

    await captureScreenshot('comicvine_autofilled_form.png');

    console.log('\n=== BROWSER AUTOMATION COMPLETED SUCCESSFULLY ===');
  } finally {
    ws.close();
  }
}

main().catch(err => {
  console.error('Browser automation failed:', err);
  process.exit(1);
});
