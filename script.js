const threeCanvas = document.getElementById("three-canvas");
const bgVideo = document.getElementById("bg-video");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const videoSource = "https://stream.mux.com/8wrHPCX2dC3msyYU9ObwqNdm00u3ViXvOSHUMRYSEe5Q.m3u8";

let bgHls = null;
let threeRafId = 0;
let renderer = null;

function initBackgroundVideo() {
  if (!bgVideo) return;

  if (bgVideo.canPlayType("application/vnd.apple.mpegurl")) {
    bgVideo.src = videoSource;
  } else if (window.Hls && window.Hls.isSupported()) {
    bgHls = new window.Hls({
      autoStartLoad: true,
      enableWorker: true,
    });
    bgHls.loadSource(videoSource);
    bgHls.attachMedia(bgVideo);
  }

  const playPromise = bgVideo.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {});
  }
}

function initThreeField() {
  if (!threeCanvas || !window.THREE) return;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.02);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const particleCount = window.innerWidth < 720 ? 520 : 800;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const baseY = new Float32Array(particleCount);
  const color1 = new THREE.Color(0x3b82f6);
  const color2 = new THREE.Color(0x22d3ee);

  try {
    renderer = new THREE.WebGLRenderer({ canvas: threeCanvas, alpha: true, antialias: true });
  } catch {
    threeCanvas.remove();
    return;
  }

  for (let index = 0; index < particleCount; index += 1) {
    const i3 = index * 3;
    positions[i3] = (Math.random() - 0.5) * 20;
    positions[i3 + 1] = (Math.random() - 0.5) * 20;
    positions[i3 + 2] = (Math.random() - 0.5) * 10;
    baseY[index] = positions[i3 + 1];

    const mixedColor = color1.clone().lerp(color2, Math.random());
    colors[i3] = mixedColor.r;
    colors[i3 + 1] = mixedColor.g;
    colors[i3 + 2] = mixedColor.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    depthWrite: false,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);
  camera.position.z = 5;

  const mouse = new THREE.Vector2();
  const targetMouse = new THREE.Vector2();
  const particlePositions = geometry.attributes.position.array;

  window.addEventListener(
    "pointermove",
    (event) => {
      targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      targetMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    },
    { passive: true }
  );

  function resizeThree() {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  function animateThree(time = 0) {
    const t = time * 0.001;

    mouse.x += (targetMouse.x - mouse.x) * 0.05;
    mouse.y += (targetMouse.y - mouse.y) * 0.05;

    particles.rotation.y = t * 0.3;
    particles.rotation.x = reduceMotion ? 0.1 : Math.sin(t * 0.5) * 0.2;

    if (!reduceMotion) {
      for (let index = 0; index < particleCount; index += 1) {
        const i3 = index * 3;
        particlePositions[i3 + 1] = baseY[index] + Math.sin(t * 2 + index * 0.1) * 0.35;
      }
      geometry.attributes.position.needsUpdate = true;
    }

    camera.position.x = mouse.x * 0.5;
    camera.position.y = mouse.y * 0.5;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);

    if (!reduceMotion) {
      threeRafId = requestAnimationFrame(animateThree);
    }
  }

  window.addEventListener("resize", resizeThree, { passive: true });
  resizeThree();
  animateThree();
}

function initRevealMotion() {
  if (window.gsap && window.ScrollTrigger && !reduceMotion) {
    gsap.registerPlugin(ScrollTrigger);

    gsap.set(".reveal", { opacity: 0, y: 32 });
    gsap.set(".hero-content", { opacity: 1, y: 0 });

    gsap.from(".hero-content > *", {
      y: 24,
      duration: 0.85,
      ease: "power3.out",
      stagger: 0.12,
      delay: 0.15,
    });

    gsap.utils.toArray(".reveal:not(.hero-content)").forEach((element) => {
      gsap.to(element, {
        opacity: 1,
        y: 0,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: {
          trigger: element,
          start: "top 84%",
          toggleActions: "play none none none",
        },
      });
    });

    gsap.utils.toArray(".section:not(.hero)").forEach((section) => {
      gsap.fromTo(
        section,
        { "--section-glow": 0 },
        {
          "--section-glow": 1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    });
    return;
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
}

initBackgroundVideo();
initThreeField();
initRevealMotion();

window.addEventListener("beforeunload", () => {
  cancelAnimationFrame(threeRafId);
  if (renderer) renderer.dispose();
  if (bgHls) bgHls.destroy();
});
