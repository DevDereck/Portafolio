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

dockItems.forEach((item) => {
  item.addEventListener("click", () => {
    dockItems.forEach((otherItem) => otherItem.classList.remove("active"));
    item.classList.add("active");
  });
});

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
