# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\e2e.spec.ts >> 筛选和搜索 >> 筛选和搜索可组合
- Location: tests\e2e.spec.ts:129:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('列表页', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // 清空 IndexedDB
  6   |     await page.goto('/');
  7   |     await page.evaluate(() => {
  8   |       return new Promise<void>((resolve, reject) => {
  9   |         const req = indexedDB.deleteDatabase('memorial_tickets_db');
  10  |         req.onsuccess = () => resolve();
  11  |         req.onerror = () => reject(req.error);
  12  |         req.onblocked = () => resolve();
  13  |       });
  14  |     });
  15  |     await page.reload();
  16  |   });
  17  | 
  18  |   test('空状态显示正确', async ({ page }) => {
  19  |     await page.goto('/');
  20  |     const emptyState = page.locator('#emptyState');
  21  |     await expect(emptyState).toBeVisible();
  22  |     await expect(emptyState.locator('p')).toContainText('还没有收藏任何票根');
  23  |     const grid = page.locator('#ticketGrid');
  24  |     await expect(grid).toBeEmpty();
  25  |   });
  26  | 
  27  |   test('填充数据后列表正常显示', async ({ page }) => {
  28  |     await page.goto('/');
  29  |     await page.evaluate(() => {
  30  |       return new Promise<void>((resolve, reject) => {
  31  |         const req = indexedDB.open('memorial_tickets_db', 1);
  32  |         req.onupgradeneeded = (e: IDBOpenDBRequest) => {
  33  |           const db = (e.target as IDBOpenDBRequest).result;
  34  |           if (!db.objectStoreNames.contains('tickets')) {
  35  |             db.createObjectStore('tickets', { keyPath: 'id' });
  36  |           }
  37  |         };
  38  |         req.onsuccess = () => {
  39  |           const db = req.result;
  40  |           const tx = db.transaction('tickets', 'readwrite');
  41  |           const store = tx.objectStore('tickets');
  42  |           const pngBytes = atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==');
  43  |           const arr = new Uint8Array(pngBytes.length);
  44  |           for (let i = 0; i < pngBytes.length; i++) arr[i] = pngBytes.charCodeAt(i);
  45  |           store.put({
  46  |             id: 'test-ticket-1',
  47  |             name: '泰坦尼克号',
  48  |             type: 'movie',
  49  |             note: '第一次约会',
  50  |             mood: '开心',
  51  |             attendees: '双人',
  52  |             originalBlob: new Blob([arr], { type: 'image/png' }),
  53  |             thumbnailBlob: new Blob([arr], { type: 'image/png' }),
  54  |             createdAt: Date.now(),
  55  |             updatedAt: Date.now()
  56  |           });
  57  |           tx.oncomplete = () => { db.close(); resolve(); };
  58  |           tx.onerror = () => reject(tx.error);
  59  |         };
  60  |         req.onerror = () => reject(req.error);
  61  |       });
  62  |     });
  63  |     await page.reload();
  64  |     const cards = page.locator('.ticket-card');
  65  |     await expect(cards).toHaveCount(1);
  66  |     await expect(page.locator('.ticket-name')).toContainText('泰坦尼克号');
  67  |     await expect(page.locator('.mood-badge')).toContainText('开心');
  68  |   });
  69  | });
  70  | 
  71  | test.describe('筛选和搜索', () => {
  72  |   async function seedTickets(page: any) {
> 73  |     await page.goto('/');
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  74  |     await page.evaluate(() => {
  75  |       return new Promise<void>((resolve, reject) => {
  76  |         const req = indexedDB.open('memorial_tickets_db', 1);
  77  |         req.onupgradeneeded = (e: IDBOpenDBRequest) => {
  78  |           const db = (e.target as IDBOpenDBRequest).result;
  79  |           if (!db.objectStoreNames.contains('tickets')) {
  80  |             db.createObjectStore('tickets', { keyPath: 'id' });
  81  |           }
  82  |         };
  83  |         req.onsuccess = () => {
  84  |           const db = req.result;
  85  |           const tx = db.transaction('tickets', 'readwrite');
  86  |           const store = tx.objectStore('tickets');
  87  |           const pngBytes = atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==');
  88  |           const arr = new Uint8Array(pngBytes.length);
  89  |           for (let i = 0; i < pngBytes.length; i++) arr[i] = pngBytes.charCodeAt(i);
  90  |           const blob = new Blob([arr], { type: 'image/png' });
  91  |           const now = Date.now();
  92  |           store.put({ id: 'm1', name: '星际穿越', type: 'movie', note: '', mood: '', attendees: '', originalBlob: blob, thumbnailBlob: blob, createdAt: now - 1000, updatedAt: now - 1000 });
  93  |           store.put({ id: 's1', name: '周杰伦演唱会', type: 'show', note: '很嗨', mood: '兴奋', attendees: '四人+', originalBlob: blob, thumbnailBlob: blob, createdAt: now - 2000, updatedAt: now - 2000 });
  94  |           store.put({ id: 'o1', name: '美术馆展览', type: 'other', note: '文艺', mood: '平静', attendees: '单人', originalBlob: blob, thumbnailBlob: blob, createdAt: now - 3000, updatedAt: now - 3000 });
  95  |           tx.oncomplete = () => { db.close(); resolve(); };
  96  |           tx.onerror = () => reject(tx.error);
  97  |         };
  98  |         req.onerror = () => reject(req.error);
  99  |       });
  100 |     });
  101 |   }
  102 | 
  103 |   test('按类型筛选正常工作', async ({ page }) => {
  104 |     await seedTickets(page);
  105 |     await page.reload();
  106 |     await page.click('.filter-tab[data-type="movie"]');
  107 |     await expect(page.locator('.ticket-card')).toHaveCount(1);
  108 |     await expect(page.locator('.ticket-name')).toContainText('星际穿越');
  109 |     await page.click('.filter-tab[data-type="show"]');
  110 |     await expect(page.locator('.ticket-card')).toHaveCount(1);
  111 |     await expect(page.locator('.ticket-name')).toContainText('周杰伦演唱会');
  112 |     await page.click('.filter-tab[data-type="all"]');
  113 |     await expect(page.locator('.ticket-card')).toHaveCount(3);
  114 |   });
  115 | 
  116 |   test('搜索功能正常工作', async ({ page }) => {
  117 |     await seedTickets(page);
  118 |     await page.reload();
  119 |     await page.fill('#searchInput', '周杰伦');
  120 |     await expect(page.locator('.ticket-card')).toHaveCount(1);
  121 |     await expect(page.locator('.ticket-name')).toContainText('周杰伦演唱会');
  122 |     await page.fill('#searchInput', '文艺');
  123 |     await expect(page.locator('.ticket-card')).toHaveCount(1);
  124 |     await expect(page.locator('.ticket-name')).toContainText('美术馆展览');
  125 |     await page.fill('#searchInput', '');
  126 |     await expect(page.locator('.ticket-card')).toHaveCount(3);
  127 |   });
  128 | 
  129 |   test('筛选和搜索可组合', async ({ page }) => {
  130 |     await seedTickets(page);
  131 |     await page.reload();
  132 |     await page.click('.filter-tab[data-type="movie"]');
  133 |     await page.fill('#searchInput', '星际');
  134 |     await expect(page.locator('.ticket-card')).toHaveCount(1);
  135 |     await page.fill('#searchInput', '演唱会');
  136 |     await expect(page.locator('.ticket-card')).toHaveCount(0);
  137 |     await expect(page.locator('#emptyState')).toBeVisible();
  138 |   });
  139 | });
  140 | 
  141 | test.describe('Detail Page', () => {
  142 |   async function seedOneTicket(page: any) {
  143 |     await page.goto('/');
  144 |     await page.evaluate(() => {
  145 |       return new Promise<void>((resolve, reject) => {
  146 |         const req = indexedDB.open('memorial_tickets_db', 1);
  147 |         req.onupgradeneeded = (e: IDBOpenDBRequest) => {
  148 |           const db = (e.target as IDBOpenDBRequest).result;
  149 |           if (!db.objectStoreNames.contains('tickets')) db.createObjectStore('tickets', { keyPath: 'id' });
  150 |         };
  151 |         req.onsuccess = () => {
  152 |           const db = req.result;
  153 |           const tx = db.transaction('tickets', 'readwrite');
  154 |           const store = tx.objectStore('tickets');
  155 |           const pngBytes = atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==');
  156 |           const arr = new Uint8Array(pngBytes.length);
  157 |           for (let i = 0; i < pngBytes.length; i++) arr[i] = pngBytes.charCodeAt(i);
  158 |           const blob = new Blob([arr], { type: 'image/png' });
  159 |           store.put({ id: 'detail-test-1', name: '盗梦空间', type: 'movie', note: '诺兰的神作', mood: '感动', attendees: '单人', originalBlob: blob, thumbnailBlob: blob, createdAt: Date.now(), updatedAt: Date.now() });
  160 |           tx.oncomplete = () => { db.close(); resolve(); };
  161 |           tx.onerror = () => reject(tx.error);
  162 |         };
  163 |         req.onerror = () => reject(req.error);
  164 |       });
  165 |     });
  166 |   }
  167 | 
  168 |   test('点击卡片进入详情页，显示完整信息', async ({ page }) => {
  169 |     await seedOneTicket(page);
  170 |     await page.reload();
  171 |     await page.click('.ticket-card');
  172 |     await expect(page.locator('#detailPage')).toHaveClass(/active/);
  173 |     await expect(page.locator('#detailTitle')).toContainText('盗梦空间');
```