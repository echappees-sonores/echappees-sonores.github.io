(function () {
  const fallbackDescription = [
    "Echapees sonores rassemble des chanteuses et chanteurs animés par le répertoire d'opéra, la polyphonie et les rencontres avec le public.",
    "Le chœur construit des programmes exigeants et accessibles, entre grands airs, pages chorales et moments de partage."
  ];

  const fallbackEventText =
    "La description de cet événement pourra être complétée dans le fichier desc.txt correspondant.";

  function splitParagraphs(text) {
    return text
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }

  function renderParagraphs(container, paragraphs) {
    container.replaceChildren(
      ...paragraphs.map((paragraph) => {
        const p = document.createElement("p");
        p.textContent = paragraph;
        return p;
      })
    );
  }

  async function loadText(path) {
    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error("Source de texte indisponible");
    }
    return response.text();
  }

  async function loadEvents() {
    const response = await fetch("static/events/events.json", { cache: "no-cache" });
    if (!response.ok) {
      throw new Error("Registre des événements indisponible");
    }
    return response.json();
  }

  async function hydrateDescription() {
    const container = document.querySelector("[data-text-source]");
    if (!container) {
      return;
    }

    try {
      const text = await loadText(container.dataset.textSource);
      const paragraphs = splitParagraphs(text);
      renderParagraphs(container, paragraphs.length ? paragraphs : fallbackDescription);
    } catch (error) {
      renderParagraphs(container, fallbackDescription);
    }
  }

  function createEventCard(event, description) {
    const article = document.createElement("article");
    article.className = "event-card";

    const imageWrap = document.createElement("div");
    imageWrap.className = "event-image-wrap";

    const image = document.createElement("img");
    image.src = event.image;
    image.alt = event.title ? `Image de l'événement ${event.title}` : "Image d'événement";
    image.onerror = function () {
      image.src = "static/images/presentation.jpeg";
    };
    imageWrap.append(image);

    const body = document.createElement("div");
    body.className = "event-body";

    const kicker = document.createElement("p");
    kicker.className = "event-kicker";
    kicker.textContent = event.date || "Événement";

    const title = document.createElement("h3");
    title.textContent = event.title || "Événement";

    body.append(kicker, title);
    splitParagraphs(description || fallbackEventText).forEach((paragraph) => {
      const p = document.createElement("p");
      p.textContent = paragraph;
      body.append(p);
    });

    article.append(imageWrap, body);
    return article;
  }

  async function hydrateEvents() {
    const list = document.querySelector("#events-list");
    const events = await loadEvents().catch(() => []);

    if (!list || !events.length) {
      return;
    }

    const cards = await Promise.all(
      events.map(async (event) => {
        try {
          const text = await loadText(event.description);
          return createEventCard(event, text.trim() || fallbackEventText);
        } catch (error) {
          return createEventCard(event, fallbackEventText);
        }
      })
    );

    list.replaceChildren(...cards);
  }

  hydrateDescription();
  hydrateEvents();
})();
