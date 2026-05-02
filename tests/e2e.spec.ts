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

test.describe('筛选和搜索', () => {
  async function seedTickets(page: any) {
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

test.describe('Detail Page', () => {
  async function seedOneTicket(page: any) {
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
          store.put({ id: 'detail-test-1', name: '盗梦空间', type: 'movie', note: '诺兰的神作', mood: '感动', attendees: '单人', originalBlob: blob, thumbnailBlob: blob, createdAt: Date.now(), updatedAt: Date.now() });
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
    await page.click('.tabbar-item[data-page="upload"]');
    await expect(page.locator('#uploadPage')).toHaveClass(/active/);
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles('tests/fixtures/sample-ticket.png');
    await expect(page.locator('#cropModal')).toHaveClass(/active/);
    await page.click('.crop-ratio-btn[data-ratio="2:1"]');
    await page.click('#cropModal .btn-primary');
    await expect(page.locator('#typeModal')).toHaveClass(/active/);
    await page.fill('#ticketName', '阿凡达2');
    await page.selectOption('#ticketType', 'movie');
    await page.click('#typeModal .btn-primary');
    await expect(page.locator('#noteModal')).toHaveClass(/active/);
    await page.fill('#noteText', 'IMAX 特效震撼');
    await page.click('#noteModal .btn-primary');
    await expect(page.locator('#listPage')).toHaveClass(/active/);
    await expect(page.locator('.ticket-card')).toHaveCount(1);
    await expect(page.locator('.ticket-name')).toContainText('阿凡达2');
  });

  test('上传流程跳过备注也能保存', async ({ page }) => {
    await page.goto('/');
    await page.click('.tabbar-item[data-page="upload"]');
    await page.locator('#fileInput').setInputFiles('tests/fixtures/sample-ticket.png');
    await page.click('#cropModal .btn-primary');
    await page.fill('#ticketName', '无备注票根');
    await page.selectOption('#ticketType', 'other');
    await page.click('#typeModal .btn-primary');
    await page.click('#noteModal .btn-secondary');
    await expect(page.locator('#listPage')).toHaveClass(/active/);
    await expect(page.locator('.ticket-card')).toHaveCount(1);
  });

  test('类型弹窗必填验证', async ({ page }) => {
    await page.goto('/');
    await page.click('.tabbar-item[data-page="upload"]');
    await page.locator('#fileInput').setInputFiles('tests/fixtures/sample-ticket.png');
    await page.click('#cropModal .btn-primary');
    await page.click('#typeModal .btn-primary');
    await expect(page.locator('#typeModal')).toHaveClass(/active/);
    await expect(page.locator('.inline-error')).toBeVisible();
  });
});

test.describe('Export Flow', () => {
  async function seedTickets(page: any) {
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
    await page.click('#exportBtn');
    await expect(page.locator('#toastMsg')).toContainText('暂无票根可导出');
  });
});