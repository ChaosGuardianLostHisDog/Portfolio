// Variables globales pour la Lightbox (accessibles partout)
let currentGalleryMedia = [];
let currentMediaIndex = 0;

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");

  if (!projectId) {
    window.location.href = "index.html#projects";
    return;
  }

  try {
    const response = await fetch("assets/data/projects.json");
    const projects = await response.json();
    const project = projects.find((p) => p.id === projectId);

    if (!project) {
      window.location.href = "index.html#projects";
      return;
    }

    // 1. Mise à jour des textes simples
    document.title = `${project.title} - Détails`;
    document.getElementById("project-title").textContent = project.title;
    document.getElementById("project-date").textContent = project.date || "N/A";
    document.getElementById("project-role").textContent = project.role || "N/A";
    document.getElementById("project-category").textContent =
      project.category || "N/A";
    renderFullDescription(project.fullDescription || project.description);

    // 2. Éléments média
    const coverImgContainer = document.querySelector(".project-hero-img");
    const viewerContainer = document.getElementById("3d-viewer-container");
    const modelViewer = document.getElementById("3d-viewer");
    const videoContainer = document.getElementById("video-container");
    const projectVideo = document.getElementById("project-video");

    // Réinitialisation des affichages
    if (coverImgContainer) coverImgContainer.style.display = "none";
    if (viewerContainer) viewerContainer.style.display = "none";
    if (videoContainer) videoContainer.style.display = "none";

    // Affichage conditionnel selon le type
    if (project.type === "model3d" && project.model3dFile) {
      if (viewerContainer) viewerContainer.style.display = "block";
      if (modelViewer) modelViewer.src = project.model3dFile;
    } else if (project.type === "video" && project.videoFile) {
      if (videoContainer) videoContainer.style.display = "block";
      if (projectVideo) {
        projectVideo.src = project.videoFile;
        if (project.coverImage) {
          projectVideo.poster = project.coverImage;
        }
      }
    } else {
      if (coverImgContainer) coverImgContainer.style.display = "block";
      const coverEl = document.getElementById("project-cover");
      if (coverEl) {
        coverEl.src = project.coverImage;
        coverEl.alt = project.title;
      }
    }

    // Gestion du bouton plein écran pour la vue 3D
    const fullscreenBtn = document.getElementById("btn-fullscreen");
    if (fullscreenBtn && viewerContainer) {
      fullscreenBtn.addEventListener("click", () => {
        if (!document.fullscreenElement) {
          if (viewerContainer.requestFullscreen) {
            viewerContainer.requestFullscreen();
          } else if (viewerContainer.webkitRequestFullscreen) {
            viewerContainer.webkitRequestFullscreen();
          }
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
      });
    }

    // 3. Tags
    const tagsContainer = document.getElementById("project-tags");
    if (tagsContainer && project.tags && project.tags.length > 0) {
      tagsContainer.innerHTML = project.tags
        .map((tag) => `<li>${tag}</li>`)
        .join("");
    }

    // 4. Gestion dynamique des boutons
    const btnDemo = document.getElementById("btn-demo");
    if (btnDemo) {
      if (project.demoLink) {
        btnDemo.href = project.demoLink;
        btnDemo.style.display = "inline-flex";
      } else {
        btnDemo.style.display = "none";
      }
    }

    const btnRepo = document.getElementById("btn-repo");
    if (btnRepo) {
      if (project.repoLink) {
        btnRepo.href = project.repoLink;
        btnRepo.style.display = "inline-flex";
      } else {
        btnRepo.style.display = "none";
      }
    }

    const btnOriginal = document.getElementById("btn-original");
    if (btnOriginal) {
      if (project.OriginalLink) {
        btnOriginal.href = project.OriginalLink;
        btnOriginal.style.display = "inline-flex";
      } else {
        btnOriginal.style.display = "none";
      }
    }

    // 5. Galerie de médias. Les vidéos sont toujours affichées en premier.
    if (project.gallery && project.gallery.length > 0) {
      const gallerySection = document.getElementById("gallery-section");
      const galleryGrid = document.getElementById("project-gallery");

      currentGalleryMedia = project.gallery
        .map(normalizeGalleryMedia)
        .filter((media) => media && media.src)
        .sort((firstMedia, secondMedia) => {
          return (
            Number(secondMedia.type === "video") -
            Number(firstMedia.type === "video")
          );
        });

      if (galleryGrid) {
        galleryGrid.innerHTML = currentGalleryMedia
          .map((media, index) => {
            if (media.type === "video") {
              const poster = media.poster ? ` poster="${media.poster}"` : "";
              return `
                <div class="project-gallery-item project-gallery-video" onclick="openLightbox(${index})">
                  <video src="${media.src}"${poster} preload="metadata" muted></video>
                </div>
              `;
            }

            return `
              <div class="project-gallery-item" onclick="openLightbox(${index})">
                <img src="${media.src}" alt="${project.title}">
              </div>
            `;
          })
          .join("");
      }

      if (gallerySection) gallerySection.style.display = "block";
    }

    // Initialisation des écouteurs de la Lightbox
    initLightboxListeners();
  } catch (error) {
    console.error("Erreur lors du chargement des détails :", error);
  }
});

// Événement global plein écran 3D
document.addEventListener("fullscreenchange", () => {
  const modelViewer = document.getElementById("3d-viewer");
  if (modelViewer && typeof modelViewer.resize === "function") {
    modelViewer.resize();
  }
});

// ==========================================
// FONCTIONS LIGHTBOX
// ==========================================
function normalizeGalleryMedia(media) {
  if (typeof media === "string") {
    return {
      type: /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(media) ? "video" : "image",
      src: media,
    };
  }

  if (!media || typeof media !== "object") return null;

  const src = media.src || media.url || media.path;
  return {
    type:
      media.type === "video" || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(src || "")
        ? "video"
        : "image",
    src,
    poster: media.poster,
  };
}

function openLightbox(index) {
  currentMediaIndex = index;
  updateLightboxMedia();
  const lightbox = document.getElementById("lightbox-modal");
  if (lightbox) {
    lightbox.style.display = "flex";
  }
}

function updateLightboxMedia() {
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxVideo = document.getElementById("lightbox-video");
  const media = currentGalleryMedia[currentMediaIndex];

  if (!media) return;

  if (media.type === "video") {
    if (lightboxImg) {
      lightboxImg.style.display = "none";
      lightboxImg.removeAttribute("src");
    }
    if (lightboxVideo) {
      lightboxVideo.style.display = "block";
      lightboxVideo.src = media.src;
      lightboxVideo.poster = media.poster || "";
      lightboxVideo.load();
    }
    return;
  }

  if (lightboxVideo) {
    lightboxVideo.pause();
    lightboxVideo.style.display = "none";
    lightboxVideo.removeAttribute("src");
  }
  if (lightboxImg) {
    lightboxImg.style.display = "block";
    lightboxImg.src = media.src;
  }
}

function closeLightbox() {
  const lightbox = document.getElementById("lightbox-modal");
  if (lightbox) lightbox.style.display = "none";
  const lightboxVideo = document.getElementById("lightbox-video");
  if (lightboxVideo) {
    lightboxVideo.pause();
    lightboxVideo.removeAttribute("src");
  }
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen();
  }
}

function nextLightboxImage() {
  if (currentGalleryMedia.length === 0) return;
  currentMediaIndex = (currentMediaIndex + 1) % currentGalleryMedia.length;
  updateLightboxMedia();
}

function prevLightboxImage() {
  if (currentGalleryMedia.length === 0) return;
  currentMediaIndex =
    (currentMediaIndex - 1 + currentGalleryMedia.length) %
    currentGalleryMedia.length;
  updateLightboxMedia();
}

function initLightboxListeners() {
  const closeBtn = document.querySelector(".lightbox-close");
  const nextBtn = document.getElementById("lightbox-next");
  const prevBtn = document.getElementById("lightbox-prev");
  const lightbox = document.getElementById("lightbox-modal");

  if (closeBtn) closeBtn.addEventListener("click", closeLightbox);

  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      nextLightboxImage();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      prevLightboxImage();
    });
  }

  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (
        e.target === lightbox ||
        e.target.classList.contains("lightbox-content-wrapper")
      ) {
        closeLightbox();
      }
    });
  }
}

// Support du clavier
document.addEventListener("keydown", (e) => {
  const lightbox = document.getElementById("lightbox-modal");
  if (lightbox && lightbox.style.display === "flex") {
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") nextLightboxImage();
    if (e.key === "ArrowLeft") prevLightboxImage();
  }
});

function renderGallery(project) {
  const gallerySection = document.getElementById("gallery-section");
  const gallery = document.getElementById("project-gallery");

  if (!project.gallery || project.gallery.length === 0) {
    gallerySection.style.display = "none";
    return;
  }

  // Compatibilité avec les anciennes images définies comme simples chaînes
  const galleryItems = project.gallery.map((item) => {
    if (typeof item === "string") {
      return {
        type: "image",
        src: item,
        alt: "Image du projet",
      };
    }

    return item;
  });

  // Les vidéos sont toujours placées avant les images
  galleryItems.sort((a, b) => {
    if (a.type === "video" && b.type !== "video") return -1;
    if (a.type !== "video" && b.type === "video") return 1;
    return 0;
  });

  gallery.innerHTML = "";

  galleryItems.forEach((item, index) => {
    const element = document.createElement("div");
    element.className = "gallery-item";

    if (item.type === "video") {
      element.innerHTML = `
                <video
                    class="gallery-thumbnail-video"
                    src="${item.src}"
                    ${item.poster ? `poster="${item.poster}"` : ""}
                    muted
                    preload="metadata"
                    playsinline>
                </video>
                <span class="gallery-video-label">▶ Vidéo</span>
            `;

      element.addEventListener("click", () => {
        openGalleryVideo(item);
      });
    } else {
      element.innerHTML = `
                <img src="${item.src}" alt="${item.alt || "Image du projet"}">
            `;

      element.addEventListener("click", () => {
        openGalleryImage(item);
      });
    }

    gallery.appendChild(element);
  });

  gallerySection.style.display = "block";
}

function openGalleryVideo(item) {
  const modal = document.getElementById("lightbox-modal");
  const image = document.getElementById("lightbox-img");
  const video = document.getElementById("lightbox-video");

  // Masquer l'image
  image.style.display = "none";

  // Configurer la vidéo
  video.style.display = "block";
  video.src = item.src;
  video.poster = item.poster || "";
  video.controls = true;
  video.autoplay = false;
  video.muted = false;
  video.preload = "metadata";

  // Charger la vidéo sans la lancer
  video.load();

  // Afficher la lightbox
  modal.classList.add("active");
}

function openGalleryImage(item) {
  const modal = document.getElementById("lightbox-modal");
  const image = document.getElementById("lightbox-img");
  const video = document.getElementById("lightbox-video");

  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }

  video.pause();
  video.removeAttribute("src");
  video.load();
  video.style.display = "none";

  image.src = item.src;
  image.alt = item.alt || "Image du projet";
  image.style.display = "block";

  modal.classList.add("active");
}

function closeGallery() {
  const modal = document.getElementById("lightbox-modal");
  const video = document.getElementById("lightbox-video");

  video.pause();
  video.removeAttribute("src");
  video.load();

  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }

  modal.classList.remove("active");
}

document
  .querySelector(".lightbox-close")
  .addEventListener("click", closeGallery);

document.getElementById("lightbox-modal").addEventListener("click", (event) => {
  if (event.target.id === "lightbox-modal") {
    closeGallery();
  }
});

function renderFullDescription(description) {
  const container = document.getElementById("project-description");
  if (!container) return;

  container.innerHTML = "";

  if (typeof description === "string") {
    const paragraph = document.createElement("p");
    paragraph.textContent = description;
    container.appendChild(paragraph);
    return;
  }

  if (!Array.isArray(description)) return;

  description.forEach((section) => {
    if (section.subtitle) {
      const subtitle = document.createElement("h3");
      subtitle.textContent = section.subtitle;
      container.appendChild(subtitle);
    }

    (section.paragraphs || []).forEach((text) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      container.appendChild(paragraph);
    });
  });
}
