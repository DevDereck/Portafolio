const root = document.documentElement;
const themeToggle = document.getElementById("dock-theme");
const languageToggle = document.getElementById("dock-lang");
const mobileThemeToggle = document.getElementById("mobile-theme");
const mobileLanguageToggle = document.getElementById("mobile-lang");
const metaDescription = document.getElementById("meta-description");
const mobileMenu = document.querySelector(".mobile-menu");
const mobileMenuTrigger = document.getElementById("mobile-menu-trigger");
const mobileMenuPanel = document.getElementById("mobile-menu-panel");
const mobileCurrentLabel = document.getElementById("mobile-current-label");
const mobileThemeValue = document.getElementById("mobile-theme-value");
const mobileSoundValue = document.getElementById("mobile-sound-value");
const mobileLangValue = document.getElementById("mobile-lang-value");
const backgroundCanvas = document.getElementById("bg-canvas");
const heroSection = document.querySelector("section#inicio.hero");
const savedTheme = localStorage.getItem("theme");
const savedSound = localStorage.getItem("sound");
let currentLanguage = localStorage.getItem("lang") || "es";
let soundEnabled = savedSound !== "off";
let backgroundAnimator = null;

const parseColorToRgb = (color) => {
  const value = color.trim();

  if (value.startsWith("#")) {
    let hex = value.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("");
    }

    const parsed = Number.parseInt(hex, 16);
    if (Number.isNaN(parsed)) {
      return { r: 9, g: 132, b: 227 };
    }

    return {
      r: (parsed >> 16) & 255,
      g: (parsed >> 8) & 255,
      b: parsed & 255,
    };
  }

  const match = value.match(/\d+/g);
  if (match && match.length >= 3) {
    return {
      r: Number(match[0]),
      g: Number(match[1]),
      b: Number(match[2]),
    };
  }

  return { r: 9, g: 132, b: 227 };
};

const rgba = (rgb, alpha) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;

const mixRgb = (source, target, amount) => ({
  r: Math.round(source.r + (target.r - source.r) * amount),
  g: Math.round(source.g + (target.g - source.g) * amount),
  b: Math.round(source.b + (target.b - source.b) * amount),
});

const initAnimatedBackground = () => {
  if (!(backgroundCanvas instanceof HTMLCanvasElement)) {
    return null;
  }

  const ctx = backgroundCanvas.getContext("2d");
  if (!ctx) {
    return null;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const particles = [];
  const streaks = [];
  let animationFrameId = 0;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let accent = { r: 9, g: 132, b: 227 };
  let accent2 = { r: 0, g: 206, b: 201 };
  let muted = { r: 169, g: 180, b: 192 };
  let bg = { r: 30, g: 39, b: 46 };
  let isLightTheme = false;

  const readPalette = () => {
    const styles = getComputedStyle(root);
    const text = parseColorToRgb(styles.getPropertyValue("--text") || "#1e272e");
    isLightTheme = root.getAttribute("data-theme") === "light";

    accent = parseColorToRgb(styles.getPropertyValue("--accent") || "#0984e3");
    accent2 = parseColorToRgb(styles.getPropertyValue("--accent-2") || "#00cec9");
    muted = parseColorToRgb(styles.getPropertyValue("--muted") || "#a9b4c0");
    bg = parseColorToRgb(styles.getPropertyValue("--bg") || "#1e272e");

    if (isLightTheme) {
      accent = mixRgb(accent, text, 0.14);
      accent2 = mixRgb(accent2, text, 0.1);
      muted = mixRgb(muted, text, 0.24);
    } else {
      accent = mixRgb(accent, { r: 255, g: 255, b: 255 }, 0.12);
      accent2 = mixRgb(accent2, { r: 255, g: 255, b: 255 }, 0.1);
    }
  };

  const getHeroVisibleRange = () => {
    if (!(heroSection instanceof HTMLElement)) {
      return { top: 0, bottom: height, visible: true };
    }

    const rect = heroSection.getBoundingClientRect();
    const top = Math.max(0, rect.top);
    const bottom = Math.min(height, rect.bottom);
    return { top, bottom, visible: bottom - top > 4 };
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(window.innerWidth, 1);
    height = Math.max(window.innerHeight, 1);
    backgroundCanvas.width = Math.floor(width * dpr);
    backgroundCanvas.height = Math.floor(height * dpr);
    backgroundCanvas.style.width = `${width}px`;
    backgroundCanvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const particleCount = Math.max(40, Math.min(110, Math.floor((width * height) / 17000)));
    particles.length = 0;
    for (let index = 0; index < particleCount; index += 1) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.6 + 0.6,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        alpha: Math.random() * 0.32 + 0.14,
        pulse: Math.random() * Math.PI * 2,
      });
    }
  };

  const createStreak = () => {
    const heroRange = getHeroVisibleRange();
    const rangeTop = heroRange.visible ? heroRange.top : 0;
    const rangeBottom = heroRange.visible ? heroRange.bottom : height * 0.88;
    const rangeHeight = Math.max(40, rangeBottom - rangeTop);
    const fromLeft = Math.random() > 0.5;
    const startX = fromLeft ? -120 : width + 120;
    const startY = rangeTop + Math.random() * rangeHeight;

    return {
      x: startX,
      y: startY,
      len: Math.random() * 110 + 85,
      speed: Math.random() * 3 + 2.2,
      angle: fromLeft ? 0.75 : Math.PI - 0.75,
      life: 0,
      maxLife: Math.random() * 110 + 100,
      alpha: Math.random() * 0.2 + 0.12,
    };
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);

    const heroRange = getHeroVisibleRange();
    if (!heroRange.visible) {
      return;
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, heroRange.top, width, heroRange.bottom - heroRange.top);
    ctx.clip();

    const heroHeight = heroRange.bottom - heroRange.top;
    const glowCenterY = heroRange.top + heroHeight * 0.58;
    const neonA = ctx.createRadialGradient(
      width * 0.33,
      glowCenterY,
      0,
      width * 0.33,
      glowCenterY,
      Math.max(220, heroHeight * 0.52)
    );
    neonA.addColorStop(0, rgba(accent, isLightTheme ? 0.155 : 0.13));
    neonA.addColorStop(1, rgba(accent, 0));
    ctx.fillStyle = neonA;
    ctx.fillRect(0, heroRange.top, width, heroHeight);

    const neonB = ctx.createRadialGradient(
      width * 0.67,
      glowCenterY,
      0,
      width * 0.67,
      glowCenterY,
      Math.max(220, heroHeight * 0.52)
    );
    neonB.addColorStop(0, rgba(accent2, isLightTheme ? 0.145 : 0.12));
    neonB.addColorStop(1, rgba(accent2, 0));
    ctx.fillStyle = neonB;
    ctx.fillRect(0, heroRange.top, width, heroHeight);

    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.pulse += 0.02;

      if (particle.x < -5) particle.x = width + 5;
      if (particle.x > width + 5) particle.x = -5;
      if (particle.y < -5) particle.y = height + 5;
      if (particle.y > height + 5) particle.y = -5;

      const pulseAlpha = particle.alpha + Math.sin(particle.pulse) * 0.08;
      const particleBaseAlpha = isLightTheme ? 0.18 : 0.07;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = rgba(muted, Math.max(particleBaseAlpha, pulseAlpha));
      ctx.fill();

      if (particle.radius > 1.7) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = rgba(accent, isLightTheme ? 0.095 : 0.025);
        ctx.fill();
      }
    });

    if (streaks.length < 6 && Math.random() < 0.036) {
      streaks.push(createStreak());
    }

    for (let index = streaks.length - 1; index >= 0; index -= 1) {
      const streak = streaks[index];
      streak.life += 1;
      streak.x += Math.cos(streak.angle) * streak.speed;
      streak.y += Math.sin(streak.angle) * streak.speed;

      const t = streak.life / streak.maxLife;
      const alpha = streak.alpha * (1 - t);
      const endX = streak.x - Math.cos(streak.angle) * streak.len;
      const endY = streak.y - Math.sin(streak.angle) * streak.len;

      const gradient = ctx.createLinearGradient(streak.x, streak.y, endX, endY);
      gradient.addColorStop(0, rgba(accent2, isLightTheme ? alpha * 1.5 : alpha * 0.9));
      gradient.addColorStop(0.55, rgba(accent, isLightTheme ? alpha * 1.22 : alpha * 0.66));
      gradient.addColorStop(1, rgba(accent, 0));

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.45;
      ctx.beginPath();
      ctx.moveTo(streak.x, streak.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(streak.x, streak.y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = rgba(accent2, Math.max(0, isLightTheme ? alpha * 1.65 : alpha * 0.9));
      ctx.fill();

      ctx.beginPath();
      ctx.arc(streak.x, streak.y, 6.8, 0, Math.PI * 2);
      ctx.fillStyle = rgba(accent, Math.max(0, isLightTheme ? alpha * 0.42 : alpha * 0.16));
      ctx.fill();

      if (streak.life >= streak.maxLife) {
        streaks.splice(index, 1);
      }
    }

    const fadeMask = ctx.createLinearGradient(0, heroRange.top, 0, heroRange.bottom);
    fadeMask.addColorStop(0, "rgba(0, 0, 0, 0.72)");
    fadeMask.addColorStop(0.08, "rgba(0, 0, 0, 1)");
    fadeMask.addColorStop(0.74, "rgba(0, 0, 0, 1)");
    fadeMask.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.globalCompositeOperation = "destination-in";
    ctx.fillStyle = fadeMask;
    ctx.fillRect(0, heroRange.top, width, heroHeight);
    ctx.globalCompositeOperation = "source-over";

    const blendDown = ctx.createLinearGradient(0, heroRange.bottom - Math.min(220, heroHeight * 0.35), 0, heroRange.bottom);
    blendDown.addColorStop(0, rgba(bg, 0));
    blendDown.addColorStop(1, rgba(bg, isLightTheme ? 0.72 : 0.96));
    ctx.fillStyle = blendDown;
    ctx.fillRect(0, heroRange.bottom - Math.min(220, heroHeight * 0.35), width, Math.min(220, heroHeight * 0.35));

    ctx.restore();
  };

  const animate = () => {
    draw();
    animationFrameId = requestAnimationFrame(animate);
  };

  const start = () => {
    if (animationFrameId) {
      return;
    }
    animate();
  };

  const stop = () => {
    if (!animationFrameId) {
      return;
    }
    cancelAnimationFrame(animationFrameId);
    animationFrameId = 0;
  };

  readPalette();
  resize();

  if (reducedMotion) {
    draw();
  } else {
    start();
  }

  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    if (reducedMotion) {
      return;
    }

    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  return {
    refreshPalette: () => {
      readPalette();
      if (reducedMotion) {
        draw();
      }
    },
  };
};

const translations = {
  es: {
    pageTitle: "Dereck Vargas — Portafolio",
    metaDescription: "Portafolio de Dereck Vargas, desarrollador Full Stack enfocado en frontend.",
    "hero.eyebrow": "Hola 👋, soy",
    "hero.titleFirst": "Dereck",
    "hero.titleLast": "Vargas",
    "hero.lead": "Desarrollador Full Stack, apasionado por el desarrollo Frontend.",
    "hero.ctaProjects": "Descargar CV",
    "hero.ctaContact": "Contáctame",
    "about.title": "About me",
    "about.p1": "Me encanta crear sitios web que brinden una <strong>experiencia de usuario</strong> clara y satisfactoria. Puedes ver algunos de mis <strong>proyectos</strong> en la sección de proyectos.",
    "about.p2": "Soy una persona <strong>autodidacta</strong>, responsable y comprometida con mi trabajo. Constantemente aprendo nuevas <strong>tecnologías</strong> y herramientas para mejorar mis habilidades.",
    "about.p3": "No dudes en <strong>contactarme</strong> si tienes una idea o pregunta.",
    "about.p2": "Soy una persona <strong>autodidacta</strong>, responsable y comprometida con mi trabajo. Constantemente aprendo nuevas <strong>tecnologías</strong> y herramientas para mejorar mis habilidades.",
    "about.p3": "No dudes en <strong>contactarme</strong> si tienes una idea o pregunta.",
    "projects.title": "Proyectos",
    "projects.viewAll": "Ver todos",
    "projects.caseStudy": "Ver caso",
    "projects.card1.tag": "UI/UX · Frontend",
    "projects.card1.title": "Dashboard SaaS",
    "projects.card1.text": "Diseño y desarrollo de una plataforma analítica con métricas en tiempo real y flujos optimizados.",
    "projects.card2.tag": "Web App",
    "projects.card2.title": "Sistema de Reservas",
    "projects.card2.text": "Producto responsive para gestión de reservas con foco en conversión y experiencia de uso.",
    "projects.card3.tag": "Design System",
    "projects.card3.title": "Biblioteca de Componentes",
    "projects.card3.text": "Creación de componentes reutilizables para reducir tiempos de desarrollo y mantener consistencia visual.",
    "experience.title": "Experiencia",
    "experience.present": "Actual",
    "experience.item1.role": "Product Designer & Frontend — Empresa Actual",
    "experience.item1.text": "Diseño de producto, prototipado y desarrollo de interfaces.",
    "experience.item2.role": "UI Designer — Agencia Digital",
    "experience.item2.text": "Landing pages, e-commerce y optimización de conversión.",
    "experience.item3.role": "Freelance — Diseño y desarrollo web",
    "experience.item3.text": "Proyectos para marcas personales y negocios locales.",
    "articles.title": "Últimos artículos",
    "articles.goBlog": "Ir al blog",
    "articles.item1.date": "18 ene 2026",
    "articles.item1.title": "Mi stack de IA para diseño y desarrollo",
    "articles.item2.date": "17 nov 2025",
    "articles.item2.title": "Sistema de espaciado con grid de 8pt",
    "articles.item3.date": "04 nov 2025",
    "articles.item3.title": "Contraste de color y accesibilidad WCAG",
    "footer.title": "¿Trabajamos juntos?",
    "dock.nav": "Barra rápida",
    "dock.home": "Inicio",
    "dock.profile": "Sobre mí",
    "dock.articles": "Artículos",
    "dock.code": "Código",
    "dock.layers": "Capas",
    "dock.theme": "Cambiar tema",
    "dock.sound": "Sonido",
    "dock.language": "Idioma",
    "mobile.menu": "Menú",
    "mobile.settings": "SETTINGS",
    "mobile.nav": "Menú móvil",
    "mobile.navItems": "Navegación móvil",
    "mobile.value.dark": "Dark",
    "mobile.value.light": "Light",
    "mobile.value.on": "On",
    "mobile.value.off": "Off",
    "mobile.value.spanish": "Español",
    "mobile.value.english": "Inglés",
  },
  en: {
    pageTitle: "Dereck Vargas — Portfolio",
    metaDescription: "Portfolio of Dereck Vargas, Full Stack developer focused on frontend.",
    "hero.eyebrow": "Hi 👋, I'm",
    "hero.titleFirst": "Dereck",
    "hero.titleLast": "Vargas",
    "hero.lead": "Full Stack developer, passionate about frontend development.",
    "hero.ctaProjects": "Download CV",
    "hero.ctaContact": "Contact me",
    "about.title": "About me",
    "about.p1": "I love building websites that deliver a clear and enjoyable <strong>user experience</strong>. You can check some of my <strong>projects</strong> in the projects section.",
    "about.p2": "I am <strong>self-taught</strong>, responsible, and fully committed to my work. I constantly learn new <strong>technologies</strong> and tools to improve my skills.",
    "about.p3": "Feel free to <strong>contact me</strong> if you have an idea or question.",
    "about.p2": "I am <strong>self-taught</strong>, responsible, and fully committed to my work. I constantly learn new <strong>technologies</strong> and tools to improve my skills.",
    "about.p3": "Feel free to <strong>contact me</strong> if you have an idea or question.",
    "projects.title": "Projects",
    "projects.viewAll": "View all",
    "projects.caseStudy": "View case study",
    "projects.card1.tag": "UI/UX · Frontend",
    "projects.card1.title": "SaaS Dashboard",
    "projects.card1.text": "Design and development of an analytics platform with real-time metrics and optimized flows.",
    "projects.card2.tag": "Web App",
    "projects.card2.title": "Booking System",
    "projects.card2.text": "Responsive product for reservation management focused on conversion and usability.",
    "projects.card3.tag": "Design System",
    "projects.card3.title": "Component Library",
    "projects.card3.text": "Creation of reusable components to reduce development time and keep visual consistency.",
    "experience.title": "Experience",
    "experience.present": "Present",
    "experience.item1.role": "Product Designer & Frontend — Current Company",
    "experience.item1.text": "Product design, prototyping, and interface development.",
    "experience.item2.role": "UI Designer — Digital Agency",
    "experience.item2.text": "Landing pages, e-commerce, and conversion optimization.",
    "experience.item3.role": "Freelance — Web design and development",
    "experience.item3.text": "Projects for personal brands and local businesses.",
    "articles.title": "Latest articles",
    "articles.goBlog": "Go to blog",
    "articles.item1.date": "Jan 18, 2026",
    "articles.item1.title": "My AI stack for design and development",
    "articles.item2.date": "Nov 17, 2025",
    "articles.item2.title": "8pt spacing system guide",
    "articles.item3.date": "Nov 04, 2025",
    "articles.item3.title": "Color contrast and WCAG accessibility",
    "footer.title": "Shall we work together?",
    "dock.nav": "Quick dock",
    "dock.home": "Home",
    "dock.profile": "About",
    "dock.articles": "Articles",
    "dock.code": "Code",
    "dock.layers": "Layers",
    "dock.theme": "Toggle theme",
    "dock.sound": "Sound",
    "dock.language": "Language",
    "mobile.menu": "Menu",
    "mobile.settings": "SETTINGS",
    "mobile.nav": "Mobile menu",
    "mobile.navItems": "Mobile navigation",
    "mobile.value.dark": "Dark",
    "mobile.value.light": "Light",
    "mobile.value.on": "On",
    "mobile.value.off": "Off",
    "mobile.value.spanish": "Spanish",
    "mobile.value.english": "English",
  },
};

const getDictionary = () => translations[currentLanguage] ?? translations.es;

const updateMobileSettingsText = () => {
  const dictionary = getDictionary();
  const isLight = root.getAttribute("data-theme") === "light";

  if (mobileThemeValue) {
    mobileThemeValue.textContent = isLight ? dictionary["mobile.value.light"] : dictionary["mobile.value.dark"];
  }

  if (mobileSoundValue) {
    mobileSoundValue.textContent = soundEnabled ? dictionary["mobile.value.on"] : dictionary["mobile.value.off"];
  }

  if (mobileLangValue) {
    mobileLangValue.textContent = currentLanguage === "es"
      ? dictionary["mobile.value.spanish"]
      : dictionary["mobile.value.english"];
  }
};

const updateMobileCurrentLabel = () => {
  if (!mobileCurrentLabel) {
    return;
  }

  const activeMobileLink = document.querySelector(".mobile-nav-link.is-active");
  const text = activeMobileLink?.querySelector("span")?.textContent?.trim();
  if (text) {
    mobileCurrentLabel.textContent = text;
  }
};

const translateTextNodes = (lang) => {
  const dictionary = translations[lang] ?? translations.es;
  document.querySelectorAll("[data-i18n-html]").forEach((element) => {
    const key = element.getAttribute("data-i18n-html");
    if (!key || !dictionary[key]) {
      return;
    }
    element.innerHTML = dictionary[key];
  });

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    if (!key || !dictionary[key]) {
      return;
    }
    element.textContent = dictionary[key];
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    const key = element.getAttribute("data-i18n-aria");
    if (!key || !dictionary[key]) {
      return;
    }
    element.setAttribute("aria-label", dictionary[key]);
  });

  document.title = dictionary.pageTitle;
  if (metaDescription) {
    metaDescription.setAttribute("content", dictionary.metaDescription);
  }

  root.setAttribute("lang", lang);
};

const applyLanguage = (lang) => {
  currentLanguage = lang === "en" ? "en" : "es";
  translateTextNodes(currentLanguage);
  updateMobileSettingsText();
  updateMobileCurrentLabel();
  localStorage.setItem("lang", currentLanguage);
};

applyLanguage(currentLanguage);

backgroundAnimator = initAnimatedBackground();

if (savedTheme === "light") {
  root.setAttribute("data-theme", "light");
}

const toggleTheme = () => {
  const current = root.getAttribute("data-theme");
  if (current === "light") {
    root.removeAttribute("data-theme");
    localStorage.setItem("theme", "dark");
  } else {
    root.setAttribute("data-theme", "light");
    localStorage.setItem("theme", "light");
  }
  backgroundAnimator?.refreshPalette();
  updateMobileSettingsText();
};

themeToggle?.addEventListener("click", toggleTheme);
mobileThemeToggle?.addEventListener("click", toggleTheme);

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

const dockItems = Array.from(document.querySelectorAll(".dock a.dock-item"));
const mobileNavLinks = Array.from(document.querySelectorAll(".mobile-nav-link[href^='#']"));
const allDockItems = Array.from(document.querySelectorAll(".dock .dock-item"));
const dock = document.querySelector(".dock");
const dockTooltip = document.getElementById("dock-tooltip");
let dockGeometry = [];
let hotItemIndex = -1;

const setActiveNavigationByHref = (href) => {
  dockItems.forEach((item) => {
    item.classList.toggle("active", item.getAttribute("href") === href);
  });

  mobileNavLinks.forEach((item) => {
    item.classList.toggle("is-active", item.getAttribute("href") === href);
  });

  updateMobileCurrentLabel();
};

dockItems.forEach((item) => {
  item.addEventListener("click", () => {
    const href = item.getAttribute("href");
    if (href) {
      setActiveNavigationByHref(href);
    }
  });
});

const closeMobileMenu = () => {
  if (!mobileMenu || !mobileMenuTrigger || !mobileMenuPanel) {
    return;
  }

  mobileMenu.classList.remove("is-open");
  mobileMenuPanel.hidden = true;
  mobileMenuTrigger.setAttribute("aria-expanded", "false");
};

const openMobileMenu = () => {
  if (!mobileMenu || !mobileMenuTrigger || !mobileMenuPanel) {
    return;
  }

  mobileMenu.classList.add("is-open");
  mobileMenuPanel.hidden = false;
  mobileMenuTrigger.setAttribute("aria-expanded", "true");
};

mobileMenuTrigger?.addEventListener("click", () => {
  if (mobileMenuPanel?.hidden) {
    openMobileMenu();
  } else {
    closeMobileMenu();
  }
});

mobileNavLinks.forEach((item) => {
  item.addEventListener("click", () => {
    const href = item.getAttribute("href");
    if (href) {
      setActiveNavigationByHref(href);
    }
    closeMobileMenu();
  });
});

document.addEventListener("pointerdown", (event) => {
  if (!mobileMenu || mobileMenuPanel?.hidden) {
    return;
  }

  if (event.target instanceof Node && !mobileMenu.contains(event.target)) {
    closeMobileMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMobileMenu();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 620) {
    closeMobileMenu();
  }
});

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const computeDockGeometry = () => {
  if (!dock) {
    dockGeometry = [];
    return;
  }

  const dockRect = dock.getBoundingClientRect();
  dockGeometry = allDockItems.map((item) => ({
    centerX: dockRect.left + item.offsetLeft + item.offsetWidth / 2,
  }));
};

const resetDockWave = () => {
  allDockItems.forEach((item) => {
    item.style.setProperty("--dock-lift", "0px");
    item.style.setProperty("--dock-scale", "1");
    item.style.removeProperty("z-index");
    item.classList.remove("is-raised");
  });
};

const applyDockWave = (pointerX, pointerY) => {
  if (!dockGeometry.length) {
    computeDockGeometry();
  }

  const spread = 92;
  const verticalSpread = 78;
  const maxLift = 20;
  const maxScale = 1.4;

  const dockRect = dock?.getBoundingClientRect();
  const dockCenterY = dockRect ? dockRect.top + dockRect.height * 0.52 : pointerY;
  const verticalDistance = Math.abs(pointerY - dockCenterY);
  const verticalInfluence = Math.exp(-Math.pow(verticalDistance / verticalSpread, 2));

  let hottestItem = null;
  let hottestInfluence = 0;

  allDockItems.forEach((item, index) => {
    const centerX = dockGeometry[index]?.centerX ?? 0;
    const distanceX = Math.abs(pointerX - centerX);
    const gaussian = Math.exp(-Math.pow(distanceX / spread, 2));
    const eased = gaussian * verticalInfluence;
    const lift = maxLift * eased;
    const scale = 1 + (maxScale - 1) * eased;

    item.style.setProperty("--dock-lift", `${lift.toFixed(2)}px`);
    item.style.setProperty("--dock-scale", scale.toFixed(3));
    item.style.zIndex = String(Math.round(10 + eased * 20));

    if (eased > 0.35) {
      item.classList.add("is-raised");
    } else {
      item.classList.remove("is-raised");
    }

    if (eased > hottestInfluence) {
      hottestInfluence = eased;
      hottestItem = item;
    }
  });

  if (hottestItem && hottestInfluence > 0.22) {
    const candidateIndex = allDockItems.indexOf(hottestItem);

    if (hotItemIndex === -1) {
      hotItemIndex = candidateIndex;
    } else {
      const currentHotInfluence = (() => {
        const currentHot = allDockItems[hotItemIndex];
        if (!currentHot) {
          return 0;
        }
        const currentCenter = dockGeometry[hotItemIndex]?.centerX ?? 0;
        const currentDistanceX = Math.abs(pointerX - currentCenter);
        const currentGaussian = Math.exp(-Math.pow(currentDistanceX / spread, 2));
        return currentGaussian * verticalInfluence;
      })();

      if (hottestInfluence > currentHotInfluence + 0.05) {
        hotItemIndex = candidateIndex;
      }
    }
  } else {
    hotItemIndex = -1;
  }

  allDockItems.forEach((item) => item.classList.remove("hot"));
  if (hotItemIndex >= 0 && allDockItems[hotItemIndex]) {
    allDockItems[hotItemIndex].classList.add("hot");
  }
};

let rafId = 0;
let targetPointerX = 0;
let targetPointerY = 0;
let currentPointerX = 0;
let currentPointerY = 0;
let dockWaveActive = false;

const animateDock = () => {
  if (!dockWaveActive) {
    rafId = 0;
    return;
  }

  currentPointerX += (targetPointerX - currentPointerX) * 0.22;
  currentPointerY += (targetPointerY - currentPointerY) * 0.22;
  applyDockWave(currentPointerX, currentPointerY);
  rafId = requestAnimationFrame(animateDock);
};

const startDockAnimation = (x, y) => {
  targetPointerX = x;
  targetPointerY = y;

  if (!dockWaveActive) {
    currentPointerX = x;
    currentPointerY = y;
  }

  dockWaveActive = true;
  if (!rafId) {
    rafId = requestAnimationFrame(animateDock);
  }
};

const stopDockAnimation = () => {
  dockWaveActive = false;
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
  resetDockWave();
  hotItemIndex = -1;
  allDockItems.forEach((item) => item.classList.remove("hot"));
};

const hideDockTooltip = () => {
  if (dockTooltip) {
    dockTooltip.classList.remove("visible");
  }
};

const showDockTooltip = (element) => {
  if (!dock || !dockTooltip || !element) {
    return;
  }

  const label = element.getAttribute("aria-label") || "";
  if (!label) {
    hideDockTooltip();
    return;
  }

  const dockRect = dock.getBoundingClientRect();
  const itemRect = element.getBoundingClientRect();
  const left = itemRect.left + itemRect.width / 2 - dockRect.left;

  dockTooltip.textContent = label;
  dockTooltip.style.left = `${left.toFixed(1)}px`;
  dockTooltip.classList.add("visible");
};

if (dock && !prefersReducedMotion) {
  computeDockGeometry();

  window.addEventListener("resize", computeDockGeometry);
  window.addEventListener("scroll", computeDockGeometry, { passive: true });

  dock.addEventListener("pointermove", (event) => {
    if (event.pointerType && event.pointerType !== "mouse") {
      return;
    }
    startDockAnimation(event.clientX, event.clientY);

    const hoveredItem = event.target instanceof Element
      ? event.target.closest(".dock-item")
      : null;
    showDockTooltip(hoveredItem);
  });

  dock.addEventListener("pointerenter", (event) => {
    if (event.pointerType && event.pointerType !== "mouse") {
      return;
    }
    startDockAnimation(event.clientX, event.clientY);
  });

  dock.addEventListener("pointerleave", () => {
    stopDockAnimation();
    hideDockTooltip();
  });

  dock.addEventListener("focusin", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !target.classList.contains("dock-item")) {
      return;
    }

    const rect = target.getBoundingClientRect();
    startDockAnimation(rect.left + rect.width / 2, rect.top + rect.height / 2);
    showDockTooltip(target);
  });

  dock.addEventListener("focusout", () => {
    if (!dock.matches(":focus-within")) {
      stopDockAnimation();
      hideDockTooltip();
    }
  });
} else {
  resetDockWave();
  hideDockTooltip();
}

const sections = Array.from(document.querySelectorAll("main section[id], footer[id]"));

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      const targetId = entry.target.getAttribute("id");
      if (!targetId) {
        return;
      }

      const nextHref = `#${targetId}`;
      const activeLink = dockItems.find((item) => item.getAttribute("href") === nextHref);
      if (activeLink) {
        setActiveNavigationByHref(nextHref);
      }
    });
  },
  { rootMargin: "-30% 0px -50% 0px", threshold: 0.1 }
);

sections.forEach((section) => sectionObserver.observe(section));

const dockSound = document.getElementById("dock-sound");
const mobileSound = document.getElementById("mobile-sound");

const toggleSound = () => {
  soundEnabled = !soundEnabled;
  localStorage.setItem("sound", soundEnabled ? "on" : "off");
  dockSound?.classList.toggle("is-muted", !soundEnabled);
  updateMobileSettingsText();
};

dockSound?.classList.toggle("is-muted", !soundEnabled);

dockSound?.addEventListener("click", toggleSound);
mobileSound?.addEventListener("click", toggleSound);

languageToggle?.addEventListener("click", () => {
  const nextLanguage = currentLanguage === "es" ? "en" : "es";
  applyLanguage(nextLanguage);
});

mobileLanguageToggle?.addEventListener("click", () => {
  const nextLanguage = currentLanguage === "es" ? "en" : "es";
  applyLanguage(nextLanguage);
});

updateMobileSettingsText();
updateMobileCurrentLabel();
