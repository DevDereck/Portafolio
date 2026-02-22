const root = document.documentElement;
const themeToggle = document.getElementById("dock-theme");
const languageToggle = document.getElementById("dock-lang");
const metaDescription = document.getElementById("meta-description");
const savedTheme = localStorage.getItem("theme");
let currentLanguage = localStorage.getItem("lang") || "es";

const translations = {
  es: {
    pageTitle: "Tu Nombre — Portafolio",
    metaDescription: "Portafolio de diseñador UI/UX y desarrollador frontend.",
    "hero.eyebrow": "Diseño UI/UX + Frontend",
    "hero.title": "Creo experiencias digitales claras, rápidas y con enfoque en negocio.",
    "hero.lead": "Soy diseñador y desarrollador frontend. Me especializo en interfaces modernas, sistemas de diseño y productos web escalables.",
    "hero.ctaProjects": "Ver proyectos",
    "hero.ctaContact": "Escríbeme",
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
    "dock.profile": "Perfil",
    "dock.articles": "Artículos",
    "dock.code": "Código",
    "dock.layers": "Capas",
    "dock.theme": "Cambiar tema",
    "dock.sound": "Sonido",
    "dock.language": "Idioma",
  },
  en: {
    pageTitle: "Your Name — Portfolio",
    metaDescription: "Portfolio of a UI/UX designer and frontend developer.",
    "hero.eyebrow": "UI/UX Design + Frontend",
    "hero.title": "I build clear, fast digital experiences focused on business impact.",
    "hero.lead": "I am a designer and frontend developer focused on modern interfaces, design systems, and scalable web products.",
    "hero.ctaProjects": "View projects",
    "hero.ctaContact": "Contact me",
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
    "dock.profile": "Profile",
    "dock.articles": "Articles",
    "dock.code": "Code",
    "dock.layers": "Layers",
    "dock.theme": "Toggle theme",
    "dock.sound": "Sound",
    "dock.language": "Language",
  },
};

const translateTextNodes = (lang) => {
  const dictionary = translations[lang] ?? translations.es;
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
  localStorage.setItem("lang", currentLanguage);
};

applyLanguage(currentLanguage);

if (savedTheme === "light") {
  root.setAttribute("data-theme", "light");
}

themeToggle?.addEventListener("click", () => {
  const current = root.getAttribute("data-theme");
  if (current === "light") {
    root.removeAttribute("data-theme");
    localStorage.setItem("theme", "dark");
  } else {
    root.setAttribute("data-theme", "light");
    localStorage.setItem("theme", "light");
  }
});

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
const allDockItems = Array.from(document.querySelectorAll(".dock .dock-item"));
const dock = document.querySelector(".dock");
const dockTooltip = document.getElementById("dock-tooltip");
let dockGeometry = [];
let hotItemIndex = -1;

dockItems.forEach((item) => {
  item.addEventListener("click", () => {
    dockItems.forEach((otherItem) => otherItem.classList.remove("active"));
    item.classList.add("active");
  });
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

      const activeLink = dockItems.find((item) => item.getAttribute("href") === `#${targetId}`);
      if (activeLink) {
        dockItems.forEach((otherItem) => otherItem.classList.remove("active"));
        activeLink.classList.add("active");
      }
    });
  },
  { rootMargin: "-30% 0px -50% 0px", threshold: 0.1 }
);

sections.forEach((section) => sectionObserver.observe(section));

const dockSound = document.getElementById("dock-sound");

dockSound?.addEventListener("click", () => {
  dockSound.classList.toggle("is-muted");
});

languageToggle?.addEventListener("click", () => {
  const nextLanguage = currentLanguage === "es" ? "en" : "es";
  applyLanguage(nextLanguage);
});
