const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealElements = document.querySelectorAll(".reveal");
const stageButtons = Array.from(document.querySelectorAll(".system-stage"));
const workflowItems = Array.from(document.querySelectorAll("[data-stage-target]"));
const fallbackClusters = Array.from(document.querySelectorAll("[data-fallback-stage]"));
const annotationPills = Array.from(document.querySelectorAll("[data-annotation-stage]"));
const trustSteps = Array.from(document.querySelectorAll("[data-flow-step]"));
const trustFocusCards = Array.from(document.querySelectorAll("[data-flow-focus]"));
const aiInsightCards = Array.from(document.querySelectorAll(".graph-showcase-overlay-focus"));
const stateTitle = document.getElementById("system-state-title");
const stateCopy = document.getElementById("system-state-copy");

const stageOrder = ["document", "graph", "agent", "decision"];
const stageContent = {
  document: {
    title: "Document intake",
    copy: "Source material enters a governed context before any comparison, mapping, or reasoning begins.",
  },
  graph: {
    title: "Knowledge graph mapping",
    copy: "Entities, indicators, and institutional references are linked into one connected view with traceable relationships.",
  },
  agent: {
    title: "Agent review in progress",
    copy: "AI agents compare structure, metadata, and policy context to surface conflicts, gaps, and alignment signals.",
  },
  decision: {
    title: "Decision-ready context",
    copy: "Reviewers receive a governed summary with traceability, confidence signals, and issues already surfaced for action.",
  },
};

let activeStage = "document";
let stageCycle = null;
let graphController = null;
let trustFlowCycle = null;

function initLucideIcons() {
  if (!window.lucide || typeof window.lucide.createIcons !== "function") return;
  window.lucide.createIcons();
}

function setRevealStates() {
  if (reduceMotion) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  if (window.gsap) {
    const heroCopy = document.querySelector(".hero-copy");
    const heroSystem = document.querySelector(".hero-system");

    if (heroCopy && heroSystem) {
      window.gsap.set([heroCopy, heroSystem], { opacity: 1, y: 0 });
      window.gsap.from([heroCopy, heroSystem], {
        opacity: 0,
        y: 26,
        duration: 0.72,
        ease: "power3.out",
        stagger: 0.08,
      });
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");

        if (window.gsap && !entry.target.classList.contains("hero-copy") && !entry.target.classList.contains("hero-system")) {
          window.gsap.fromTo(
            entry.target,
            { opacity: 0, y: 22 },
            { opacity: 1, y: 0, duration: 0.65, ease: "power3.out" }
          );
        }

        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -6% 0px",
    }
  );

  revealElements.forEach((element) => observer.observe(element));
}

function applyStage(stage) {
  activeStage = stage;

  stageButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.stage === stage);
  });

  workflowItems.forEach((item) => {
    item.classList.toggle("is-linked", item.dataset.stageTarget === stage);
  });

  fallbackClusters.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.fallbackStage === stage);
  });

  annotationPills.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.annotationStage === stage);
  });

  const content = stageContent[stage];
  if (content) {
    stateTitle.textContent = content.title;
    stateCopy.textContent = content.copy;
  }

  if (graphController) graphController.setStage(stage);
}

function startStageCycle() {
  if (reduceMotion) return;

  clearInterval(stageCycle);
  let index = stageOrder.indexOf(activeStage);

  stageCycle = window.setInterval(() => {
    index = (index + 1) % stageOrder.length;
    applyStage(stageOrder[index]);
  }, 2900);
}

function pauseStageCycle() {
  clearInterval(stageCycle);
}

function bindStageControls() {
  stageButtons.forEach((button) => {
    const stage = button.dataset.stage;

    button.addEventListener("mouseenter", () => {
      pauseStageCycle();
      applyStage(stage);
    });

    button.addEventListener("focus", () => {
      pauseStageCycle();
      applyStage(stage);
    });

    button.addEventListener("click", () => {
      pauseStageCycle();
      applyStage(stage);
      startStageCycle();
    });

    button.addEventListener("mouseleave", startStageCycle);
    button.addEventListener("blur", startStageCycle);
  });

  workflowItems.forEach((item) => {
    const stage = item.dataset.stageTarget;
    item.addEventListener("mouseenter", () => applyStage(stage));
  });
}

function applyTrustFlow(step) {
  trustSteps.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.flowStep === step);
  });

  trustFocusCards.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.flowFocus === step);
  });
}

function startTrustFlowCycle() {
  if (reduceMotion || !trustSteps.length) return;

  clearInterval(trustFlowCycle);
  let index = stageOrder.indexOf(trustSteps.find((item) => item.classList.contains("is-active"))?.dataset.flowStep || "document");

  trustFlowCycle = window.setInterval(() => {
    index = (index + 1) % stageOrder.length;
    applyTrustFlow(stageOrder[index]);
  }, 2600);
}

function pauseTrustFlowCycle() {
  clearInterval(trustFlowCycle);
}

function bindTrustFlow() {
  if (!trustSteps.length) return;

  applyTrustFlow("document");

  trustSteps.forEach((item) => {
    const step = item.dataset.flowStep;

    item.addEventListener("mouseenter", () => {
      pauseTrustFlowCycle();
      applyTrustFlow(step);
    });

    item.addEventListener("focus", () => {
      pauseTrustFlowCycle();
      applyTrustFlow(step);
    });

    item.addEventListener("click", () => {
      pauseTrustFlowCycle();
      applyTrustFlow(step);
      startTrustFlowCycle();
    });

    item.addEventListener("mouseleave", startTrustFlowCycle);
    item.addEventListener("blur", startTrustFlowCycle);
  });

  if (!reduceMotion) startTrustFlowCycle();
}

function initAiInsightReveal() {
  if (!aiInsightCards.length) return;

  if (reduceMotion) {
    aiInsightCards.forEach((card) => card.classList.add("is-visible-on-load"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.45,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  aiInsightCards.forEach((card) => observer.observe(card));
}

function createKnowledgeGraph() {
  const canvas = document.getElementById("knowledge-graph");
  if (!canvas || !window.THREE) return null;

  const THREE = window.THREE;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 8.4);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  const directionalLight = new THREE.DirectionalLight(0xa7c4ff, 1.45);
  directionalLight.position.set(4, 5, 7);
  scene.add(ambientLight, directionalLight);

  const root = new THREE.Group();
  scene.add(root);

  const fieldRoot = new THREE.Group();
  root.add(fieldRoot);

  const nodeSpecs = [
    { id: "doc-1", stage: "document", base: [-2.35, 1.15, 0.25], size: 0.16 },
    { id: "doc-2", stage: "document", base: [-2.65, -0.25, -0.1], size: 0.11 },
    { id: "doc-3", stage: "document", base: [-1.85, -1.25, 0.16], size: 0.12 },
    { id: "graph-1", stage: "graph", base: [-0.65, 0.85, 0.12], size: 0.14 },
    { id: "graph-2", stage: "graph", base: [-0.05, -0.05, -0.18], size: 0.13 },
    { id: "graph-3", stage: "graph", base: [-0.72, -1.08, 0.08], size: 0.1 },
    { id: "agent-1", stage: "agent", base: [1.25, 1.12, 0.24], size: 0.12 },
    { id: "agent-2", stage: "agent", base: [1.85, -0.22, -0.14], size: 0.13 },
    { id: "agent-3", stage: "agent", base: [0.94, -1.08, 0.18], size: 0.11 },
    { id: "decision", stage: "decision", base: [2.65, 0, 0.38], size: 0.17 },
  ];

  const lineSpecs = [
    ["doc-1", "graph-1", "graph"],
    ["doc-2", "graph-2", "graph"],
    ["doc-3", "graph-3", "graph"],
    ["graph-1", "graph-2", "graph"],
    ["graph-2", "graph-3", "graph"],
    ["graph-1", "agent-1", "agent"],
    ["graph-2", "agent-2", "agent"],
    ["graph-3", "agent-3", "agent"],
    ["agent-1", "decision", "decision"],
    ["agent-2", "decision", "decision"],
    ["agent-3", "decision", "decision"],
  ];

  const fieldSpecs = [
    [-3.2, 1.85, -0.25, 0.04],
    [-2.95, 1.1, 0.1, 0.05],
    [-2.7, 0.3, -0.16, 0.035],
    [-2.86, -0.75, 0.12, 0.045],
    [-2.15, 1.6, 0.08, 0.04],
    [-2.05, -1.6, -0.14, 0.04],
    [-1.45, 1.15, 0.06, 0.045],
    [-1.55, 0.12, -0.18, 0.035],
    [-1.35, -1.15, 0.12, 0.04],
    [-0.95, 1.82, -0.08, 0.04],
    [-0.75, 0.96, 0.16, 0.035],
    [-0.42, -1.72, 0.04, 0.04],
    [-0.08, 1.55, -0.16, 0.05],
    [0.12, 0.64, 0.09, 0.035],
    [0.28, -0.82, -0.12, 0.04],
    [0.52, -1.48, 0.18, 0.035],
    [0.92, 1.42, -0.18, 0.04],
    [1.15, 0.34, 0.12, 0.04],
    [1.38, -1.62, -0.12, 0.045],
    [1.82, 1.86, -0.08, 0.04],
    [2.02, 0.92, 0.16, 0.05],
    [2.12, -0.4, -0.06, 0.035],
    [2.34, -1.34, 0.14, 0.04],
    [2.78, 1.32, -0.12, 0.035],
    [3.02, 0.15, 0.08, 0.04],
    [2.88, -0.96, -0.1, 0.045],
  ];

  // Scale style colors
  const nodeColor = new THREE.Color("#bbdef2");
  const dimColor = new THREE.Color("#466184");
  const focusColor = new THREE.Color("#dceaff");
  const geometry = new THREE.SphereGeometry(1, 24, 24);
  const nodes = [];
  const fieldNodes = [];

  nodeSpecs.forEach((spec) => {
    const material = new THREE.MeshStandardMaterial({
      color: nodeColor.clone(),
      emissive: spec.stage === "decision" ? new THREE.Color("#0c2140") : new THREE.Color("#050811"),
      emissiveIntensity: 0.95,
      roughness: 0.32,
      metalness: 0.12,
      transparent: true,
      opacity: 0.9,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.setScalar(spec.size);
    mesh.position.set(...spec.base);
    root.add(mesh);

    nodes.push({
      ...spec,
      mesh,
      currentScale: spec.size,
      targetScale: spec.size,
      pulseSeed: Math.random() * Math.PI * 2,
    });
  });

  const fieldGeometry = new THREE.SphereGeometry(1, 12, 12);
  fieldSpecs.forEach(([x, y, z, size], index) => {
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(index % 5 === 0 ? "#d1aad7" : "#5a6384"),
      emissive: new THREE.Color("#020202"),
      emissiveIntensity: 0.5,
      roughness: 0.4,
      metalness: 0.04,
      transparent: true,
      opacity: index % 5 === 0 ? 0.9 : 0.55,
    });

    const mesh = new THREE.Mesh(fieldGeometry, material);
    mesh.scale.setScalar(size);
    mesh.position.set(x, y, z);
    fieldRoot.add(mesh);

    fieldNodes.push({
      mesh,
      base: [x, y, z],
      size,
      seed: Math.random() * Math.PI * 2,
    });
  });

  const nodeMap = Object.fromEntries(nodes.map((node) => [node.id, node]));
  const lines = lineSpecs.map(([from, to, visibleFromStage]) => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(6);
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color: 0xbbdef2,
      transparent: true,
      opacity: 0.06,
    });
    const line = new THREE.Line(geometry, material);
    root.add(line);

    return { from, to, visibleFromStage, line, positions, targetOpacity: 0.06 };
  });

  const stageWeights = {
    document: 0,
    graph: 1,
    agent: 2,
    decision: 3,
  };

  let currentStage = "document";
  let rafId = 0;

  function resize() {
    const parent = canvas.parentElement;
    const width = parent.clientWidth;
    const height = parent.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function setStage(stage) {
    currentStage = stage;
  }

  function animate(time = 0) {
    const t = time * 0.001;
    const motionStrength = reduceMotion ? 0 : currentStage === "decision" ? 0.18 : 1;

    nodes.forEach((node) => {
      const isActiveCluster = node.stage === currentStage;
      const decisionMode = currentStage === "decision";
      const baseScale = node.size * (isActiveCluster ? 1.28 : decisionMode ? 0.92 : 1);
      const pulse =
        currentStage === "agent" && node.stage === "agent"
          ? 0.04 * (1 + Math.sin(t * 2.6 + node.pulseSeed))
          : 0;

      node.targetScale = baseScale + pulse;
      node.currentScale += (node.targetScale - node.currentScale) * 0.08;
      node.mesh.scale.setScalar(node.currentScale);

      const [baseX, baseY, baseZ] = node.base;
      const idleX = Math.sin(t * 0.38 + node.pulseSeed) * 0.06 * motionStrength;
      const idleY = Math.cos(t * 0.44 + node.pulseSeed * 1.3) * 0.08 * motionStrength;
      const idleZ = Math.sin(t * 0.31 + node.pulseSeed * 0.8) * 0.05 * motionStrength;

      node.mesh.position.x += (baseX + idleX - node.mesh.position.x) * 0.08;
      node.mesh.position.y += (baseY + idleY - node.mesh.position.y) * 0.08;
      node.mesh.position.z += (baseZ + idleZ - node.mesh.position.z) * 0.08;

      const activeColor = currentStage === "decision" && node.id === "decision" ? focusColor : nodeColor;
      node.mesh.material.color.lerp(isActiveCluster || (currentStage === "decision" && node.id === "decision") ? activeColor : dimColor, 0.08);
      node.mesh.material.opacity += (((isActiveCluster || node.id === "decision") ? 0.98 : 0.72) - node.mesh.material.opacity) * 0.08;
      node.mesh.material.emissiveIntensity += (((isActiveCluster || (currentStage === "decision" && node.id === "decision")) ? 1.5 : 0.68) - node.mesh.material.emissiveIntensity) * 0.08;
    });

    fieldNodes.forEach((node, index) => {
      const [baseX, baseY, baseZ] = node.base;
      const driftX = Math.sin(t * 0.14 + node.seed) * 0.035 * motionStrength;
      const driftY = Math.cos(t * 0.16 + node.seed * 1.1) * 0.045 * motionStrength;

      node.mesh.position.x += (baseX + driftX - node.mesh.position.x) * 0.05;
      node.mesh.position.y += (baseY + driftY - node.mesh.position.y) * 0.05;
      node.mesh.position.z += (baseZ - node.mesh.position.z) * 0.05;

      const isWarm = index % 5 === 0;
      const targetOpacity =
        currentStage === "decision"
          ? isWarm
            ? 0.58
            : 0.28
          : isWarm
            ? 0.9
            : 0.5;

      node.mesh.material.opacity += (targetOpacity - node.mesh.material.opacity) * 0.08;
      node.mesh.material.emissiveIntensity +=
        (((currentStage === "agent" && isWarm) || (currentStage === "decision" && index % 7 === 0) ? 0.95 : 0.48) -
          node.mesh.material.emissiveIntensity) *
        0.08;
    });

    lines.forEach((item) => {
      const fromNode = nodeMap[item.from].mesh.position;
      const toNode = nodeMap[item.to].mesh.position;

      item.positions[0] = fromNode.x;
      item.positions[1] = fromNode.y;
      item.positions[2] = fromNode.z;
      item.positions[3] = toNode.x;
      item.positions[4] = toNode.y;
      item.positions[5] = toNode.z;
      item.line.geometry.attributes.position.needsUpdate = true;

      const threshold = stageWeights[item.visibleFromStage];
      const visible = stageWeights[currentStage] >= threshold;
      item.targetOpacity = visible ? (currentStage === "decision" ? 0.16 : currentStage === "agent" ? 0.24 : 0.14) : 0.02;
      item.line.material.opacity += (item.targetOpacity - item.line.material.opacity) * 0.08;
    });

    root.rotation.y = Math.sin(t * 0.18) * 0.05 * (currentStage === "decision" ? 0.4 : 1);
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(animate);
  }

  resize();
  animate();
  window.addEventListener("resize", resize, { passive: true });

  return {
    setStage,
    destroy() {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      geometry.dispose();
      fieldGeometry.dispose();
      lines.forEach((item) => {
        item.line.geometry.dispose();
        item.line.material.dispose();
      });
      nodes.forEach((node) => node.mesh.material.dispose());
      fieldNodes.forEach((node) => node.mesh.material.dispose());
    },
  };
}

function initGraphSystem() {
  graphController = createKnowledgeGraph();
  const wrap = document.querySelector(".system-canvas-wrap");
  if (graphController && wrap) wrap.classList.add("is-graph-ready");
  applyStage(activeStage);
  bindStageControls();
  startStageCycle();
}

function init() {
  initLucideIcons();
  setRevealStates();
  initAiInsightReveal();
  initGraphSystem();
  bindTrustFlow();
}

init();

window.addEventListener("beforeunload", () => {
  pauseStageCycle();
  pauseTrustFlowCycle();
  if (graphController) graphController.destroy();
});
