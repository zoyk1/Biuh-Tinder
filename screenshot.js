import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imgDir = path.join(__dirname, 'img');

if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

const BASE = 'http://localhost:5174';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. Landing page
  console.log('Capturing: Landing page...');
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 15000 });
  await sleep(3000);
  await page.screenshot({ path: path.join(imgDir, 'landing.png'), fullPage: true });
  console.log('  -> Saved landing.png');

  // 2. Click "登录认证" to go to login page
  console.log('Capturing: Login page...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const loginBtn = buttons.find(b => b.textContent.includes('登录认证'));
    if (loginBtn) loginBtn.click();
  });
  await sleep(2000);
  await page.screenshot({ path: path.join(imgDir, 'login.png'), fullPage: true });
  console.log('  -> Saved login.png');

  // 3. Register a new user via API, then log in via UI
  console.log('Registering test user via API...');
  const regRes = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '测试同学', email: 'test_screenshot@biuh.cn', password: '123456' })
  });
  let token = null;
  if (regRes.ok) {
    const data = await regRes.json();
    token = data.token;
    console.log('  -> Registered successfully');
  } else {
    // Try login instead
    const loginRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test_screenshot@biuh.cn', password: '123456' })
    });
    if (loginRes.ok) {
      const data = await loginRes.json();
      token = data.token;
      console.log('  -> Logged in successfully');
    }
  }

  if (token) {
    // Set token in localStorage and reload
    await page.evaluate((t) => {
      localStorage.setItem('biuh_token', t);
    }, token);
    await page.reload({ waitUntil: 'networkidle2', timeout: 15000 });
    await sleep(3000);
    await page.screenshot({ path: path.join(imgDir, 'login.png'), fullPage: true });
    console.log('  -> Updated login.png');
  }

  // Login via the form
  console.log('Logging in via form...');
  // Fill email
  await page.evaluate(() => {
    const emailInput = document.querySelector('input[placeholder*="邮箱"], input[placeholder*="BIUH"]');
    if (emailInput) {
      emailInput.value = 'test_screenshot@biuh.cn';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await sleep(500);
  // Fill password
  await page.evaluate(() => {
    const pwInput = document.querySelector('input[type="password"]');
    if (pwInput) {
      pwInput.value = '123456';
      pwInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await sleep(500);
  // Click login button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const loginBtn = btns.find(b => b.textContent.includes('登 录'));
    if (loginBtn) loginBtn.click();
  });
  await sleep(3000);

  // Check current state - might be onboarding
  const currentUrl = page.url();
  console.log('  -> Current URL after login:', currentUrl);
  await page.screenshot({ path: path.join(imgDir, 'onboarding.png'), fullPage: true });
  console.log('  -> Saved onboarding.png');

  // Complete onboarding
  console.log('Completing onboarding...');
  // Fill form fields
  await page.evaluate(() => {
    const majorInput = document.querySelector('input[placeholder*="计算机"]');
    if (majorInput) {
      majorInput.value = '软件工程';
      majorInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await sleep(300);
  await page.evaluate(() => {
    const locInput = document.querySelector('input[placeholder*="图书馆"]');
    if (locInput) {
      locInput.value = '图书馆三楼 & 创新实验室';
      locInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await sleep(300);
  await page.evaluate(() => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.value = '打篮球、听音乐、和朋友吃火锅';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await sleep(500);
  // Click submit button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const submitBtn = btns.find(b => b.textContent.includes('进入 BIUH'));
    if (submitBtn) submitBtn.click();
  });
  await sleep(4000);

  // Now we should be in the main app
  // 4. Discover / Star Graph page
  console.log('Capturing: Discover page...');
  await page.screenshot({ path: path.join(imgDir, 'discover.png'), fullPage: true });
  console.log('  -> Saved discover.png');

  // 5. Click on "校园圈" tab in sidebar
  console.log('Capturing: Moments page...');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const momentsTab = tabs.find(b => b.textContent.includes('校园圈'));
    if (momentsTab) momentsTab.click();
  });
  await sleep(3000);
  await page.screenshot({ path: path.join(imgDir, 'moments.png'), fullPage: true });
  console.log('  -> Saved moments.png');

  // 6. Click on "对话" tab
  console.log('Capturing: Messages page...');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const msgTab = tabs.find(b => b.textContent.includes('对话'));
    if (msgTab) msgTab.click();
  });
  await sleep(2000);
  await page.screenshot({ path: path.join(imgDir, 'messages.png'), fullPage: true });
  console.log('  -> Saved messages.png');

  // 7. Click on user avatar/name to go to profile
  console.log('Capturing: Profile page...');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const profileTab = tabs.find(b => b.textContent.includes('匹配'));
    if (profileTab) profileTab.click();
  });
  await sleep(1000);
  // Click user avatar in sidebar header
  await page.evaluate(() => {
    const avatar = document.querySelector('.w-10.h-10.rounded-full');
    if (avatar) avatar.click();
  });
  await sleep(2000);
  await page.screenshot({ path: path.join(imgDir, 'profile.png'), fullPage: true });
  console.log('  -> Saved profile.png');

  // 8. Also take a screenshot of the register page
  // First logout, then go to register
  console.log('Capturing: Register page...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const logoutBtn = btns.find(b => b.textContent.includes('退出登录'));
    if (logoutBtn) logoutBtn.click();
  });
  await sleep(2000);
  // Now on landing page
  // Click "登录认证"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const loginBtn = btns.find(b => b.textContent.includes('登录认证'));
    if (loginBtn) loginBtn.click();
  });
  await sleep(1000);
  // Click "注册加入"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const regBtn = btns.find(b => b.textContent.includes('注册加入'));
    if (regBtn) regBtn.click();
  });
  await sleep(1000);
  await page.screenshot({ path: path.join(imgDir, 'register.png'), fullPage: true });
  console.log('  -> Saved register.png');

  // 9. Landing page sub-views
  // Go back to landing
  console.log('Capturing: Landing sub-pages...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const backBtn = btns.find(b => b.textContent.includes('返回官网'));
    if (backBtn) backBtn.click();
  });
  await sleep(1000);

  // Click "关于我们"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const aboutBtn = btns.find(b => b.textContent.includes('关于我们'));
    if (aboutBtn) aboutBtn.click();
  });
  await sleep(2000);
  await page.screenshot({ path: path.join(imgDir, 'about.png'), fullPage: true });
  console.log('  -> Saved about.png');

  // Go back
  await page.evaluate(() => {
    const backBtns = Array.from(document.querySelectorAll('button'));
    const back = backBtns.find(b => b.querySelector('svg'));
    if (back) back.click();
  });
  await sleep(1000);

  // Click "社团活动"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const clubsBtn = btns.find(b => b.textContent.includes('社团活动'));
    if (clubsBtn) clubsBtn.click();
  });
  await sleep(2000);
  await page.screenshot({ path: path.join(imgDir, 'clubs.png'), fullPage: true });
  console.log('  -> Saved clubs.png');

  // Go back
  await page.evaluate(() => {
    const backBtns = Array.from(document.querySelectorAll('button'));
    const back = backBtns.find(b => b.querySelector('svg'));
    if (back) back.click();
  });
  await sleep(1000);

  // Click "周边商店"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const shopsBtn = btns.find(b => b.textContent.includes('周边商店'));
    if (shopsBtn) shopsBtn.click();
  });
  await sleep(2000);
  await page.screenshot({ path: path.join(imgDir, 'shops.png'), fullPage: true });
  console.log('  -> Saved shops.png');

  // Go back
  await page.evaluate(() => {
    const backBtns = Array.from(document.querySelectorAll('button'));
    const back = backBtns.find(b => b.querySelector('svg'));
    if (back) back.click();
  });
  await sleep(1000);

  // Click "校园安全指南"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const safetyBtn = btns.find(b => b.textContent.includes('校园安全指南'));
    if (safetyBtn) safetyBtn.click();
  });
  await sleep(2000);
  await page.screenshot({ path: path.join(imgDir, 'safety.png'), fullPage: true });
  console.log('  -> Saved safety.png');

  await browser.close();
  console.log('\nAll screenshots saved to img/ directory!');
}

main().catch(console.error);
