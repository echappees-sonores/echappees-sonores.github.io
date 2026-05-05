(function () {
  const contentIndexPath = "static/content/content.json";
  const languageStorageKey = "echappees-sonores-language";
  const supportedLanguages = ["fr", "en"];
  const siteUrl = "https://echappees-sonores.github.io/";
  const previewImageUrl = `${siteUrl}static/images/main.jpeg`;

  const fallbackContent = {
    fr: {
      about: [
        "# Échappées Sonores\n\nÉchappées Sonores rassemble des chanteuses et chanteurs animés par le répertoire d'opéra, la polyphonie et les rencontres avec le public."
      ],
      programming: [
        "# Programmation en cours de préparation\n\nLes événements apparaîtront ici automatiquement lorsque leurs descriptions seront disponibles."
      ],
      contact: [
        "# Nous contacter\n\nPour une demande de concert, une collaboration artistique ou une question pratique, contactez l'ensemble par courriel."
      ]
    },
    en: {
      about: [
        "# Echappees Sonores\n\nEchappees Sonores brings together singers driven by opera repertoire, polyphony and encounters with the audience."
      ],
      programming: [
        "# Programming in preparation\n\nEvents will appear here automatically when their descriptions are available."
      ],
      contact: [
        "# Contact us\n\nFor concert requests, artistic collaborations or practical questions, contact the ensemble by email."
      ]
    }
  };

  const uiText = {
    fr: {
      documentTitle: "Échappées Sonores | Chœur lyrique",
      description: "Échappées Sonores, chœur lyrique : concerts, rencontres musicales et programmation.",
      canonicalUrl: `${siteUrl}?lang=fr`,
      ogLocale: "fr_FR",
      ogAlternateLocale: "en_GB",
      headerLabel: "Navigation principale",
      brandLabel: "Échappées Sonores, accueil",
      navLabel: "Sections du site",
      languageLabel: "Choix de la langue",
      heroImageAlt: "Le chœur Échappées Sonores en concert",
      "nav.about": "À propos",
      "nav.programming": "Programmation",
      "nav.contact": "Nous contacter",
      "hero.eyebrow": "Chœur lyrique",
      "hero.copy": "Des voix réunies autour du répertoire lyrique, de la scène et du plaisir vibrant de chanter ensemble.",
      "hero.link": "Voir la programmation",
      "about.eyebrow": "À propos",
      "about.title": "Un chœur lyrique ouvert, sensible et vivant.",
      "programming.eyebrow": "Programmation",
      "programming.title": "Événements et participations",
      "programming.loadingKicker": "Chargement",
      "programming.loadingTitle": "Programmation en cours de préparation",
      "programming.loadingCopy": "Les événements apparaîtront ici automatiquement lorsque leurs descriptions seront disponibles.",
      "programming.eventImageAlt": "Visuel du concert Élévation",
      "contact.eyebrow": "Nous contacter",
      "contact.title": "Inviter le chœur ou rejoindre l'aventure.",
      "contact.loadingCopy": "Pour une demande de concert, une collaboration artistique ou une question pratique, contactez l'ensemble par courriel.",
      "footer.analytics": "Statistiques de visite via Cloudflare Web Analytics. Aucune donnée personnelle n'est collectée.",
      programKicker: "Programmation"
    },
    en: {
      documentTitle: "Échappées Sonores | Lyrical choir",
      description: "Échappées Sonores, a lyrical choir: concerts, musical encounters and programming.",
      canonicalUrl: `${siteUrl}?lang=en`,
      ogLocale: "en_GB",
      ogAlternateLocale: "fr_FR",
      headerLabel: "Main navigation",
      brandLabel: "Échappées Sonores, home",
      navLabel: "Site sections",
      languageLabel: "Language selection",
      heroImageAlt: "The Échappées Sonores choir in concert",
      "nav.about": "About",
      "nav.programming": "Programming",
      "nav.contact": "Contact us",
      "hero.eyebrow": "Lyrical choir",
      "hero.copy": "Voices brought together by lyrical repertoire, the stage and the vibrant pleasure of singing as one.",
      "hero.link": "View programming",
      "about.eyebrow": "About",
      "about.title": "An open, sensitive and vibrant lyrical choir.",
      "programming.eyebrow": "Programming",
      "programming.title": "Events and appearances",
      "programming.loadingKicker": "Loading",
      "programming.loadingTitle": "Programming in preparation",
      "programming.loadingCopy": "Events will appear here automatically when their descriptions are available.",
      "programming.eventImageAlt": "Visual for the Elevation concert",
      "contact.eyebrow": "Contact us",
      "contact.title": "Invite the choir or join the adventure.",
      "contact.loadingCopy": "For concert requests, artistic collaborations or practical questions, contact the ensemble by email.",
      "footer.analytics": "Visit statistics are measured with Cloudflare Web Analytics. No personal data is collected.",
      programKicker: "Programming"
    }
  };

  let currentLanguage = getInitialLanguage();
  let contentIndexPromise;

  function appendTextWithLineBreaks(parent, text) {
    text.split(/ {2,}\n|\n/).forEach((part, index) => {
      if (index > 0) {
        parent.append(document.createElement("br"));
      }
      parent.append(document.createTextNode(part));
    });
  }

  function appendInlineMarkdown(parent, markdown) {
    const tokenPattern = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*)/g;
    let cursor = 0;
    let match;

    while ((match = tokenPattern.exec(markdown)) !== null) {
      appendTextWithLineBreaks(parent, markdown.slice(cursor, match.index));

      if (match[2] && match[3]) {
        const link = document.createElement("a");
        link.href = match[3];
        link.textContent = match[2];
        parent.append(link);
      } else if (match[4]) {
        const strong = document.createElement("strong");
        strong.textContent = match[4];
        parent.append(strong);
      }

      cursor = match.index + match[0].length;
    }

    appendTextWithLineBreaks(parent, markdown.slice(cursor));
  }

  function readBlocks(markdown) {
    const lines = markdown.replace(/\r\n?/g, "\n").trim().split("\n");
    const blocks = [];
    let index = 0;

    while (index < lines.length) {
      const line = lines[index].trim();

      if (!line) {
        index += 1;
        continue;
      }

      const heading = /^(#{1,6})\s+(.+)$/.exec(line);
      if (heading) {
        blocks.push({ type: "heading", depth: heading[1].length, text: heading[2].trim() });
        index += 1;
        continue;
      }

      if (/^-\s+/.test(line)) {
        const items = [];
        while (index < lines.length && /^-\s+/.test(lines[index].trim())) {
          items.push(lines[index].trim().replace(/^-\s+/, ""));
          index += 1;
        }
        blocks.push({ type: "list", items });
        continue;
      }

      const paragraph = [];
      while (
        index < lines.length &&
        lines[index].trim() &&
        !/^(#{1,6})\s+/.test(lines[index].trim()) &&
        !/^-\s+/.test(lines[index].trim())
      ) {
        paragraph.push(lines[index].trim());
        index += 1;
      }
      blocks.push({ type: "paragraph", text: paragraph.join("\n") });
    }

    return blocks;
  }

  function renderMarkdown(markdown, options) {
    const fragment = document.createDocumentFragment();
    const headingOffset = options && options.headingOffset ? options.headingOffset : 0;

    readBlocks(markdown).forEach((block) => {
      if (block.type === "heading") {
        const level = Math.min(6, block.depth + headingOffset);
        const heading = document.createElement(`h${level}`);
        appendInlineMarkdown(heading, block.text);
        fragment.append(heading);
        return;
      }

      if (block.type === "list") {
        const list = document.createElement("ul");
        block.items.forEach((item) => {
          const listItem = document.createElement("li");
          appendInlineMarkdown(listItem, item);
          list.append(listItem);
        });
        fragment.append(list);
        return;
      }

      const paragraph = document.createElement("p");
      appendInlineMarkdown(paragraph, block.text);
      fragment.append(paragraph);
    });

    return fragment;
  }

  function splitDocument(markdown) {
    const blocks = readBlocks(markdown);
    const firstHeadingIndex = blocks.findIndex((block) => block.type === "heading");

    if (firstHeadingIndex === -1) {
      return { title: "Article", body: markdown };
    }

    const title = blocks[firstHeadingIndex].text;
    const bodyStart = markdown
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .findIndex((line) => line.trim() === `${"#".repeat(blocks[firstHeadingIndex].depth)} ${title}`);
    const body = markdown
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .slice(bodyStart + 1)
      .join("\n")
      .trim();

    return { title, body };
  }

  async function loadText(path) {
    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error("Source de texte indisponible");
    }
    return response.text();
  }

  async function loadContentIndex() {
    if (contentIndexPromise) {
      return contentIndexPromise;
    }

    const response = await fetch(contentIndexPath, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error("Registre de contenu indisponible");
    }
    contentIndexPromise = response.json();
    return contentIndexPromise;
  }

  function getSectionPaths(index, language, section) {
    if (index[language] && index[language][section]) {
      return index[language][section];
    }

    return index[section] || [];
  }

  async function loadMarkdownGroup(index, language, section) {
    const paths = getSectionPaths(index, language, section);
    const loaded = await Promise.all(
      paths.map((path) => loadText(path).catch(() => ""))
    );
    return loaded.map((markdown) => markdown.trim()).filter(Boolean);
  }

  function createAboutArticle(markdown) {
    const article = document.createElement("article");
    article.className = "content-part";
    article.append(renderMarkdown(markdown, { headingOffset: 2 }));
    return article;
  }

  function createProgramCard(markdown) {
    const documentParts = splitDocument(markdown);
    const normalizedTitle = documentParts.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const isElevationEvent = normalizedTitle.includes("elevation");
    const article = document.createElement("article");
    article.className = "event-card";

    const imageWrap = document.createElement("div");
    imageWrap.className = "event-image-wrap";

    if (isElevationEvent) {
      const eventImage = document.createElement("img");
      eventImage.className = "event-image";
      eventImage.src = "static/images/elevation.jpeg";
      eventImage.alt = uiText[currentLanguage]["programming.eventImageAlt"];
      imageWrap.append(eventImage);
    } else {
      const image = document.createElement("img");
      image.className = "event-image";
      image.src = "static/images/presentation.jpeg";
      image.alt = "";
      imageWrap.append(image);
    }

    const body = document.createElement("div");
    body.className = "event-body";

    const kicker = document.createElement("p");
    kicker.className = "event-kicker";
    kicker.textContent = uiText[currentLanguage].programKicker;

    const title = document.createElement("h3");
    appendInlineMarkdown(title, documentParts.title);

    body.append(kicker, title);
    body.append(renderMarkdown(documentParts.body, { headingOffset: 3 }));

    article.append(imageWrap, body);
    return article;
  }

  function hydrateSection(section, markdownFiles) {
    const container = document.querySelector(`[data-content-section="${section}"]`);

    if (!container) {
      return;
    }

    if (section === "about") {
      container.replaceChildren(...markdownFiles.map(createAboutArticle));
      return;
    }

    if (section === "programming") {
      container.replaceChildren(...markdownFiles.map(createProgramCard));
      return;
    }

    if (section === "contact") {
      const markdown = markdownFiles.join("\n\n");
      const documentParts = splitDocument(markdown);
      container.replaceChildren(renderMarkdown(documentParts.body, { headingOffset: 2 }));
    }
  }

  async function hydrateContent() {
    const index = await loadContentIndex().catch(() => ({}));
    const localizedFallback = fallbackContent[currentLanguage] || fallbackContent.fr;

    await Promise.all(
      Object.keys(localizedFallback).map(async (section) => {
        const markdownFiles = await loadMarkdownGroup(index, currentLanguage, section);
        hydrateSection(section, markdownFiles.length ? markdownFiles : localizedFallback[section]);
      })
    );
  }

  function getInitialLanguage() {
    const requestedLanguage = new URLSearchParams(window.location.search).get("lang");

    if (supportedLanguages.includes(requestedLanguage)) {
      return requestedLanguage;
    }

    let storedLanguage = "";

    try {
      storedLanguage = window.localStorage.getItem(languageStorageKey);
    } catch (error) {
      storedLanguage = "";
    }

    if (supportedLanguages.includes(storedLanguage)) {
      return storedLanguage;
    }

    return "fr";
  }

  function applyInterfaceText(language) {
    const dictionary = uiText[language];
    document.documentElement.lang = language;
    document.title = dictionary.documentTitle;

    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = dictionary.description;
    }

    setMetaContent('meta[property="og:title"]', dictionary.documentTitle);
    setMetaContent('meta[property="og:description"]', dictionary.description);
    setMetaContent('meta[property="og:url"]', dictionary.canonicalUrl);
    setMetaContent('meta[property="og:locale"]', dictionary.ogLocale);
    setMetaContent('meta[property="og:locale:alternate"]', dictionary.ogAlternateLocale);
    setMetaContent('meta[property="og:image"]', previewImageUrl);
    setMetaContent('meta[property="og:image:alt"]', dictionary.heroImageAlt);
    setMetaContent('meta[name="twitter:title"]', dictionary.documentTitle);
    setMetaContent('meta[name="twitter:description"]', dictionary.description);
    setMetaContent('meta[name="twitter:image"]', previewImageUrl);
    setMetaContent('meta[name="twitter:image:alt"]', dictionary.heroImageAlt);
    setLinkHref('link[rel="canonical"]', dictionary.canonicalUrl);

    const header = document.querySelector(".site-header");
    const brand = document.querySelector(".brand");
    const nav = document.querySelector(".site-nav");
    const languageSwitch = document.querySelector(".language-switch");
    const heroImage = document.querySelector(".hero-image");

    if (header) header.setAttribute("aria-label", dictionary.headerLabel);
    if (brand) brand.setAttribute("aria-label", dictionary.brandLabel);
    if (nav) nav.setAttribute("aria-label", dictionary.navLabel);
    if (languageSwitch) languageSwitch.setAttribute("aria-label", dictionary.languageLabel);
    if (heroImage) heroImage.alt = dictionary.heroImageAlt;

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.dataset.i18n;
      if (dictionary[key]) {
        element.textContent = dictionary[key];
      }
    });

    document.querySelectorAll("[data-language-button]").forEach((button) => {
      const isActive = button.dataset.languageButton === language;
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function setMetaContent(selector, content) {
    const element = document.querySelector(selector);
    if (element) {
      element.content = content;
    }
  }

  function setLinkHref(selector, href) {
    const element = document.querySelector(selector);
    if (element) {
      element.href = href;
    }
  }

  function updateLanguageUrl(language) {
    const url = new URL(window.location.href);
    url.searchParams.set("lang", language);
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }

  async function setLanguage(language) {
    if (!supportedLanguages.includes(language)) {
      return;
    }

    currentLanguage = language;
    try {
      window.localStorage.setItem(languageStorageKey, language);
    } catch (error) {
      // The language switch still works when storage is unavailable.
    }
    updateLanguageUrl(language);
    applyInterfaceText(language);
    await hydrateContent();
  }

  document.querySelectorAll("[data-language-button]").forEach((button) => {
    button.addEventListener("click", () => {
      setLanguage(button.dataset.languageButton);
    });
  });

  applyInterfaceText(currentLanguage);
  hydrateContent();
})();
