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