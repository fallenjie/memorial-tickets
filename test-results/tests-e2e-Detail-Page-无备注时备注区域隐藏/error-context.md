# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\e2e.spec.ts >> Detail Page >> 无备注时备注区域隐藏
- Location: tests\e2e.spec.ts:180:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
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
  174 |     await expect(page.locator('#detailType')).toContainText('电影');
  175 |     await expect(page.locator('#detailMood')).toContainText('感动');
  176 |     await expect(page.locator('#detailAttendees')).toContainText('单人');
  177 |     await expect(page.locator('#detailNote')).toContainText('诺兰的神作');
  178 |   });
  179 | 
  180 |   test('无备注时备注区域隐藏', async ({ page }) => {
> 181 |     await page.goto('/');
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  182 |     await page.evaluate(() => {
  183 |       return new Promise<void>((resolve, reject) => {
  184 |         const req = indexedDB.open('memorial_tickets_db', 1);
  185 |         req.onupgradeneeded = (e: IDBOpenDBRequest) => {
  186 |           const db = (e.target as IDBOpenDBRequest).result;
  187 |           if (!db.objectStoreNames.contains('tickets')) db.createObjectStore('tickets', { keyPath: 'id' });
  188 |         };
  189 |         req.onsuccess = () => {
  190 |           const db = req.result;
  191 |           const tx = db.transaction('tickets', 'readwrite');
  192 |           const store = tx.objectStore('tickets');
  193 |           const pngBytes = atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==');
  194 |           const arr = new Uint8Array(pngBytes.length);
  195 |           for (let i = 0; i < pngBytes.length; i++) arr[i] = pngBytes.charCodeAt(i);
  196 |           store.put({ id: 'no-note', name: '无备注票', type: 'other', note: '', mood: '', attendees: '', originalBlob: new Blob([arr], { type: 'image/png' }), thumbnailBlob: new Blob([arr], { type: 'image/png' }), createdAt: Date.now(), updatedAt: Date.now() });
  197 |           tx.oncomplete = () => { db.close(); resolve(); };
  198 |           tx.onerror = () => reject(tx.error);
  199 |         };
  200 |         req.onerror = () => reject(req.error);
  201 |       });
  202 |     });
  203 |     await page.reload();
  204 |     await page.click('.ticket-card');
  205 |     await expect(page.locator('#detailNoteBox')).toBeHidden();
  206 |   });
  207 | 
  208 |   test('编辑按钮可打开备注编辑弹窗', async ({ page }) => {
  209 |     await seedOneTicket(page);
  210 |     await page.reload();
  211 |     await page.click('.ticket-card');
  212 |     await page.click('text=编辑');
  213 |     await expect(page.locator('#noteModal')).toHaveClass(/active/);
  214 |     await expect(page.locator('#noteText')).toHaveValue('诺兰的神作');
  215 |   });
  216 | 
  217 |   test('删除按钮触发确认并返回列表', async ({ page }) => {
  218 |     await seedOneTicket(page);
  219 |     await page.reload();
  220 |     await page.click('.ticket-card');
  221 |     page.on('dialog', d => d.accept());
  222 |     await page.click('text=删除');
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
```