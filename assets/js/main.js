// ==========================================
// VARIABLES GLOBALES
// ==========================================
let heroImages = [];
let currentHeroIndex = 0;
let activeBgIndex = 1;
const SWITCH_INTERVAL = 5000;

let allGalleryItems = [];
let isGalleryExpanded = false;

let allProjectsItems = [];
let isProjectsExpanded = false;

// ==========================================
// CARROUSEL HERO BACKGROUND
// ==========================================
async function initHeroCarousel() {
  const bg1 = document.querySelector(".hero-bg-1");
  const bg2 = document.querySelector(".hero-bg-2");

  if (!bg1 || !bg2) return;

  try {
    const response = await fetch("assets/data/hero-images.json");
    heroImages = await response.json();

    if (!heroImages || heroImages.length === 0) return;

    bg1.style.backgroundImage = `url("${heroImages[0]}")`;

    if (heroImages.length === 1) return;

    setInterval(() => {
      currentHeroIndex = (currentHeroIndex + 1) % heroImages.length;
      const nextImage = heroImages[currentHeroIndex];

      if (activeBgIndex === 1) {
        bg2.style.backgroundImage = `url("${nextImage}")`;
        bg2.style.opacity = "1";
        bg1.style.opacity = "0";
        activeBgIndex = 2;
      } else {
        bg1.style.backgroundImage = `url("${nextImage}")`;
        bg1.style.opacity = "1";
        bg2.style.opacity = "0";
        activeBgIndex = 1;
      }
    }, SWITCH_INTERVAL);
  } catch (error) {
    console.error("Erreur lors du chargement des images du Hero :", error);
  }
}

// ==========================================
// GALERIE VISUELLE
// ==========================================
async function loadGallery() {
  const galleryContainer = document.getElementById("gallery-container");
  const toggleBtn = document.getElementById("btn-toggle-gallery");

  if (!galleryContainer) return;

  try {
    const response = await fetch("assets/data/gallery.json");
    allGalleryItems = await response.json();

    renderGallery();

    if (toggleBtn) {
      if (allGalleryItems.length <= 6) {
        toggleBtn.style.display = "none";
      } else {
        toggleBtn.style.display = "inline-block";
      }

      toggleBtn.onclick = () => {
        isGalleryExpanded = !isGalleryExpanded;
        renderGallery();

        toggleBtn.textContent = isGalleryExpanded ? "Voir moins" : "Voir plus";

        if (!isGalleryExpanded) {
          const galerieSection = document.getElementById("galerie");
          if (galerieSection) {
            galerieSection.scrollIntoView({ behavior: "smooth" });
          }
        }
      };
    }
  } catch (error) {
    console.error("Erreur lors du chargement de la galerie :", error);
    galleryContainer.innerHTML =
      "<p>Impossible de charger la galerie visuelle.</p>";
  }
}

function renderGallery() {
  const galleryContainer = document.getElementById("gallery-container");
  if (!galleryContainer) return;

  const itemsToShow = isGalleryExpanded
    ? allGalleryItems
    : allGalleryItems.slice(0, 6);

  galleryContainer.innerHTML = itemsToShow
    .map(
      (item) => `
        <div class="gallery-item" data-id="${item.id}">
            <div class="gallery-img-wrapper">
                <img src="${item.image}" alt="${item.title}">
            </div>
            <div class="gallery-info">
                <h3>${item.title}</h3>
            </div>
        </div>
    `,
    )
    .join("");
}

// ==========================================
// SECTION PROJETS
// ==========================================
async function loadProjects() {
  const container = document.getElementById("projects-container");
  const toggleBtn = document.getElementById("btn-toggle-projects");

  if (!container) return;

  try {
    const response = await fetch("assets/data/projects.json");
    allProjectsItems = await response.json();

    renderProjects();

    if (toggleBtn) {
      // Masquer le bouton s'il y a 6 projets ou moins
      if (allProjectsItems.length <= 6) {
        toggleBtn.style.display = "none";
      } else {
        toggleBtn.style.display = "inline-block";
      }

      // Gestion du Clic
      toggleBtn.onclick = () => {
        isProjectsExpanded = !isProjectsExpanded;
        renderProjects();

        toggleBtn.textContent = isProjectsExpanded ? "Voir moins" : "Voir plus";

        if (!isProjectsExpanded) {
          const projectsSection = document.getElementById("projects");
          if (projectsSection) {
            projectsSection.scrollIntoView({ behavior: "smooth" });
          }
        }
      };
    }
  } catch (error) {
    console.error("Erreur lors du chargement des projets :", error);
    container.innerHTML = "<p>Impossible de charger les projets.</p>";
  }
}

function renderProjects() {
  const container = document.getElementById("projects-container");
  if (!container) return;

  const itemsToShow = isProjectsExpanded
    ? allProjectsItems
    : allProjectsItems.slice(0, 6);

  container.innerHTML = itemsToShow
    .map(
      (project) => `
        <article class="project-card">
          <img src="${project.coverImage || ""}"alt="${project.title || "Projet"}" class="project-card-img">

          <h3>${project.title}</h3>
          <p class="project-desc">${project.description || ""}</p>

          <ul class="project-tags">
            ${(project.tags || []).map((tag) => `<li>${tag}</li>`).join("")}
          </ul>

          <a
            href="project-detail.html?id=${encodeURIComponent(project.id)}"
            class="btn btn-secondary"
          >
            Voir le projet
          </a>
        </article>
      `,
    )
    .join("");
}

// ==========================================
// INITIALISATION UNIQUE (DOM)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  initHeroCarousel();
  loadGallery();
  loadProjects();
});

// ==========================================
// LIGHTBOX
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.getElementById("gallery-container");
  const lightbox = document.getElementById("index-lightbox");
  const lightboxImage = document.getElementById("index-lightbox-img");
  const lightboxDescription = document.getElementById(
    "index-lightbox-description",
  );
  const closeButton = document.getElementById("index-lightbox-close");

  if (!gallery || !lightbox || !lightboxImage) return;

  gallery.addEventListener("click", (event) => {
    const galleryItem = event.target.closest(".gallery-item");
    if (!galleryItem) return;

    event.preventDefault();

    const image = galleryItem.querySelector("img");
    if (!image) return;

    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt || "Image de galerie";

    if (lightboxDescription) {
      lightboxDescription.textContent =
        galleryItem.dataset.description || image.alt || "";
    }

    lightbox.style.display = "flex";
    lightbox.setAttribute("aria-hidden", "false");
  });

  function closeIndexLightbox() {
    lightbox.style.display = "none";
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImage.removeAttribute("src");
  }

  closeButton?.addEventListener("click", closeIndexLightbox);

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeIndexLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeIndexLightbox();
    }
  });
});
