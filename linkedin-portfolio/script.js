const COMPONENT_MAP = {
  "hero-container": "components/hero.html",
  "experience-container": "components/experience.html",
  "skills-container": "components/skills.html",
};

async function loadComponent(containerId, path) {
  const container = document.getElementById(containerId);
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }

  container.innerHTML = await response.text();
}

async function loadAllComponents() {
  await Promise.all(
    Object.entries(COMPONENT_MAP).map(([id, path]) => loadComponent(id, path))
  );
}

async function loadPortfolioData() {
  const response = await fetch("data/portfolio.json");

  if (!response.ok) {
    throw new Error("Failed to load portfolio data");
  }

  return response.json();
}

function populateHero(profile) {
  document.title = `${profile.name} | Portfolio`;
  document.getElementById("footer-name").textContent = profile.name;
  document.getElementById("year").textContent = new Date().getFullYear();

  const photo = document.getElementById("profile-photo");
  photo.src = profile.photo;
  photo.alt = `${profile.name} profile photo`;

  document.getElementById("hero-heading").textContent = profile.name;
  document.querySelector(".hero__headline").textContent = profile.headline;
  document.querySelector(".hero__location").textContent = profile.location;
  document.querySelector(".hero__summary").textContent = profile.summary;

  const linkedinLink = document.getElementById("linkedin-link");
  linkedinLink.href = profile.linkedinUrl;

  const emailLink = document.getElementById("email-link");
  emailLink.href = `mailto:${profile.email}`;
}

function createExperienceCard(item) {
  const card = document.createElement("article");
  card.className = "experience-card";
  card.setAttribute("role", "listitem");

  const highlights = item.highlights
    .map((point) => `<li>${point}</li>`)
    .join("");

  card.innerHTML = `
    <div class="experience-card__header">
      <div>
        <h3 class="experience-card__title">${item.title}</h3>
        <p class="experience-card__company">${item.company}</p>
      </div>
      <p class="experience-card__meta">${item.period} · ${item.location}</p>
    </div>
    <p class="experience-card__description">${item.description}</p>
    <ul class="experience-card__highlights">${highlights}</ul>
  `;

  return card;
}

function populateExperience(experience) {
  const list = document.getElementById("experience-list");
  experience.forEach((item) => list.appendChild(createExperienceCard(item)));
}

function populateSkillTags(containerId, skills) {
  const list = document.getElementById(containerId);
  skills.forEach((skill) => {
    const li = document.createElement("li");
    li.className = "skills__tag";
    li.textContent = skill;
    list.appendChild(li);
  });
}

function populateSkills(skills) {
  populateSkillTags("technical-skills", skills.technical);
  populateSkillTags("soft-skills", skills.soft);
}

function setupMobileNav() {
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav__toggle");

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("nav--open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.querySelectorAll(".nav__links a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("nav--open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function setupSmoothHighlight() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav__links a");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach((link) => {
          link.style.color =
            link.getAttribute("href") === `#${id}`
              ? "var(--color-primary)"
              : "";
        });
      });
    },
    { rootMargin: "-40% 0px -50% 0px" }
  );

  sections.forEach((section) => observer.observe(section));
}

async function init() {
  try {
    await loadAllComponents();
    const data = await loadPortfolioData();

    populateHero(data.profile);
    populateExperience(data.experience);
    populateSkills(data.skills);

    setupMobileNav();
    setupSmoothHighlight();
  } catch (error) {
    console.error(error);
    document.getElementById("main-content").innerHTML = `
      <p role="alert">Unable to load portfolio. Serve this folder with a local server and check data/portfolio.json.</p>
    `;
  }
}

init();
