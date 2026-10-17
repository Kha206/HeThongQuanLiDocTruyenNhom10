const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\Kha\\.gemini\\antigravity-ide\\brain\\388b07b7-146b-4ecf-a430-b3985e9f21d6';

(async () => {
  const list = await new Promise((res, rej) => {
    http.get('http://127.0.0.1:9222/json', r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(JSON.parse(d)));
    }).on('error', rej);
  });
  const page = list.find(p => p.url.includes('localhost:5173'));
  if (!page) {
    console.error('Page not found', list);
    process.exit(1);
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));
  let id = 1;
  const send = (method, params = {}) => new Promise((res) => {
    const msgId = id++;
    const handler = (data) => {
      const msg = JSON.parse(data);
      if (msg.id === msgId) {
        ws.off('message', handler);
        res(msg.result);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  console.log('=== TEST 1: KIỂM TRA LỖI 1 - NÚT "Xem chi tiết arc" TRÊN HERO SECTION ===');
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 2000));

  // Scroll to Slide 2 (activeSlide === 1)
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, window.innerHeight * 1.15);' });
  await new Promise(r => setTimeout(r, 800));

  const arcHitTest = await send('Runtime.evaluate', {
    expression: `(() => {
      const link = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Xem chi tiết arc'));
      if (!link) return { found: false };
      const rect = link.getBoundingClientRect();
      const elAtPoint = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return {
        found: true,
        text: link.textContent.trim(),
        href: link.getAttribute('href'),
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        elAtPointTag: elAtPoint ? elAtPoint.tagName : null,
        elAtPointClass: elAtPoint ? elAtPoint.className : null,
        isClickable: elAtPoint === link || (link.contains && link.contains(elAtPoint))
      };
    })()`,
    returnByValue: true
  });
  console.log('Arc Link Hit-Test:', JSON.stringify(arcHitTest.result.value, null, 2));

  // Click on the Arc Link
  const clickArcRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const link = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Xem chi tiết arc'));
      if (!link) return { error: 'link not found' };
      link.click();
      return { success: true };
    })()`,
    returnByValue: true
  });
  console.log('Click Arc Result:', clickArcRes.result.value);
  await new Promise(r => setTimeout(r, 1200));

  const navigatedUrl = await send('Runtime.evaluate', { expression: 'window.location.href', returnByValue: true });
  console.log('Navigated URL after clicking Arc Link:', navigatedUrl.result.value);

  // Take screenshot of Story Detail page
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_arc_navigation_success.png'), Buffer.from(shot1.data, 'base64'));
  console.log('Saved test_arc_navigation_success.png');

  console.log('\n=== TEST 2: KIỂM TRA LỖI 2 KHI CHƯA ĐĂNG NHẬP (LOGGED OUT) ===');
  // Clear localStorage
  await send('Runtime.evaluate', {
    expression: `(() => {
      localStorage.removeItem('marvel_auth_token');
      localStorage.removeItem('marvel_auth_user');
    })()`
  });
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 2000));

  // Scroll to Slide 4 (activeSlide === 3)
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, window.innerHeight * 3.3);' });
  await new Promise(r => setTimeout(r, 800));

  const loggedOutButton = await send('Runtime.evaluate', {
    expression: `(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const subLink = links.find(a => a.textContent.includes('Đăng Ký Đọc Gói') || a.textContent.includes('Gói Hội Viên'));
      if (!subLink) return { found: false, links: links.map(l => l.textContent) };
      return {
        found: true,
        text: subLink.textContent.trim(),
        href: subLink.getAttribute('href')
      };
    })()`,
    returnByValue: true
  });
  console.log('Logged-out Subscription Button on Home:', loggedOutButton.result.value);

  // Click subscription button
  await send('Runtime.evaluate', {
    expression: `(() => {
      const link = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Đăng Ký Đọc Gói') || a.textContent.includes('Gói Hội Viên'));
      if (link) link.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 1200));
  const subPageUrlLoggedOut = await send('Runtime.evaluate', { expression: 'window.location.href', returnByValue: true });
  console.log('Navigated URL from hero sub button (logged out):', subPageUrlLoggedOut.result.value);

  console.log('\n=== TEST 3: KIỂM TRA LỖI 2 KHI ĐÃ ĐĂNG NHẬP (LOGGED IN) ===');
  // Perform login via API / localStorage
  const loginRes = await send('Runtime.evaluate', {
    expression: `(async () => {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId: 'reader_vip@marvel.com', password: 'Marvel123!' })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('marvel_auth_token', data.token);
        localStorage.setItem('marvel_auth_user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      }
      return { success: false, data };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('Login Result:', loginRes.result.value);

  // Navigate back to Home
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 2000));

  // Check Navbar user display
  const navbarCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const navText = document.querySelector('nav')?.textContent || '';
      const userText = document.querySelector('.min-w-0, .truncate')?.textContent || '';
      return {
        url: window.location.href,
        hasUserInNavbar: !!document.querySelector('button img, button .rounded-full'),
        userNameInNav: userText
      };
    })()`,
    returnByValue: true
  });
  console.log('Navbar state when logged in:', navbarCheck.result.value);

  // Scroll to Slide 4
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, window.innerHeight * 3.3);' });
  await new Promise(r => setTimeout(r, 800));

  const loggedInButton = await send('Runtime.evaluate', {
    expression: `(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const subLink = links.find(a => a.textContent.includes('Gói Hội Viên VIP') || a.textContent.includes('Đăng Ký Đọc Gói'));
      if (!subLink) return { found: false };
      return {
        found: true,
        text: subLink.textContent.trim(),
        href: subLink.getAttribute('href')
      };
    })()`,
    returnByValue: true
  });
  console.log('Logged-in Subscription Button on Home:', loggedInButton.result.value);

  // Click Subscription Button when Logged In
  await send('Runtime.evaluate', {
    expression: `(() => {
      const link = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Gói Hội Viên VIP') || a.textContent.includes('Đăng Ký Đọc Gói'));
      if (link) link.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 1200));

  const subPageUrlLoggedIn = await send('Runtime.evaluate', { expression: 'window.location.href', returnByValue: true });
  console.log('Navigated URL from hero sub button (logged in):', subPageUrlLoggedIn.result.value);

  // Now test clicking a plan on SubscriptionsPage
  const clickPlanTest = await send('Runtime.evaluate', {
    expression: `(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const buyBtn = buttons.find(b => b.textContent.includes('Đăng Ký Ngay') || b.textContent.includes('Kích Hoạt') || b.textContent.includes('Gia Hạn Gói Này'));
      if (!buyBtn) return { error: 'buy button not found', buttons: buttons.map(b => b.textContent.trim()) };
      buyBtn.click();
      return { clicked: true, text: buyBtn.textContent.trim() };
    })()`,
    returnByValue: true
  });
  console.log('Click Plan button result:', clickPlanTest.result.value);
  await new Promise(r => setTimeout(r, 1000));

  const paymentModalCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.querySelector('.fixed.inset-0');
      const currentUrl = window.location.href;
      return {
        currentUrl,
        isPaymentModalOpen: !!modal,
        modalText: modal ? modal.textContent.slice(0, 150) : null
      };
    })()`,
    returnByValue: true
  });
  console.log('Payment modal check (should open directly without login redirect):', paymentModalCheck.result.value);

  // Take screenshot of payment modal open
  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_subscription_logged_in_flow.png'), Buffer.from(shot2.data, 'base64'));
  console.log('Saved test_subscription_logged_in_flow.png');

  ws.close();
  process.exit(0);
})();
