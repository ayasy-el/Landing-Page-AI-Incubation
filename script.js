const canvas = document.getElementById("flow-canvas");
const ctx = canvas.getContext("2d");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let width = 0;
let height = 0;
let streams = [];
let nodes = [];
let rafId = 0;

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  buildFlowField();
}

function buildFlowField() {
  const streamCount = width < 720 ? 42 : 74;
  const nodeCount = width < 720 ? 42 : 78;
  const centerX = width * 0.5;
  const centerY = height * 0.52;

  streams = Array.from({ length: streamCount }, (_, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const sourceY = height * (0.24 + Math.random() * 0.58);
    const targetY = height * (0.2 + Math.random() * 0.6);
    const sourceX = side < 0 ? -80 : width + 80;
    const targetX = side < 0 ? width + 80 : -80;
    const midY = centerY + (Math.random() - 0.5) * height * 0.16;
    const color = index % 3 === 0 ? "#22D3EE" : index % 3 === 1 ? "#3B82F6" : "#EC4899";

    return {
      color,
      progress: Math.random(),
      speed: 0.00045 + Math.random() * 0.0007,
      lineWidth: 0.35 + Math.random() * 0.9,
      points: [
        { x: sourceX, y: sourceY },
        { x: centerX - side * width * (0.18 + Math.random() * 0.12), y: midY - 70 + Math.random() * 140 },
        { x: centerX + side * width * (0.09 + Math.random() * 0.12), y: midY + 70 - Math.random() * 140 },
        { x: targetX, y: targetY },
      ],
    };
  });

  nodes = Array.from({ length: nodeCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: 1 + Math.random() * 2.4,
    alpha: 0.2 + Math.random() * 0.55,
    color: Math.random() > 0.72 ? "#EC4899" : "#22D3EE",
  }));
}

function cubicPoint(points, t) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return {
    x: mt2 * mt * points[0].x + 3 * mt2 * t * points[1].x + 3 * mt * t2 * points[2].x + t2 * t * points[3].x,
    y: mt2 * mt * points[0].y + 3 * mt2 * t * points[1].y + 3 * mt * t2 * points[2].y + t2 * t * points[3].y,
  };
}

function drawStream(stream) {
  ctx.beginPath();
  stream.points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else if (index === 1) {
      ctx.bezierCurveTo(stream.points[1].x, stream.points[1].y, stream.points[2].x, stream.points[2].y, stream.points[3].x, stream.points[3].y);
    }
  });
  ctx.strokeStyle = stream.color;
  ctx.globalAlpha = 0.1;
  ctx.lineWidth = stream.lineWidth;
  ctx.stroke();

  const head = cubicPoint(stream.points, stream.progress);
  const tail = cubicPoint(stream.points, Math.max(0, stream.progress - 0.09));
  const gradient = ctx.createLinearGradient(tail.x, tail.y, head.x, head.y);
  gradient.addColorStop(0, "rgba(34, 211, 238, 0)");
  gradient.addColorStop(0.5, stream.color);
  gradient.addColorStop(1, "rgba(255, 255, 255, 0.95)");

  ctx.beginPath();
  ctx.moveTo(tail.x, tail.y);
  ctx.lineTo(head.x, head.y);
  ctx.strokeStyle = gradient;
  ctx.globalAlpha = 0.72;
  ctx.lineWidth = stream.lineWidth + 0.35;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(head.x, head.y, 1.4 + stream.lineWidth, 0, Math.PI * 2);
  ctx.fillStyle = stream.color;
  ctx.globalAlpha = 0.9;
  ctx.fill();
}

function drawNodes(time) {
  nodes.forEach((node, index) => {
    const pulse = Math.sin(time * 0.0012 + index) * 0.25 + 0.75;
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.r * pulse, 0, Math.PI * 2);
    ctx.fillStyle = node.color;
    ctx.globalAlpha = node.alpha * pulse;
    ctx.fill();
  });
}

function animate(time = 0) {
  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";
  streams.forEach((stream) => {
    drawStream(stream);
    if (!reduceMotion) {
      stream.progress += stream.speed;
      if (stream.progress > 1.08) stream.progress = -0.08;
    }
  });
  drawNodes(time);
  ctx.globalCompositeOperation = "source-over";

  if (!reduceMotion) {
    rafId = requestAnimationFrame(animate);
  }
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

window.addEventListener("resize", resizeCanvas, { passive: true });
resizeCanvas();
animate();

window.addEventListener("beforeunload", () => cancelAnimationFrame(rafId));
