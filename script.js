const root = document.documentElement;
const themeToggle = document.getElementById("dock-theme");
const savedTheme = localStorage.getItem("theme");

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
