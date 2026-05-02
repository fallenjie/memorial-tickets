# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\e2e.spec.ts >> Export Flow >> 无票根时显示 Toast 提示
- Location: tests\e2e.spec.ts:322:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  223 |     await expect(page.locator('#listPage')).toHaveClass(/active/);
  224 |     await expect(page.locator('#emptyState')).toBeVisible();
  225 |   });
  226 | });
  227 | 
  228 | test.describe('Upload Flow', () => {
  229 |   test.beforeEach(async ({ page }) => {
  230 |     await page.evaluate(() => {
  231 |       return new Promise<void>((resolve) => {
  232 |         const req = indexedDB.deleteDatabase('memorial_tickets_db');
  233 |         req.onsuccess = () => resolve();
  234 |         req.onblocked = () => resolve();
  235 |       });
  236 |     });
  237 |   });
  238 | 
  239 |   test('完整上传流程：选择图片→裁剪→填写类型→填写备注→保存→列表显示', async ({ page }) => {
  240 |     await page.goto('/');
  241 |     await page.click('.tabbar-item[data-page="upload"]');
  242 |     await expect(page.locator('#uploadPage')).toHaveClass(/active/);
  243 |     const fileInput = page.locator('#fileInput');
  244 |     await fileInput.setInputFiles('tests/fixtures/sample-ticket.png');
  245 |     await expect(page.locator('#cropModal')).toHaveClass(/active/);
  246 |     await page.click('.crop-ratio-btn[data-ratio="2:1"]');
  247 |     await page.click('#cropModal .btn-primary');
  248 |     await expect(page.locator('#typeModal')).toHaveClass(/active/);
  249 |     await page.fill('#ticketName', '阿凡达2');
  250 |     await page.selectOption('#ticketType', 'movie');
  251 |     await page.click('#typeModal .btn-primary');
  252 |     await expect(page.locator('#noteModal')).toHaveClass(/active/);
  253 |     await page.fill('#noteText', 'IMAX 特效震撼');
  254 |     await page.click('#noteModal .btn-primary');
  255 |     await expect(page.locator('#listPage')).toHaveClass(/active/);
  256 |     await expect(page.locator('.ticket-card')).toHaveCount(1);
  257 |     await expect(page.locator('.ticket-name')).toContainText('阿凡达2');
  258 |   });
  259 | 
  260 |   test('上传流程跳过备注也能保存', async ({ page }) => {
  261 |     await page.goto('/');
  262 |     await page.click('.tabbar-item[data-page="upload"]');
  263 |     await page.locator('#fileInput').setInputFiles('tests/fixtures/sample-ticket.png');
  264 |     await page.click('#cropModal .btn-primary');
  265 |     await page.fill('#ticketName', '无备注票根');
  266 |     await page.selectOption('#ticketType', 'other');
  267 |     await page.click('#typeModal .btn-primary');
  268 |     await page.click('#noteModal .btn-secondary');
  269 |     await expect(page.locator('#listPage')).toHaveClass(/active/);
  270 |     await expect(page.locator('.ticket-card')).toHaveCount(1);
  271 |   });
  272 | 
  273 |   test('类型弹窗必填验证', async ({ page }) => {
  274 |     await page.goto('/');
  275 |     await page.click('.tabbar-item[data-page="upload"]');
  276 |     await page.locator('#fileInput').setInputFiles('tests/fixtures/sample-ticket.png');
  277 |     await page.click('#cropModal .btn-primary');
  278 |     await page.click('#typeModal .btn-primary');
  279 |     await expect(page.locator('#typeModal')).toHaveClass(/active/);
  280 |     await expect(page.locator('.inline-error')).toBeVisible();
  281 |   });
  282 | });
  283 | 
  284 | test.describe('Export Flow', () => {
  285 |   async function seedTickets(page: any) {
  286 |     await page.goto('/');
  287 |     await page.evaluate(() => {
  288 |       return new Promise<void>((resolve, reject) => {
  289 |         const req = indexedDB.open('memorial_tickets_db', 1);
  290 |         req.onupgradeneeded = (e: IDBOpenDBRequest) => {
  291 |           const db = (e.target as IDBOpenDBRequest).result;
  292 |           if (!db.objectStoreNames.contains('tickets')) db.createObjectStore('tickets', { keyPath: 'id' });
  293 |         };
  294 |         req.onsuccess = () => {
  295 |           const db = req.result;
  296 |           const tx = db.transaction('tickets', 'readwrite');
  297 |           const store = tx.objectStore('tickets');
  298 |           const pngBytes = atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==');
  299 |           const arr = new Uint8Array(pngBytes.length);
  300 |           for (let i = 0; i < pngBytes.length; i++) arr[i] = pngBytes.charCodeAt(i);
  301 |           const blob = new Blob([arr], { type: 'image/png' });
  302 |           store.put({ id: 'exp1', name: '票根A', type: 'movie', note: '', mood: '', attendees: '', originalBlob: blob, thumbnailBlob: blob, createdAt: Date.now(), updatedAt: Date.now() });
  303 |           tx.oncomplete = () => { db.close(); resolve(); };
  304 |           tx.onerror = () => reject(tx.error);
  305 |         };
  306 |         req.onerror = () => reject(req.error);
  307 |       });
  308 |     });
  309 |   }
  310 | 
  311 |   test('有票根时导出触发下载', async ({ page }) => {
  312 |     await seedTickets(page);
  313 |     await page.reload();
  314 |     const downloadPromise = page.waitForEvent('download');
  315 |     await page.click('#exportBtn');
  316 |     const download = await downloadPromise;
  317 |     const filename = download.suggestedFilename();
  318 |     expect(filename).toMatch(/^memorial_tickets_\d{4}\.\d{2}\.\d{2}\.zip$/);
  319 |     expect(filename.endsWith('.zip')).toBe(true);
  320 |   });
  321 | 
  322 |   test('无票根时显示 Toast 提示', async ({ page }) => {
> 323 |     await page.goto('/');
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  324 |     await page.click('#exportBtn');
  325 |     await expect(page.locator('#toastMsg')).toContainText('暂无票根可导出');
  326 |   });
  327 | });
```