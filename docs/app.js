const config = {
  // Paste your real Chrome Web Store URL here after the listing is live.
  chromeStoreUrl: "",
  // Paste your donation link here later if you want a live support button.
  donationUrl: "",
  // This can be a local .mp4/.webm file, a YouTube URL, or a Loom share URL.
  demoVideoUrl: "./assets/demo/breezefill-demo.mp4",
  demoPosterUrl: "./assets/demo/breezefill-demo-poster.png",
  githubRepoUrl: "https://github.com/ammarjmahmood/breezefill",
  githubZipUrl: "https://github.com/ammarjmahmood/breezefill/archive/refs/heads/main.zip"
};

function setInstallLink() {
  const primaryLink = document.querySelector("[data-install-link]");
  const storeTab = document.querySelector('[data-tab="store"]');
  const storeTabLabel = document.querySelector("[data-store-tab-label]");
  const githubTab = document.querySelector('[data-tab="github"]');
  const storePanel = document.querySelector('[data-panel="store"]');
  const githubPanel = document.querySelector('[data-panel="github"]');
  const storeSoonState = document.querySelector('[data-store-state="soon"]');
  const storeLiveState = document.querySelector('[data-store-state="live"]');

  if (!primaryLink) {
    return;
  }

  if (config.chromeStoreUrl) {
    primaryLink.href = config.chromeStoreUrl;
    primaryLink.textContent = "Add to Chrome";
    if (storeTabLabel) {
      storeTabLabel.textContent = "Install from Chrome Web Store";
    }

    if (storeSoonState && storeLiveState) {
      storeSoonState.hidden = true;
      storeLiveState.hidden = false;
    }

    if (storeTab && githubTab && storePanel && githubPanel) {
      storeTab.classList.add("is-active");
      storeTab.setAttribute("aria-selected", "true");
      githubTab.classList.remove("is-active");
      githubTab.setAttribute("aria-selected", "false");
      storePanel.hidden = false;
      storePanel.classList.add("is-active");
      githubPanel.hidden = true;
      githubPanel.classList.remove("is-active");
    }

    return;
  }

  primaryLink.href = config.githubZipUrl;
  primaryLink.textContent = "Install from GitHub";

  if (storeTabLabel) {
    storeTabLabel.textContent = "Chrome Web Store soon";
  }

  if (storeSoonState && storeLiveState) {
    storeSoonState.hidden = false;
    storeLiveState.hidden = true;
  }
}

function setDonationLink() {
  const donateLink = document.querySelector("[data-donate-link]");
  const donateNote = document.querySelector("[data-donate-note]");

  if (!donateLink || !donateNote) {
    return;
  }

  if (config.donationUrl) {
    donateLink.href = config.donationUrl;
    donateLink.removeAttribute("aria-disabled");
    donateLink.classList.remove("is-disabled");
    donateLink.target = "_blank";
    donateLink.rel = "noreferrer";
    donateLink.textContent = "Buy me a coffee";
    donateNote.textContent = "Support helps cover store fees, testing, and future polish.";
    return;
  }

  donateLink.removeAttribute("href");
  donateLink.setAttribute("aria-disabled", "true");
  donateLink.classList.add("is-disabled");
  donateLink.textContent = "Donate soon";
  donateNote.textContent = "Donation link coming soon. For now, starring the repo is the easiest way to help.";
}

function getDemoMedia(url) {
  if (!url) {
    return null;
  }

  if (/^(\.?\.?\/|\/).+\.(mp4|webm|mov)$/i.test(url)) {
    return {
      kind: "file",
      src: url
    };
  }

  try {
    const parsed = new URL(url);
    if (/\.(mp4|webm|mov)$/i.test(parsed.pathname)) {
      return {
        kind: "file",
        src: parsed.toString()
      };
    }

    if (parsed.hostname.includes("youtu.be")) {
      const videoId = parsed.pathname.split("/").filter(Boolean)[0];
      return videoId
        ? {
            kind: "embed",
            src: `https://www.youtube.com/embed/${videoId}?rel=0`
          }
        : null;
    }

    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname === "/watch") {
        const videoId = parsed.searchParams.get("v");
        return videoId
          ? {
              kind: "embed",
              src: `https://www.youtube.com/embed/${videoId}?rel=0`
            }
          : null;
      }

      if (parsed.pathname.startsWith("/embed/")) {
        return {
          kind: "embed",
          src: parsed.toString()
        };
      }
    }

    if (parsed.hostname.includes("loom.com")) {
      if (parsed.pathname.startsWith("/share/")) {
        const videoId = parsed.pathname.split("/").filter(Boolean)[1];
        return videoId
          ? {
              kind: "embed",
              src: `https://www.loom.com/embed/${videoId}`
            }
          : null;
      }

      if (parsed.pathname.startsWith("/embed/")) {
        return {
          kind: "embed",
          src: parsed.toString()
        };
      }
    }
  } catch {
    return null;
  }

  return null;
}

function setDemoVideo() {
  const stage = document.querySelector("[data-demo-stage]");
  const placeholder = document.querySelector("[data-demo-placeholder]");
  const status = document.querySelector("[data-demo-status]");
  const link = document.querySelector("[data-demo-link]");
  const media = getDemoMedia(config.demoVideoUrl);

  if (!stage || !placeholder || !status || !link) {
    return;
  }

  if (!media) {
    link.removeAttribute("href");
    link.setAttribute("aria-disabled", "true");
    link.classList.add("is-disabled");
    link.textContent = "Demo coming soon";
    status.textContent = "Coming soon";
    return;
  }

  placeholder.hidden = true;

  if (media.kind === "file") {
    const video = document.createElement("video");
    video.src = media.src;
    video.controls = true;
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "metadata";
    if (config.demoPosterUrl) {
      video.poster = config.demoPosterUrl;
    }
    stage.appendChild(video);
  } else {
    const iframe = document.createElement("iframe");
    iframe.src = media.src;
    iframe.title = "BreezeFill demo video";
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.loading = "lazy";
    stage.appendChild(iframe);
  }

  status.textContent = "Now showing";
  link.href = config.demoVideoUrl;
  link.removeAttribute("aria-disabled");
  link.classList.remove("is-disabled");
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = "Watch full demo";
}

function initTabs() {
  const buttons = Array.from(document.querySelectorAll("[data-tab]"));
  const panels = Array.from(document.querySelectorAll("[data-panel]"));

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.tab;

      buttons.forEach((item) => {
        const active = item.dataset.tab === target;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", String(active));
      });

      panels.forEach((panel) => {
        const active = panel.dataset.panel === target;
        panel.classList.toggle("is-active", active);
        panel.hidden = !active;
      });
    });
  });
}

function initReveal() {
  const sections = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    sections.forEach((section) => {
      section.classList.add("is-visible");
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
    {
      threshold: 0.15
    }
  );

  sections.forEach((section) => {
    observer.observe(section);
  });
}

setInstallLink();
setDonationLink();
setDemoVideo();
initTabs();
initReveal();
