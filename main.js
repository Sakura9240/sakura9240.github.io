// 夜空星星 / 流星 / 光标微光 / 滚动浮现 / 鲸鱼偶尔路过
(() => {
  document.documentElement.classList.add("js");
  const canvas = document.getElementById("sky");
  const ctx = canvas.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let w = 0;
  let h = 0;
  let dpr = 1;
  /** @type {{x:number,y:number,r:number,a:number,s:number,p:number}[]} */
  let stars = [];
  /** @type {{x:number,y:number,vx:number,vy:number,life:number,max:number}[]} */
  let meteors = [];

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth;
    h = innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    const count = Math.round((w * h) / 14000);
    stars = Array.from({ length: Math.min(220, count) }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.4 + Math.random() * 1.4,
      a: 0.15 + Math.random() * 0.75,
      s: 0.4 + Math.random() * 1.6,
      p: Math.random() * Math.PI * 2,
    }));
  }

  function spawnMeteor() {
    const fromLeft = Math.random() > 0.5;
    meteors.push({
      x: fromLeft ? -40 : w + 40,
      y: Math.random() * h * 0.5,
      vx: (fromLeft ? 1 : -1) * (7 + Math.random() * 5),
      vy: 3 + Math.random() * 2.5,
      life: 0,
      max: 60 + Math.random() * 40,
    });
  }

  let t = 0;
  function frame() {
    t += 0.016;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    for (const s of stars) {
      const tw = 0.55 + 0.45 * Math.sin(t * s.s + s.p);
      ctx.globalAlpha = Math.max(0.06, s.a * tw);
      ctx.fillStyle = "#dfe7ff";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const m of meteors) {
      m.life += 1;
      m.x += m.vx;
      m.y += m.vy;
      const alpha = Math.max(0, 1 - m.life / m.max);
      const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 9, m.y - m.vy * 9);
      grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.globalAlpha = 1;
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x - m.vx * 9, m.y - m.vy * 9);
      ctx.stroke();
    }
    meteors = meteors.filter((m) => m.life < m.max && m.x > -200 && m.x < w + 200 && m.y < h + 100);

    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

  resize();
  addEventListener("resize", resize, { passive: true });

  if (!reduce) {
    requestAnimationFrame(frame);
    setInterval(() => {
      if (Math.random() < 0.5) spawnMeteor();
    }, 5200);
  } else {
    // 静态星点也画一次
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const s of stars) {
      ctx.globalAlpha = s.a * 0.7;
      ctx.fillStyle = "#dfe7ff";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 光标微光
  const glow = document.getElementById("glow");
  let gx = -999;
  let gy = -999;
  addEventListener("pointermove", (e) => {
    gx = e.clientX;
    gy = e.clientY;
    glow.style.opacity = "1";
  }, { passive: true });
  addEventListener("pointerleave", () => (glow.style.opacity = "0"));
  (function follow() {
    const rect = glow.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    glow.style.left = `${(cx + (gx - cx) * 0.12).toFixed(1)}px`;
    glow.style.top = `${(cy + (gy - cy) * 0.12).toFixed(1)}px`;
    requestAnimationFrame(follow);
  })();

  // 滚动浮现
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    },
    { threshold: 0.16 },
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  // 兜底：即使 IntersectionObserver 没触发，也不让内容一直隐身
  setTimeout(() => document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in")), 1500);

  // 背景人物：滚轮视差（比页面慢，产生层次）
  const bgFig = document.getElementById("bgFigure");
  if (bgFig) {
    if (reduce) {
      bgFig.style.transform = "translateY(-50%)";
    } else {
      const base = "translateY(-50%)";
      let cur = 0;
      let target = 0;
      const loop = () => {
        target = Math.min(scrollY, 6000) * 0.12;
        cur += (target - cur) * 0.12;
        bgFig.style.transform = base + " translateY(" + cur.toFixed(1) + "px)";
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  }

  // 鲸鱼偶尔路过
  const whale = document.getElementById("whale");
  if (whale && !reduce) {
    const swim = () => {
      whale.classList.remove("swim");
      void whale.offsetWidth;
      whale.classList.add("swim");
      setTimeout(swim, 42000 + Math.random() * 30000);
    };
    setTimeout(swim, 6000);
  }
})();