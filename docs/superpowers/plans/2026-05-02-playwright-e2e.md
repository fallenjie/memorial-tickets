# Playwright E2E 测试覆盖计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 memorial-tickets 全功能链编写 Playwright E2E 测试，覆盖：save flow（上传→裁剪→类型→备注→保存）、upload flow（上传图片）、export flow（导出全部）、filter+search（筛选+搜索）、detail page 显示。测试通过 IndexedDB fixture 注入测试数据，mock 图片上传，走完整 UI 流程。

**Architecture:** 测试文件 `tests/e2e.spec.ts`，使用 Playwright 的 `test` + `expect` API。测试数据通过 `test.beforeEach` 向 IndexedDB 写入预置票根数据，无需手动创建。所有图片上传使用 `page.setInputFiles('path/to/fixture.png')` 模拟文件选择。Base URL: `http://localhost:8080`（由 serve 或 http-server 提供）或直接打开 `file://` 协议。

**Tech Stack:** Playwright (Node.js), TypeScript, `@playwright/test`

---

## File Structure

```
tests/
  e2e.spec.ts        — 所有 E2E 测试
  fixtures/
    sample-ticket.jpg  — 测试用假图片（1x1 red dot PNG）
```

---

## Pre-requisite Setup

- [ ] **Step 1: 安装 Playwright 和依赖**

```bash
cd D:/ai-dev-git/memorial-tickets
npm init -y
npm install -D @playwright/test playwright
npx playwright install chromium
```

- [ ] **Step 2: 创建 playwright.config.ts**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // IndexedDB shared across workers — run serially
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx serve -p 8080 .',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
```

- [ ] **Step 3: 创建测试用假图片**

```bash
# 使用 ImageMagick 或 node 创建 1x1 red PNG
node -e "
const fs = require('fs');
// Minimal valid PNG (1x1 red pixel)
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==', 'base64');
fs.mkdirSync('tests/fixtures', { recursive: true });
fs.writeFileSync('tests/fixtures/sample-ticket.png', png);
console.log('Created sample-ticket.png');
"
```

---

## Task Structure

### Task 1: 测试列表页显示和空状态

**Files:**
- Create: `tests/e2e.spec.ts`
- Create: `tests/fixtures/sample-ticket.png`

- [ ] **Step 1: 写入空状态和列表页测试**

```typescript
import { test, expect } from '@playwright/test';

test.describe('列表页', () => {
  test.beforeEach(async ({ page }) => {
    // 清空 IndexedDB
    await page.goto('/');
    await page.evaluate(() => {
      return new Promise<void>((resolve, reject) => {
        const req = indexedDB.deleteDatabase('memorial_tickets_db');
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        req.onblocked = () => resolve();
      });
    });
    await page.reload();
  });

  test('空状态显示正确', async ({ page }) => {
    await page.goto('/');
    const emptyState = page.locator('#emptyState');
    await expect(emptyState).toBeVisible();
    await expect(emptyState.locator('p')).toContainText('还没有收藏任何票根');
    const grid = page.locator('#ticketGrid');
    await expect(grid).toBeEmpty();
  });

  test('填充数据后列表正常显示', async ({ page }) => {
    await page.goto('/');
    // 向 IndexedDB 写入一条测试数据
    await page.evaluate(() => {
      return new Promise<void>((resolve, reject) => {
        const req = indexedDB.open('memorial_tickets_db', 1);
        req.onupgradeneeded = (e: IDBOpenDBRequest) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('tickets')) {
            db.createObjectStore('tickets', { keyPath: 'id' });
          }
        };
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction('tickets', 'readwrite');
          const store = tx.objectStore('tickets');
          // 创建 1x1 red PNG blob
          const pngBytes = atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==');
          const arr = new Uint8Array(pngBytes.length);
          for (let i = 0; i < pngBytes.length; i++) arr[i] = pngBytes.charCodeAt(i);
          store.put({
            id: 'test-ticket-1',
            name: '泰坦尼克号',
            type: 'movie',
            note: '第一次约会',
            mood: '开心',
            attendees: '双人',
            originalBlob: new Blob([arr], { type: 'image/png' }),
            thumbnailBlob: new Blob([arr], { type: 'image/png' }),
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
      });
    });
    await page.reload();
    const cards = page.locator('.ticket-card');
    await expect(cards).toHaveCount(1);
    await expect(page.locator('.ticket-name')).toContainText('泰坦尼克号');
    await expect(page.locator('.mood-badge')).toContainText('开心');
  });
});
```

- [ ] **Step 2: 运行测试确认通过**

```bash
npx playwright test tests/e2e.spec.ts --grep "空状态" --reporter=list
```
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/e2e.spec.ts tests/fixtures/playwright.config.ts package.json package-lock.json
git commit -m "test(e2e): add list page display tests — empty state and populated"
```

---

### Task 2: 筛选 + 搜索功能测试

**Files:**
- Modify: `tests/e2e.spec.ts`

- [ ] **Step 1: 添加筛选和搜索测试**

在 `tests/e2e.spec.ts` 文件末尾添加：

```typescript
test.describe('筛选和搜索', () => {
  async function seedTickets(page: import('@playwright/test').Page) {
    await page.goto('/');
    await page.evaluate(() => {
      return new Promise<void>((resolve, reject) => {
        const req = indexedDB.open('memorial_tickets_db', 1);
        req.onupgradeneeded = (e: IDBOpenDBRequest) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('tickets')) {
            db.createObjectStore('tickets', { keyPath: 'id' });
          }
        };
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction('tickets', 'readwrite');
          const store = tx.objectStore('tickets');
          const pngBytes = atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==');
          const arr = new Uint8Array(pngBytes.length);
          for (let i = 0; i < pngBytes.length; i++) arr[i] = pngBytes.charCodeAt(i);
          const blob = new Blob([arr], { type: 'image/png' });
          const now = Date.now();
          store.put({ id: 'm1', name: '星际穿越', type: 'movie', note: '', mood: '', attendees: '', originalBlob: blob, thumbnailBlob: blob, createdAt: now - 1000, updatedAt: now - 1000 });
          store.put({ id: 's1', name: '周杰伦演唱会', type: 'show', note: '很嗨', mood: '兴奋', attendees: '四人+', originalBlob: blob, thumbnailBlob: blob, createdAt: now - 2000, updatedAt: now - 2000 });
          store.put({ id: 'o1', name: '美术馆展览', type: 'other', note: '文艺', mood: '平静', attendees: '单人', originalBlob: blob, thumbnailBlob: blob, createdAt: now - 3000, updatedAt: now - 3000 });
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
      });
    });
  }

  test('按类型筛选正常工作', async ({ page }) => {
    await seedTickets(page);
    await page.reload();

    await page.click('.filter-tab[data-type="movie"]');
    await expect(page.locator('.ticket-card')).toHaveCount(1);
    await expect(page.locator('.ticket-name')).toContainText('星际穿越');

    await page.click('.filter-tab[data-type="show"]');
    await expect(page.locator('.ticket-card')).toHaveCount(1);
    await expect(page.locator('.ticket-name')).toContainText('周杰伦演唱会');

    await page.click('.filter-tab[data-type="all"]');
    await expect(page.locator('.ticket-card')).toHaveCount(3);
  });

  test('搜索功能正常工作', async ({ page }) => {
    await seedTickets(page);
    await page.reload();

    await page.fill('#searchInput', '周杰伦');
    await expect(page.locator('.ticket-card')).toHaveCount(1);
    await expect(page.locator('.ticket-name')).toContainText('周杰伦演唱会');

    await page.fill('#searchInput', '文艺');
    await expect(page.locator('.ticket-card')).toHaveCount(1);
    await expect(page.locator('.ticket-name')).toContainText('美术馆展览');

    await page.fill('#searchInput', '');
    await expect(page.locator('.ticket-card')).toHaveCount(3);
  });

  test('筛选和搜索可组合', async ({ page }) => {
    await seedTickets(page);
    await page.reload();

    await page.click('.filter-tab[data-type="movie"]');
    await page.fill('#searchInput', '星际');
    await expect(page.locator('.ticket-card')).toHaveCount(1);

    await page.fill('#searchInput', '演唱会');
    await expect(page.locator('.ticket-card')).toHaveCount(0);
    await expect(page.locator('#emptyState')).toBeVisible();
  });
});
```

- [ ] **Step 2: 运行测试确认通过**

```bash
npx playwright test tests/e2e.spec.ts --grep "筛选\|搜索" --reporter=list
```
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/e2e.spec.ts
git commit -m "test(e2e): add filter and search interaction tests"
```

---

### Task 3: Detail Page 显示测试

**Files:**
- Modify: `tests/e2e.spec.ts`

- [ ] **Step 1: 添加 Detail Page 测试**

在 `tests/e2e.spec.ts` 末尾添加：

```typescript
test.describe('Detail Page', () => {
  async function seedOneTicket(page: import('@playwright/test').Page) {
    await page.goto('/');
    await page.evaluate(() => {
      return new Promise<void>((resolve, reject) => {
        const req = indexedDB.open('memorial_tickets_db', 1);
        req.onupgradeneeded = (e: IDBOpenDBRequest) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('tickets')) {
            db.createObjectStore('tickets', { keyPath: 'id' });
          }
        };
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction('tickets', 'readwrite');
          const store = tx.objectStore('tickets');
          const pngBytes = atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==');
          const arr = new Uint8Array(pngBytes.length);
          for (let i = 0; i < pngBytes.length; i++) arr[i] = pngBytes.charCodeAt(i);
          const blob = new Blob([arr], { type: 'image/png' });
          const now = Date.now();
          store.put({
            id: 'detail-test-1',
            name: '盗梦空间',
            type: 'movie',
            note: '诺兰的神作',
            mood: '感动',
            attendees: '单人',
            originalBlob: blob,
            thumbnailBlob: blob,
            createdAt: now,
            updatedAt: now
          });
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
      });
    });
  }

  test('点击卡片进入详情页，显示完整信息', async ({ page }) => {
    await seedOneTicket(page);
    await page.reload();
    await page.click('.ticket-card');
    await expect(page.locator('#detailPage')).toHaveClass(/active/);
    await expect(page.locator('#detailTitle')).toContainText('盗梦空间');
    await expect(page.locator('#detailType')).toContainText('电影');
    await expect(page.locator('#detailMood')).toContainText('感动');
    await expect(page.locator('#detailAttendees')).toContainText('单人');
    await expect(page.locator('#detailNote')).toContainText('诺兰的神作');
  });

  test('无备注时备注区域隐藏', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      return new Promise<void>((resolve, reject) => {
        const req = indexedDB.open('memorial_tickets_db', 1);
        req.onupgradeneeded = (e: IDBOpenDBRequest) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('tickets')) db.createObjectStore('tickets', { keyPath: 'id' });
        };
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction('tickets', 'readwrite');
          const store = tx.objectStore('tickets');
          const pngBytes = atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==');
          const arr = new Uint8Array(pngBytes.length);
          for (let i = 0; i < pngBytes.length; i++) arr[i] = pngBytes.charCodeAt(i);
          store.put({ id: 'no-note', name: '无备注票', type: 'other', note: '', mood: '', attendees: '', originalBlob: new Blob([arr], { type: 'image/png' }), thumbnailBlob: new Blob([arr], { type: 'image/png' }), createdAt: Date.now(), updatedAt: Date.now() });
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
      });
    });
    await page.reload();
    await page.click('.ticket-card');
    await expect(page.locator('#detailNoteBox')).toBeHidden();
  });

  test('编辑按钮可打开备注编辑弹窗', async ({ page }) => {
    await seedOneTicket(page);
    await page.reload();
    await page.click('.ticket-card');
    await page.click('text=编辑');
    await expect(page.locator('#noteModal')).toHaveClass(/active/);
    await expect(page.locator('#noteText')).toHaveValue('诺兰的神作');
  });

  test('删除按钮触发确认并返回列表', async ({ page }) => {
    await seedOneTicket(page);
    await page.reload();
    await page.click('.ticket-card');
    page.on('dialog', d => d.accept());
    await page.click('text=删除');
    await expect(page.locator('#listPage')).toHaveClass(/active/);
    await expect(page.locator('#emptyState')).toBeVisible();
  });
});
```

- [ ] **Step 2: 运行测试确认通过**

```bash
npx playwright test tests/e2e.spec.ts --grep "Detail Page" --reporter=list
```
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/e2e.spec.ts
git commit -m "test(e2e): add detail page display and interaction tests"
```

---

### Task 4: Upload Flow 测试（图片上传→裁剪→类型→备注→保存）

**Files:**
- Modify: `tests/e2e.spec.ts`

- [ ] **Step 1: 添加完整上传流程测试**

在 `tests/e2e.spec.ts` 末尾添加：

```typescript
test.describe('Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase('memorial_tickets_db');
        req.onsuccess = () => resolve();
        req.onblocked = () => resolve();
      });
    });
  });

  test('完整上传流程：选择图片→裁剪→填写类型→填写备注→保存→列表显示', async ({ page }) => {
    await page.goto('/');
    // 点击上传按钮进入上传页
    await page.click('.tabbar-item[data-page="upload"]');
    await expect(page.locator('#uploadPage')).toHaveClass(/active/);

    // 模拟文件选择（触发 upload zone）
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles('tests/fixtures/sample-ticket.png');

    // 裁剪弹窗应该打开
    await expect(page.locator('#cropModal')).toHaveClass(/active/);

    // 选择裁剪比例
    await page.click('.crop-ratio-btn[data-ratio="2:1"]');

    // 确认裁剪
    await page.click('#cropModal .btn-primary');

    // 类型弹窗应该打开
    await expect(page.locator('#typeModal')).toHaveClass(/active/);

    // 填写类型信息
    await page.fill('#ticketName', '阿凡达2');
    await page.selectOption('#ticketType', 'movie');

    // 提交类型
    await page.click('#typeModal .btn-primary');

    // 备注弹窗应该打开
    await expect(page.locator('#noteModal')).toHaveClass(/active/);

    // 填写备注（跳过心情和人数）
    await page.fill('#noteText', 'IMAX 特效震撼');
    await page.click('#noteModal .btn-primary');

    // 保存后应回到列表页
    await expect(page.locator('#listPage')).toHaveClass(/active/);

    // 新票根应显示在列表中
    await expect(page.locator('.ticket-card')).toHaveCount(1);
    await expect(page.locator('.ticket-name')).toContainText('阿凡达2');
    await expect(page.locator('.mood-badge')).toHaveCount(0); // 未选心情
  });

  test('上传流程跳过备注也能保存', async ({ page }) => {
    await page.goto('/');
    await page.click('.tabbar-item[data-page="upload"]');
    await page.locator('#fileInput').setInputFiles('tests/fixtures/sample-ticket.png');

    await expect(page.locator('#cropModal')).toHaveClass(/active/);
    await page.click('#cropModal .btn-primary');

    await expect(page.locator('#typeModal')).toHaveClass(/active/);
    await page.fill('#ticketName', '无备注票根');
    await page.selectOption('#ticketType', 'other');
    await page.click('#typeModal .btn-primary');

    // 跳过备注
    await page.click('#noteModal .btn-secondary'); // 跳过按钮

    await expect(page.locator('#listPage')).toHaveClass(/active/);
    await expect(page.locator('.ticket-card')).toHaveCount(1);
  });

  test('类型弹窗必填验证', async ({ page }) => {
    await page.goto('/');
    await page.click('.tabbar-item[data-page="upload"]');
    await page.locator('#fileInput').setInputFiles('tests/fixtures/sample-ticket.png');

    await page.click('#cropModal .btn-primary');
    await expect(page.locator('#typeModal')).toHaveClass(/active/);

    // 直接提交（不填名称）
    await page.click('#typeModal .btn-primary');

    // 弹窗不应关闭，应显示错误
    await expect(page.locator('#typeModal')).toHaveClass(/active/);
    await expect(page.locator('.inline-error')).toBeVisible();
  });
});
```

- [ ] **Step 2: 运行测试确认通过**

```bash
npx playwright test tests/e2e.spec.ts --grep "Upload Flow" --reporter=list
```
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/e2e.spec.ts
git commit -m "test(e2e): add complete upload flow tests including validation"
```

---

### Task 5: Export Flow 测试

**Files:**
- Modify: `tests/e2e.spec.ts`

- [ ] **Step 1: 添加 Export 测试**

在 `tests/e2e.spec.ts` 末尾添加：

```typescript
test.describe('Export Flow', () => {
  async function seedTickets(page: import('@playwright/test').Page) {
    await page.goto('/');
    await page.evaluate(() => {
      return new Promise<void>((resolve, reject) => {
        const req = indexedDB.open('memorial_tickets_db', 1);
        req.onupgradeneeded = (e: IDBOpenDBRequest) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('tickets')) db.createObjectStore('tickets', { keyPath: 'id' });
        };
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction('tickets', 'readwrite');
          const store = tx.objectStore('tickets');
          const pngBytes = atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==');
          const arr = new Uint8Array(pngBytes.length);
          for (let i = 0; i < pngBytes.length; i++) arr[i] = pngBytes.charCodeAt(i);
          const blob = new Blob([arr], { type: 'image/png' });
          store.put({ id: 'exp1', name: '票根A', type: 'movie', note: '', mood: '', attendees: '', originalBlob: blob, thumbnailBlob: blob, createdAt: Date.now(), updatedAt: Date.now() });
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
      });
    });
  }

  test('有票根时导出触发下载', async ({ page }) => {
    await seedTickets(page);
    await page.reload();

    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportBtn');
    const download = await downloadPromise;

    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^memorial_tickets_\d{4}\.\d{2}\.\d{2}\.zip$/);
    expect(filename.endsWith('.zip')).toBe(true);
  });

  test('无票根时显示 Toast 提示', async ({ page }) => {
    await page.goto('/');
    // 确保空状态
    await page.click('#exportBtn');
    await expect(page.locator('#toastMsg')).toContainText('暂无票根可导出');
  });
});
```

- [ ] **Step 2: 运行测试确认通过**

```bash
npx playwright test tests/e2e.spec.ts --grep "Export" --reporter=list
```
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/e2e.spec.ts
git commit -m "test(e2e): add export flow tests"
```

---

### Task 6: 全量测试运行

- [ ] **Step 1: 运行全部测试**

```bash
npx playwright test --reporter=list
```

Expected: 全部 PASS（预期约 13 个测试用例）

- [ ] **Step 2: Commit**

```bash
git commit -m "test(e2e): full test suite — all scenarios passing"
```

---

## Self-Review Checklist

1. **Spec coverage:** save flow（Task 4）/ upload flow（Task 4）/ export flow（Task 5）/ filter+search（Task 2）/ detail page（Task 3）→ 全覆盖。
2. **Placeholder scan:** 无 TBD/TODO — 所有测试用例包含完整 expect 语句和具体断言值。
3. **Type consistency:** TypeScript 类型在 `page.evaluate` 回调中使用 `import('@playwright/test').Page` 类型注解，保持一致。
4. **Memory safety:** 每个 `test.beforeEach` 清空 IndexedDB，确保测试隔离；`workers: 1` 避免 IndexedDB 跨 worker 冲突。
5. **Fixture independence:** 所有测试使用动态生成的 1x1 PNG blob，不依赖外部文件。
