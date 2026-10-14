"use strict";
const $ = (selector) => document.querySelector(selector);
let ready = false;
let asking = false;
let searching = false;
let sourceRequest = 0;
let questionLimit = 1200;
let backendInfo;
const sourceCatalog = new Map();
const headings = { generated: "Claude explanation · review the sources", extracts: "Rulebook extracts", unsupported: "Not established by the rulebook", ambiguous: "Unresolved rule conflict", boundary: "Instructions cannot change the scope", private: "Hidden information stays private" };
// Decorative guide portraits; every state is also named in text.
const avatars = { generated: "pikachu", extracts: "pokeball", unsupported: "psyduck", ambiguous: "ditto", boundary: "snorlax", private: "snorlax" };
const narrow = window.matchMedia("(max-width: 1023px)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function avatar(name) {
  const portrait = element("span", undefined, `avatar avatar-${name}`);
  portrait.setAttribute("aria-hidden", "true");
  return portrait;
}

function inlineText(node, text) {
  for (const token of text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)) {
    if (token.startsWith("**") && token.endsWith("**")) node.append(element("strong", token.slice(2, -2)));
    else if (token.startsWith("`") && token.endsWith("`")) node.append(element("code", token.slice(1, -1)));
    else node.append(document.createTextNode(token));
  }
  return node;
}

function passageBody(text) {
  const body = element("div", undefined, "passage-body");
  const lines = text.split("\n");
  if (lines.length === 2 && lines.every((line) => line.startsWith("|") && line.endsWith("|"))) {
    const cells = (line) => line.slice(1, -1).split("|").map((cell) => cell.trim());
    const labels = cells(lines[0]), values = cells(lines[1]);
    if (labels.length === values.length) {
      const list = element("dl", undefined, "passage-table");
      labels.forEach((label, index) => list.append(inlineText(element("dt"), label), inlineText(element("dd"), values[index])));
      body.append(list);
      return body;
    }
  }
  for (const line of lines) body.append(inlineText(element("p", undefined, "passage-line"), line));
  return body;
}

async function request(path, options = {}) {
  const response = await fetch(path, { ...options, signal: AbortSignal.timeout(path === "/api/ask" ? 45000 : 10000) });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status}).`);
  return body;
}

function selectedMode() {
  return $("#answer-mode").value;
}

function updateMode() {
  if (!backendInfo) return;
  const live = selectedMode() === "live";
  const missing = live && !backendInfo.live.key_configured;
  $("#backend-label").textContent = `${backendInfo.backends[selectedMode()]}${missing ? " · key missing" : ""}`;
  $(".backend").dataset.state = missing ? "missing" : "ready";
  document.body.dataset.mode = selectedMode();
  $("#mode-help").classList.toggle("missing", missing);
  $("#mode-help").textContent = !live
    ? "Offline quotations only. No credentials needed and no paid requests."
    : missing
      ? "Key missing. Set ANTHROPIC_API_KEY privately in the server environment or local .env, then restart. Nothing is sent until a key is configured."
      : `${backendInfo.live.successful_request_seen ? "A live request succeeded in this session." : "Credential configured, not yet verified in this session."} Eligible questions send retrieved passages to Claude, up to ${backendInfo.live.max_output_tokens} output tokens. Paid requests; no automatic retries or offline fallback.`;
  $("#welcome-copy").textContent = live
    ? "Claude explains retrieved written rules with source references. Check the interpretation. Known conflicts and unsupported questions stay unresolved; no game state is connected."
    : "This offline helper finds and quotes written rules. It does not generate rulings, track your game, or fill gaps with guesses.";
}

function updateControls() {
  $("#question").disabled = !ready || asking;
  $("#ask-button").disabled = !ready || asking;
  $("#ask-button .send-label").textContent = asking ? (selectedMode() === "live" ? "Asking Claude…" : "Finding passages…") : "Ask";
  $("#answer-mode").disabled = !ready || asking;
  $("#clear-chat").disabled = asking || !$("#messages").childElementCount;
  $("#source-query").disabled = !ready;
  $("#search-button").disabled = !ready || searching;
  $("#search-button").textContent = searching ? "Searching…" : "Search";
  for (const button of $("#samples").querySelectorAll("button")) button.disabled = !ready || asking;
}

function showError(container, message, retry, label = "Try again") {
  container.replaceChildren(element("p", message));
  const button = element("button", label);
  button.type = "button";
  button.addEventListener("click", retry);
  container.append(button);
  container.hidden = false;
}

function growComposer() {
  const field = $("#question");
  field.style.height = "auto";
  field.style.height = `${Math.min(field.scrollHeight + 2, 220)}px`;
}

// Rulebook map: a side panel on wide screens, a full-height sheet on narrow ones.
function setMap(open, { focus = false } = {}) {
  const map = $("#rulebook-map");
  map.hidden = !open;
  $("#map-toggle").setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("map-open", open);
  $(".chat").inert = open && narrow.matches;
  if (open && focus) $("#source-heading").focus({ preventScroll: true });
}

// Scroll only the conversation pane; the app shell itself never moves.
function keepInView(node, block = "end") {
  const thread = $("#thread");
  const box = node.getBoundingClientRect(), frame = thread.getBoundingClientRect();
  const delta = block === "start" ? box.top - frame.top - 16 : box.bottom - frame.bottom + 16;
  thread.scrollTo({ top: thread.scrollTop + delta, behavior: reducedMotion.matches ? "instant" : "smooth" });
}

function lineSpan(source, single, range) {
  return source.line_start === source.line_end ? `${single}${source.line_start}` : `${range}${source.line_start}–${source.line_end}`;
}

function sectionTitle(source) {
  return source.label.split(" / ")[0];
}

function renderSources(sources) {
  const fragment = document.createDocumentFragment();
  let stop, list, count, current;
  for (const source of sources) {
    sourceCatalog.set(source.id, source);
    const title = sectionTitle(source);
    if (title !== current) {
      current = title;
      stop = element("section", undefined, "stop");
      const head = element("h3", undefined, "stop-head");
      head.append(element("span", title, "stop-name"));
      count = element("span", undefined, "stop-count");
      count.dataset.count = "0";
      head.append(count);
      list = element("div", undefined, "stop-passages");
      stop.append(head, list);
      fragment.append(stop);
    }
    count.dataset.count = String(Number(count.dataset.count) + 1);
    count.textContent = `${count.dataset.count} ${count.dataset.count === "1" ? "passage" : "passages"}`;
    const details = element("details", undefined, "source-entry");
    details.id = source.id;
    const local = source.label.includes(" / ") ? source.label.slice(title.length + 3) : "";
    const preview = source.text.replace(/[*`|]/g, "").replace(/\s+/g, " ").trim();
    const summary = element("summary");
    summary.append(element("span", local || (preview.length > 72 ? `${preview.slice(0, 70)}…` : preview), "entry-name"),
      element("span", lineSpan(source, "Line ", "Lines "), "entry-lines"));
    details.append(summary, passageBody(source.text));
    list.append(details);
  }
  $("#source-list").replaceChildren(fragment);
}

async function searchSources(query = "") {
  const sequence = ++sourceRequest;
  searching = true;
  updateControls();
  $("#source-status").textContent = "Searching labeled passages…";
  $("#source-error").hidden = true;
  $("#source-list").setAttribute("aria-busy", "true");
  try {
    const result = await request(`/api/sources?q=${encodeURIComponent(query)}`);
    if (sequence !== sourceRequest) return false;
    renderSources(result.sources);
    $("#source-status").textContent = result.count ? `${result.count} passages${query ? ` matching “${query}”` : " · expand a passage to read"}` : "No passages match. Try a rule, item, or section name.";
    return true;
  } catch (error) {
    if (sequence !== sourceRequest) return false;
    renderSources([]);
    $("#source-status").textContent = "Sources unavailable.";
    showError($("#source-error"), `Could not load sources: ${error.message} Check that the local server is running.`, () => searchSources(query));
    return false;
  } finally {
    if (sequence === sourceRequest) {
      searching = false;
      $("#source-list").setAttribute("aria-busy", "false");
      updateControls();
    }
  }
}

async function inspectSource(source) {
  setMap(true);
  let entry = document.getElementById(source.id);
  if (!entry) {
    $("#source-query").value = "";
    if (!await searchSources()) return;
    entry = document.getElementById(source.id);
  }
  if (!entry) return;
  for (const selected of document.querySelectorAll(".source-entry.selected")) selected.classList.remove("selected");
  for (const stop of document.querySelectorAll(".stop.current")) stop.classList.remove("current");
  entry.open = true;
  entry.classList.add("selected");
  entry.closest(".stop")?.classList.add("current");
  const summary = entry.querySelector("summary");
  summary.focus({ preventScroll: true });
  summary.scrollIntoView({ block: "center", behavior: "instant" });
}

function sourceButton(source) {
  const button = element("button", undefined, "citation");
  button.type = "button";
  button.append(element("span", source.label, "citation-label"), element("span", lineSpan(source, "L", "L"), "citation-lines"));
  button.setAttribute("aria-label", `Read supporting source: ${source.label}, lines ${source.line_start} to ${source.line_end}`);
  button.addEventListener("click", () => inspectSource(source));
  return button;
}

function guideMessage(name, className) {
  const article = element("article", undefined, `message guide ${className}`);
  const bubble = element("div", undefined, "bubble");
  article.append(avatar(name), bubble);
  return { article, bubble };
}

function renderAnswer(result) {
  const { article, bubble } = guideMessage(avatars[result.status] || "pokeball", `answer ${result.status}`);
  article.dataset.status = result.status;
  bubble.append(element("h3", headings[result.status] || "Rulebook response", "answer-heading"), element("p", result.message, "answer-message"));
  const method = result.response_method === "claude"
    ? `Returned model: ${result.model} · ${result.usage.input_tokens} input / ${result.usage.output_tokens} output tokens`
    : result.response_method === "policy" ? "Local scope / evidence screening · no Claude request made" : "Exact quotations · no API request";
  if (result.note) bubble.append(element("p", result.note, "rule-note"));
  const citations = new Map(result.citations.map((source) => [source.id, source]));
  for (const quote of result.quotes) {
    const source = citations.get(quote.citation);
    if (!source) continue;
    const block = element("blockquote");
    block.append(passageBody(quote.text), sourceButton(source));
    bubble.append(block);
  }
  if (result.segments?.length) {
    const block = element("div", undefined, "generated-answer");
    const prose = element("p", undefined, "generated-text");
    const references = new Map();
    let uncited = false;
    for (const segment of result.segments) {
      const numbers = [];
      for (const id of segment.citations) {
        // Only the source library supplies navigation targets and labels.
        const source = citations.has(id) && sourceCatalog.get(id);
        if (!source) continue;
        if (!references.has(id)) references.set(id, { source, number: references.size + 1 });
        numbers.push(references.get(id).number);
      }
      // Native citation chunks can split a sentence. Keep their text contiguous,
      // but never extend a citation's support to an adjacent uncited chunk.
      const text = element(numbers.length ? "span" : "mark", segment.text, numbers.length ? undefined : "uncited-text");
      if (!numbers.length) {
        uncited = true;
        text.title = "No supporting citation · unverified text";
      }
      prose.append(text);
      if (numbers.length) prose.append(element("sup", `[${numbers.join(", ")}]`, "citation-index"));
    }
    block.append(prose);
    if (uncited) block.append(element("p", "Highlighted text has no supporting citation and is unverified.", "unverified"));
    const list = element("div", undefined, "generated-citations");
    for (const { source, number } of references.values()) {
      const button = sourceButton(source);
      button.prepend(element("span", `[${number}]`, "citation-number"));
      list.append(button);
    }
    if (list.childElementCount) {
      block.append(element("p", "Sources for numbered text · review the interpretation", "related-heading"), list);
    }
    bubble.append(block);
  }
  if (result.related.length) {
    bubble.append(element("p", "Related passages · not answer citations", "related-heading"));
    const list = element("div", undefined, "related-list");
    for (const source of result.related) {
      const button = sourceButton(source);
      button.classList.add("related");
      button.setAttribute("aria-label", `Read related passage, not answer support: ${source.label}`);
      list.append(button);
    }
    bubble.append(list);
  }
  bubble.append(element("p", `${result.backend} · ${method}`, "answer-meta"));
  return article;
}

function pendingMessage(mode) {
  const { article, bubble } = guideMessage(mode === "live" ? "pikachu" : "pokeball", "pending");
  article.setAttribute("aria-label", "Answer in progress");
  const ball = element("span", undefined, "thinking-ball");
  ball.setAttribute("aria-hidden", "true");
  bubble.append(ball, element("span", mode === "live" ? "Checking scope and asking Claude…" : "Finding rulebook passages…", "thinking-text"));
  return article;
}

async function ask(question, existingTurn) {
  if (!ready || asking) return;
  question = question.trim();
  if (!question || question.length > questionLimit) {
    $("#question").setCustomValidity(`Enter a question of at most ${questionLimit} characters.`);
    $("#question").reportValidity();
    return;
  }
  const turn = existingTurn || element("div", undefined, "turn");
  if (!existingTurn) {
    const user = element("article", undefined, "message user user-message");
    const bubble = element("div", undefined, "bubble");
    bubble.append(element("h3", "You asked", "visually-hidden"), element("p", question));
    user.append(bubble);
    turn.append(user);
    $("#messages").append(turn);
  } else {
    turn.querySelector(".error")?.remove();
  }
  $("#empty-chat").hidden = true;
  const mode = selectedMode();
  asking = true;
  updateControls();
  const pending = pendingMessage(mode);
  turn.append(pending);
  keepInView(pending);
  $("#chat-status").textContent = mode === "live" ? "Checking scope and requesting Claude… A sent request may be billed even if the connection fails." : "Finding rulebook passages…";
  $(".backend").dataset.state = "loading";
  $("#messages").setAttribute("aria-busy", "true");
  let latest = pending;
  try {
    const result = await request("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, mode }) });
    latest = renderAnswer(result);
    pending.replaceWith(latest);
    if (result.response_method === "claude") backendInfo.live.successful_request_seen = true;
    $("#question").value = "";
    updateMode();
    $("#chat-status").textContent = result.response_method === "claude" ? `${headings[result.status]}. ${result.citations.length} supporting source references.` : `${headings[result.status]}. No Claude request made.`;
  } catch (error) {
    const { article, bubble } = guideMessage(mode === "live" ? "pikachu" : "pokeball", "error");
    article.setAttribute("role", "alert");
    showError(bubble, `No ${mode === "live" ? "live" : "offline"} answer received: ${error.message}`, () => ask(question, turn), "Retry in selected mode");
    latest = article;
    pending.replaceWith(article);
    $(".backend").dataset.state = "error";
    $("#backend-label").textContent = `${backendInfo.backends[mode]} · request failed${mode === "live" && !backendInfo.live.key_configured ? " · key missing" : ""}`;
    $("#question").value = question;
    $("#chat-status").textContent = `Request failed. Mode was not changed. Your question is kept.${mode === "live" ? " Retrying Live may incur another charge." : ""}`;
  } finally {
    asking = false;
    $("#messages").setAttribute("aria-busy", "false");
    updateControls();
    growComposer();
    $("#question").focus({ preventScroll: true });
    keepInView(latest, "start");
  }
}

async function initialize() {
  ready = false;
  updateControls();
  $("#setup-error").hidden = true;
  $("#backend-label").textContent = "Connecting to local rulebook…";
  try {
    const info = await request("/api/info");
    backendInfo = info;
    $("#answer-mode").value = info.default_mode;
    updateMode();
    $("#provenance").textContent = `${info.provenance.title}. ${info.provenance.status}`;
    questionLimit = info.max_question_length;
    $("#question").maxLength = questionLimit;
    $("#samples").replaceChildren();
    for (const sample of info.samples) {
      const button = element("button", undefined, "suggestion");
      button.type = "button";
      button.append(element("strong", sample.label), element("span", sample.question));
      button.addEventListener("click", () => ask(sample.question));
      $("#samples").append(button);
    }
    ready = true;
    updateControls();
    await searchSources();
  } catch (error) {
    $("#backend-label").textContent = "Local backend unavailable";
    $("#provenance").textContent = "Source metadata unavailable.";
    $("#source-status").textContent = "Sources unavailable until the connection is restored.";
    showError($("#setup-error"), `Could not connect: ${error.message} Start the local server and try again.`, initialize);
  }
}

$("#ask-form").addEventListener("submit", (event) => { event.preventDefault(); ask($("#question").value); });
$("#answer-mode").addEventListener("change", () => {
  updateMode();
  $("#chat-status").textContent = `Selected ${selectedMode() === "live" ? "Live Claude" : "Offline quotations"}. Previous responses are unchanged.`;
});
$("#question").addEventListener("input", () => { $("#question").setCustomValidity(""); growComposer(); });
$("#question").addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) { event.preventDefault(); $("#ask-form").requestSubmit(); }
});
$("#clear-chat").addEventListener("click", () => {
  $("#messages").replaceChildren();
  $("#empty-chat").hidden = false;
  $("#chat-status").textContent = "Conversation cleared. Nothing was stored.";
  updateControls();
  $("#question").focus();
});
$("#map-toggle").addEventListener("click", () => setMap($("#rulebook-map").hidden, { focus: true }));
$("#map-close").addEventListener("click", () => { setMap(false); $("#map-toggle").focus(); });
$("#rulebook-map").addEventListener("keydown", (event) => {
  if (event.key === "Escape") { setMap(false); $("#map-toggle").focus(); }
});
narrow.addEventListener("change", () => setMap(!$("#rulebook-map").hidden));
$("#search-form").addEventListener("submit", (event) => { event.preventDefault(); searchSources($("#source-query").value.trim()); });
$("#source-query").addEventListener("search", () => searchSources($("#source-query").value.trim()));
initialize();
