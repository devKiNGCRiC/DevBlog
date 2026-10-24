// ============================================================
// src/utils/postContent.js — Prepare a post's HTML for reading
//
// Runs on ALREADY-SANITIZED HTML (DOMPurify) and, in one parse:
// 1. Turns Quill code blocks into real <pre><code> blocks
// 2. Gives headings ids and collects them for the table of contents
//
// Syntax colors are added afterwards by highlightCode(), which loads
// highlight.js only for posts that actually contain code.
// ============================================================

// Quill 2 stores a code block as one <div class="ql-code-block"> per line inside a
// <div class="ql-code-block-container">. Older content may use <pre class="ql-syntax">.
// Rebuild each as <pre class="hljs"><code>…</code></pre>.
const convertCodeBlocks = (doc) => {
    const blocks = [
        ...doc.body.querySelectorAll(".ql-code-block-container"),
        ...doc.body.querySelectorAll("pre.ql-syntax"),
    ];

    blocks.forEach((block) => {
        const lines = block.classList.contains("ql-code-block-container")
            ? [...block.querySelectorAll(".ql-code-block")].map((line) => line.textContent)
            : [block.textContent];

        const pre = doc.createElement("pre");
        const code = doc.createElement("code");
        pre.className = "hljs";
        code.textContent = lines.join("\n"); // textContent → the code is never parsed as HTML
        pre.appendChild(code);
        block.replaceWith(pre);
    });
};

// Give every h1/h2/h3 a unique id so it can be linked to, and return
// the list of headings for the table of contents.
// Example: "<h2>Getting Started</h2>" → <h2 id="h-getting-started">
// The "h-" prefix keeps ids from clashing with built-in page/window names.
const addHeadingIds = (doc) => {
    const headings = [];
    const used = new Set();

    doc.body.querySelectorAll("h1, h2, h3").forEach((el) => {
        const text = el.textContent.trim();
        if (!text) return;
        const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const base = "h-" + (slug || "section");
        let id = base;
        for (let n = 2; used.has(id); n++) id = `${base}-${n}`; // de-duplicate repeated titles
        used.add(id);
        el.id = id;
        headings.push({ id, text, level: Number(el.tagName[1]) });
    });

    return headings;
};

export const preparePostContent = (sanitizedHtml) => {
    const doc = new DOMParser().parseFromString(sanitizedHtml, "text/html");
    convertCodeBlocks(doc);
    const headings = addHeadingIds(doc);
    return { html: doc.body.innerHTML, headings };
};

// Color the code blocks inside an already-rendered element.
// highlight.js (~70 KB gzipped) is downloaded only if there is code to color.
// highlightElement escapes the text itself and only adds <span class="hljs-…">.
export const highlightCode = async (container) => {
    const blocks = container?.querySelectorAll("pre.hljs > code:not([data-highlighted])");
    if (!blocks?.length) return;
    // "common" = ~35 popular languages (JS, TS, Python, Java, Go, SQL, Bash, CSS...)
    const { default: hljs } = await import("highlight.js/lib/common");
    blocks.forEach((code) => hljs.highlightElement(code));
};
