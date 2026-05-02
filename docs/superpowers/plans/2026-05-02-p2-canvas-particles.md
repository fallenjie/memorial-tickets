# P2 静态特效增强 — Canvas 粒子系统

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** detail page 票据进入时播放粒子飘落特效（纸屑/光点），使用 Canvas 粒子系统实现，演出结束后自动清理，不影响其他页面。

**Architecture:** 在 detail page 显示时，创建一个全屏 Canvas 覆盖层（`position: fixed, z-index: 999`），在票据 DOM 元素 `showDetailPage()` 被调用后启动粒子动画。粒子为小矩形纸屑，颜色取自票根泛黄色（#F0E2C0 附近暖色），模拟纸张飘落效果。粒子数量 60-80，持续 2.5 秒后自动 fadeOut 并清理 Canvas，不产生内存泄漏。

**Tech Stack:** Canvas 2D API, requestAnimationFrame, CSS overlay, 已引入的 Google Fonts

---

## File Structure

- `index.html` — 在 `</script>` 末尾添加 Canvas 粒子系统函数，在 `showDetailPage` 中调用

---

## Task Structure

### Task 1: 实现 Canvas 粒子系统函数

**Files:**
- Modify: `index.html:1695-1701`（`init()` 之后，`</script>` 结束前）

- [ ] **Step 1: 添加粒子系统和启动函数**

在 `index.html` 第 1701 行后（`init();` 之后，`</script>` 标签前）添加：

```javascript
    // ========== Canvas Particle System ==========
    let particleCanvas = null;
    let particleCtx = null;
    let particleAnimationId = null;
    let particles = [];
    let particleStartTime = null;
    const PARTICLE_DURATION = 2500; // ms
    const PARTICLE_COUNT = 70;

    // 粒子颜色池 — 暖黄/米白/浅橙
    const PARTICLE_COLORS = [
      '#F0E2C0', '#E8D4A8', '#F5DEB3', '#FAEBD7', '#FFE4B5',
      '#DEB887', '#D2B48C', '#F0C080', '#E8C090', '#F5E6C8',
      '#FFF8DC', '#FAF0E6', '#FFEFD5', '#FCE6C9'
    ];

    function createParticles() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * vw,
          y: Math.random() * vh * 0.4 - vh * 0.4, // 从视口上方开始
          w: 4 + Math.random() * 6,
          h: 3 + Math.random() * 5,
          color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
          vx: (Math.random() - 0.5) * 1.5,
          vy: 1.5 + Math.random() * 2.5,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.08,
          opacity: 0.6 + Math.random() * 0.4
        });
      }
    }

    function startParticleEffect() {
      stopParticleEffect(); // 清理旧的

      particleCanvas = document.createElement('canvas');
      particleCanvas.id = 'particleCanvas';
      particleCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:999;';
      particleCanvas.width = window.innerWidth;
      particleCanvas.height = window.innerHeight;
      document.body.appendChild(particleCanvas);
      particleCtx = particleCanvas.getContext('2d');

      createParticles();
      particleStartTime = performance.now();
      animateParticles();
    }

    function animateParticles() {
      if (!particleCanvas || !particleCtx) return;

      const elapsed = performance.now() - particleStartTime;
      const progress = Math.min(elapsed / PARTICLE_DURATION, 1);
      const vh = window.innerHeight;

      particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        // 轻微左右飘动（sin波）
        p.vx += (Math.random() - 0.5) * 0.15;

        const fadeStart = 0.7;
        const fadeAlpha = progress > fadeStart
          ? p.opacity * (1 - (progress - fadeStart) / (1 - fadeStart))
          : p.opacity;

        if (fadeAlpha <= 0) return;

        particleCtx.save();
        particleCtx.translate(p.x, p.y);
        particleCtx.rotate(p.rotation);
        particleCtx.globalAlpha = fadeAlpha;
        particleCtx.fillStyle = p.color;
        particleCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        particleCtx.restore();
      });

      if (progress < 1) {
        particleAnimationId = requestAnimationFrame(animateParticles);
      } else {
        stopParticleEffect();
      }
    }

    function stopParticleEffect() {
      if (particleAnimationId) {
        cancelAnimationFrame(particleAnimationId);
        particleAnimationId = null;
      }
      if (particleCanvas) {
        particleCanvas.remove();
        particleCanvas = null;
        particleCtx = null;
      }
      particles = [];
      particleStartTime = null;
    }

    // 窗口大小变化时更新 canvas 尺寸
    window.addEventListener('resize', () => {
      if (particleCanvas) {
        particleCanvas.width = window.innerWidth;
        particleCanvas.height = window.innerHeight;
      }
    });
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat(effects): implement Canvas particle system for ticket reveal"
```

---

### Task 2: 在 showDetailPage 中调用粒子特效

**Files:**
- Modify: `index.html:1099-1104` (`showDetailPage` 函数)

- [ ] **Step 1: 在 showDetailPage 末尾添加粒子启动调用**

在 `index.html` 第 1103 行（`loadTicketDetail(id);` 之后，`}` 之前）添加：

```javascript
    function showDetailPage(id) {
      currentTicketId = id;
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById('detailPage').classList.add('active');
      loadTicketDetail(id);
      startParticleEffect(); // 启动粒子飘落特效
    }
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat(effects): trigger particle effect on detail page open"
```

---

### Task 3: 验证特效

- [ ] **Step 1: 手动测试 — 打开 detail page 验证粒子飘落**

在浏览器 devtools console 中测试：
```javascript
showDetailPage(tickets[0].id); // 如果有票根
```

验证清单：
- [ ] 打开 detail page 后有暖黄色纸屑粒子从上方飘落
- [ ] 粒子有旋转和随机左右飘动
- [ ] 约 2.5 秒后粒子淡出消失
- [ ] Canvas 元素在特效结束后被移除（检查 DOM 无 `#particleCanvas`）
- [ ] 切换到列表页后再打开 detail page，粒子特效重新播放
- [ ] 快速切换页面无内存泄漏（无残留 Canvas）

- [ ] **Step 2: Commit**

```bash
git commit -m "chore(effects): verify particle animation behavior and cleanup"
```

---

## Self-Review Checklist

1. **Spec coverage:** PRD P2 静态特效增强 → Canvas 粒子飘落系统，detail page 票据进入时触发。
2. **Placeholder scan:** 无 TBD/TODO — 所有数值（粒子数/持续时间/颜色）均为实际可用值。
3. **Type consistency:** 仅涉及 Canvas 2D API 和 DOM 操作，无类型系统使用。
4. **Memory safety:** `stopParticleEffect()` 清理所有资源，resize handler 检查 null，粒子结束后自动清理。
