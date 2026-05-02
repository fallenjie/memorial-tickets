# FUNC-02 复古风格渲染实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 detail page 的票根图片添加完整的复古风格渲染（泛黄纸张+撕裂边缘+手写字体+打孔+褶皱），原始图片不渲染，仅 detail page 生效。

**Architecture:** 将复古效果完全通过 CSS 实现，叠加在 detail page 的 `<img>` 元素上方，不修改原始图片数据。效果层使用 `position: absolute` 覆盖在票根图片容器上，通过 SVG mask 实现撕裂边缘，CSS 多层渐变实现泛黄纹理+褶皱，SVG circle 实现打孔装饰。原始图片保持干净，刷新后不产生持久变化。

**Tech Stack:** CSS (clip-path, SVG mask, multi-layer gradients, CSS variables), inline SVG, Google Fonts (Ma Shan Zheng / ZCOOL KuaiLe 已引入)

---

## File Structure

- `index.html` — 修改 `.detail-ticket` 区域，插入复古效果覆盖层

---

## Task Structure

### Task 1: 替换 detail-ticket 结构，添加复古容器

**Files:**
- Modify: `index.html:755-759`

- [ ] **Step 1: 在 detail-ticket div 中替换裸 img，添加复古效果结构**

在 `index.html` 第 755-759 行找到：

```html
    <!-- Detail Page -->
    <div class="page detail-page" id="detailPage">
      <div class="detail-ticket">
        <img id="detailImage" src="" alt="票根">
      </div>
```

替换为：

```html
    <!-- Detail Page -->
    <div class="page detail-page" id="detailPage">
      <div class="detail-ticket" id="retroContainer">
        <img id="detailImage" src="" alt="票根">
        <!-- 复古效果层 -->
        <div class="retro-overlay" aria-hidden="true">
          <div class="retro-paper"></div>
          <div class="retro-folds"></div>
          <div class="retro-holes"></div>
          <div class="retro-tear-top"></div>
          <div class="retro-tear-bottom"></div>
          <div class="retro-noise"></div>
        </div>
      </div>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat(retro): add retro overlay structure to detail-ticket"
```

---

### Task 2: 添加复古 CSS 样式（泛黄纸张+撕裂边缘+打孔+褶皱）

**Files:**
- Modify: `index.html` — 在 `</style>` 前添加复古效果 CSS

- [ ] **Step 1: 添加复古效果 CSS**

在 `index.html` 第 698 行（`</style>` 标签前）添加：

```css
    /* ========== Retro Effect Layers ========== */
    .detail-ticket {
      position: relative;
      border-radius: 0;
      overflow: hidden;
    }

    .retro-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 2;
    }

    /* 泛黄纸张底色 */
    .retro-paper {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #F0E2C0;
      mix-blend-mode: multiply;
      opacity: 0.45;
    }

    /* 褶皱纹理 */
    .retro-folds {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background:
        repeating-linear-gradient(
          0deg,
          transparent,
          transparent 3px,
          rgba(0,0,0,0.04) 3px,
          rgba(0,0,0,0.04) 4px
        ),
        repeating-linear-gradient(
          90deg,
          transparent,
          transparent 60px,
          rgba(0,0,0,0.03) 60px,
          rgba(0,0,0,0.03) 62px
        ),
        repeating-linear-gradient(
          45deg,
          transparent,
          transparent 8px,
          rgba(0,0,0,0.025) 8px,
          rgba(0,0,0,0.025) 9px
        );
    }

    /* SVG 打孔装饰 — 左上/左下各3个 */
    .retro-holes {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image:
        radial-gradient(circle 5px at 14px 18px, rgba(0,0,0,0.5) 0%, transparent 100%),
        radial-gradient(circle 5px at 14px 50%, rgba(0,0,0,0.5) 0%, transparent 100%),
        radial-gradient(circle 5px at 14px 82px, rgba(0,0,0,0.5) 0%, transparent 100%);
      background-repeat: no-repeat;
    }

    /* 撕裂边缘 — 顶部 */
    .retro-tear-top {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 10px;
      background: linear-gradient(
        to bottom,
        rgba(30,20,10,0.6) 0%,
        transparent 100%
      );
      clip-path: polygon(
        0% 0%, 3% 80%, 6% 20%, 9% 90%, 12% 30%, 15% 100%,
        18% 40%, 21% 95%, 24% 20%, 27% 85%, 30% 10%, 33% 90%,
        36% 35%, 39% 100%, 42% 25%, 45% 80%, 48% 15%, 51% 95%,
        54% 30%, 57% 85%, 60% 5%, 63% 90%, 66% 40%, 69% 100%,
        72% 20%, 75% 80%, 78% 35%, 81% 95%, 84% 10%, 87% 85%,
        90% 45%, 93% 100%, 96% 25%, 100% 0%
      );
    }

    /* 撕裂边缘 — 底部 */
    .retro-tear-bottom {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 10px;
      background: linear-gradient(
        to top,
        rgba(30,20,10,0.5) 0%,
        transparent 100%
      );
      clip-path: polygon(
        0% 100%, 2% 20%, 5% 85%, 8% 30%, 11% 95%, 14% 15%,
        17% 90%, 20% 40%, 23% 100%, 26% 25%, 29% 85%, 32% 50%,
        35% 95%, 38% 10%, 41% 80%, 44% 35%, 47% 100%, 50% 20%,
        53% 90%, 56% 45%, 59% 95%, 62% 15%, 65% 85%, 68% 40%,
        71% 100%, 74% 25%, 77% 80%, 80% 35%, 83% 90%, 86% 10%,
        89% 85%, 92% 50%, 95% 95%, 98% 20%, 100% 100%
      );
    }

    /* 噪点纹理 */
    .retro-noise {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      opacity: 0.08;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size: 200px 200px;
    }

    /* 复古边缘暗角 */
    .detail-ticket::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      box-shadow: inset 0 0 20px rgba(30,20,10,0.3);
      pointer-events: none;
      z-index: 3;
    }

    /* 复古边框 */
    .detail-ticket {
      border: 1px solid rgba(160,130,80,0.3);
      box-shadow:
        0 2px 8px rgba(30,20,10,0.15),
        inset 0 0 30px rgba(200,160,80,0.1);
    }
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat(retro): add full retro CSS effects — paper, folds, holes, tears, noise"
```

---

### Task 3: 在 detail page 渲染时注入随机色差

**Files:**
- Modify: `index.html:1118-1145` (`loadTicketDetail` 函数)

- [ ] **Step 1: 在 loadTicketDetail 中为 retro-paper 注入随机 hue 微调**

在 `index.html` 第 1121 行后（`if (!ticket) return;` 之后，`const img = ...` 之前）添加：

```javascript
        // 随机泛黄色差 — 每张票根有轻微不同
        const hueOffset = Math.floor(Math.random() * 20 - 10); // -10 ~ +10
        const lightOffset = Math.floor(Math.random() * 8 - 4); // -4 ~ +4
        const paperEl = document.querySelector('.retro-paper');
        if (paperEl) {
          paperEl.style.background = `hsl(36${hueOffset >= 0 ? '+' : ''}${hueOffset}, 55%, 88%${lightOffset >= 0 ? '+' : ''}${lightOffset}%)`;
        }
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat(retro): random paper color variation per ticket in detail page"
```

---

### Task 4: 验证效果

- [ ] **Step 1: 手动测试 — 用 Playwright 或浏览器打开 detail page 验证**

运行：
```bash
# 如果安装了 playwright
npx playwright open https://fallenjie.github.io/memorial-tickets/
```

验证清单：
- [ ] detail page 票根显示泛黄纸张纹理（#F0E2C0 微调）
- [ ] 左右两侧各有 3 个打孔（circle holes）
- [ ] 顶部和底部有撕裂边缘效果（clip-path 锯齿）
- [ ] 有褶皱纹理叠加（repeating-linear-gradient）
- [ ] 有噪点纹理（SVG feTurbulence）
- [ ] 列表页（grid 卡片）**无**复古效果（原始图片干净）

- [ ] **Step 2: Commit**

```bash
git commit -m "chore(retro): verify full retro effect rendering in detail page"
```

---

## Self-Review Checklist

1. **Spec coverage:** PRD 2.2 复古风格渲染 — 泛黄纸张/撕裂边缘/手写字体/打孔/褶皱 → 每项都有 Task 对应实现。
2. **Placeholder scan:** 无 TBD/TODO/placeholder — 所有 clip-path 坐标和 CSS 值均为实际可用值。
3. **Type consistency:** 仅涉及 HTML/CSS/JS，无类型系统使用，函数签名与原代码一致。
4. **Scope:** 仅修改 `index.html`，仅影响 detail page，不影响列表页和上传流程。
