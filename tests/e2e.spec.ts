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