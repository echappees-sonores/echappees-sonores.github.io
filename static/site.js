(function () {
  const contentIndexPath = "static/content/content.json";

  const fallbackContent = {
    about: [
      "# Échappées Sonores\n\nÉchappées Sonores rassemble des chanteuses et chanteurs animés par le répertoire d'opéra, la polyphonie et les rencontres avec le public."
    ],
    programming: [
      "# Programmation en cours de préparation\n\nLes événements apparaîtront ici automatiquement lorsque leurs descriptions seront disponibles."
    ],
    contact: [
      "# Nous contacter\n\nPour une demande de concert, une collaboration artistique ou une question pratique, contactez l'ensemble par courriel."
    ]
  };

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
    const response = await fetch(contentIndexPath, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error("Registre de contenu indisponible");
    }
    return response.json();
  }

  async function loadMarkdownGroup(index, section) {
    const paths = index[section] || [];
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
    const article = document.createElement("article");
    article.className = "event-card";

    const imageWrap = document.createElement("div");
    imageWrap.className = "event-image-wrap";

    const image = document.createElement("img");
    image.src = "static/images/presentation.jpeg";
    image.alt = "";
    imageWrap.append(image);

    const body = document.createElement("div");
    body.className = "event-body";

    const kicker = document.createElement("p");
    kicker.className = "event-kicker";
    kicker.textContent = "Programmation";

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

    await Promise.all(
      Object.keys(fallbackContent).map(async (section) => {
        const markdownFiles = await loadMarkdownGroup(index, section);
        hydrateSection(section, markdownFiles.length ? markdownFiles : fallbackContent[section]);
      })
    );
  }

  hydrateContent();
})();
