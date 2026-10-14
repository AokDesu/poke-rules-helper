"use strict";
const $ = (selector) => document.querySelector(selector);
let ready = false;
let asking = false;
let searching = false;
let sourceRequest = 0;
let questionLimit = 1200;
let historyLimit = 3;
let backendInfo;
let lastFailed = false;
// Recent answered exchanges, sent with the next question so follow-ups make sense.
let history = [];
// Whether the newest message should stay in view; false once the reader scrolls up.
let followThread = true;
let autoScrollUntil = 0;
// The control that opened the rulebook index, so Esc can return focus to it.
let indexOpener = null;
let uid = 0;
const sourceCatalog = new Map();
// Each answer state has its own portrait, label and colour (data-state); the label
// always names the state in text, so colour is never the only signal.
const STATES = {
  generated: { tone: "cited", portrait: "pikachu", label: "From the rulebook" },
  uncited: { tone: "uncovered", portrait: "psyduck", label: "Not in the rulebook" },
  ambiguous: { tone: "conflict", portrait: "ditto", label: "Rules conflict" },
  boundary: { tone: "blocked", portrait: "snorlax", label: "Can't help with that" },
  private: { tone: "blocked", portrait: "snorlax", label: "Can't help with that" },
};
// One useful rules question offered after a local refusal.
const REDIRECTS = { boundary: "What do I get for passing Start?", private: "What can I see about other players' items?" };
const sheet = window.matchMedia("(max-width: 1023px)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const numbers = new Intl.NumberFormat("en-US");

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function hiddenText(text) {
  return element("span", text, "visually-hidden");
}

// Generated and source text only ever becomes text nodes; **bold** and `code`
// become <strong>/<code> elements holding text.
function inlineText(node, text) {
  for (const token of text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)) {
    if (token.startsWith("**") && token.endsWith("**") && token.length > 4) node.append(element("strong", token.slice(2, -2)));
    else if (token.startsWith("`") && token.endsWith("`") && token.length > 2) node.append(element("code", token.slice(1, -1)));
    else if (token) node.append(document.createTextNode(token));
  }
  return node;
}

function tableCells(lines) {
  if (lines.length !== 2 || !lines.every((line) => line.startsWith("|") && line.endsWith("|"))) return null;
  const cells = (line) => line.slice(1, -1).split("|").map((cell) => cell.trim());
  const labels = cells(lines[0]), values = cells(lines[1]);
  return labels.length === values.length ? { labels, values } : null;
}

function passageBody(text) {
  const body = element("div", undefined, "passage-body");
  const lines = text.split("\n");
  const table = tableCells(lines);
  if (table) {
    const list = element("dl", undefined, "passage-table");
    table.labels.forEach((label, index) => list.append(inlineText(element("dt"), label), inlineText(element("dd"), table.values[index])));
    body.append(list);
    return body;
  }
  // "- item" lines become a list; other lines stay paragraphs, all as text.
  let list = null;
  for (const line of lines) {
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      if (!list) body.append(list = element("ul", undefined, "passage-list"));
      list.append(inlineText(element("li"), bullet[1]));
    } else if (line.trim()) {
      list = null;
      body.append(inlineText(element("p", undefined, "passage-line"), line));
    }
  }
  return body;
}

// Rulebook index numbers: "§4.1 L143", "§4.2 L149–157", "§A L760–765".
function sectionNumber(source) {
  return source.section.replace(/^Appendix\s+/, "");
}

function tagText(source) {
  const lines = source.line_start === source.line_end ? `L${source.line_start}` : `L${source.line_start}–${source.line_end}`;
  return `§${sectionNumber(source)} ${lines}`;
}

function sectionTitle(source) {
  return source.label.split(" / ")[0].split(" · ").slice(1).join(" · ");
}

function shortLabel(source) {
  const parts = source.label.split(" / ");
  return parts.length > 1 ? parts.at(-1) : sectionTitle(source);
}

function lineWords(source) {
  return source.line_start === source.line_end ? `line ${source.line_start}` : `lines ${source.line_start} to ${source.line_end}`;
}

function preview(source) {
  const table = tableCells(source.text.split("\n"));
  let text = (table ? table.values.join(" · ") : source.text).replace(/^\s*(?:[-*]|\d+\.)\s+/gm, "").replace(/[*`|]/g, "").replace(/\s+/g, " ").trim();
  // "Starting kit: 20 coins…" under the label "Starting kit" reads as "20 coins…".
  const label = `${shortLabel(source)}:`;
  if (text.toLowerCase().startsWith(label.toLowerCase()) && text.length > label.length + 1) {
    text = text.slice(label.length).trim();
    text = text[0].toUpperCase() + text.slice(1);
  }
  return text;
}

function modelName(model) {
  const match = /^claude-([a-z]+)-(\d+)-(\d+)/.exec(model || "");
  return match ? `${match[1][0].toUpperCase()}${match[1].slice(1)} ${match[2]}.${match[3]}` : model || "Claude";
}

async function request(path, options = {}) {
  const response = await fetch(path, { ...options, signal: AbortSignal.timeout(10000) });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status}).`);
  return body;
}

function setLamp(state, label) {
  $(".lamp").dataset.state = state;
  $("#lamp-label").textContent = label;
}

function updateStatus() {
  if (!backendInfo) return;
  const missing = !backendInfo.live.key_configured;
  if (asking) setLamp("loading", "Answering…");
  else if (missing) setLamp("missing", "Key missing");
  else if (lastFailed) setLamp("failed", "Last answer failed");
  else setLamp("ready", "Ready");
  $("#empty-chat").dataset.state = missing ? "failed" : "welcome";
  $("#empty-chat .portrait").className = `portrait portrait-${missing ? "pokeball-open" : "pikachu"}`;
  $("#welcome-label").hidden = !missing;
  $("#welcome-body").hidden = missing;
  $("#key-setup").hidden = !missing;
  $("#cost-note").textContent = missing ? "" : `Each question is one paid ${modelName(backendInfo.live.model)} request (up to ${numbers.format(backendInfo.live.max_output_tokens)} output tokens), never retried automatically.`;
}

function updateControls() {
  $("#question").disabled = !ready || asking;
  $("#ask-button").disabled = !ready || asking;
  $("#clear-chat").disabled = asking || !$("#messages").childElementCount;
  $("#source-query").disabled = !ready;
  $("#search-button").disabled = !ready || searching;
  $("#search-button").textContent = searching ? "Searching…" : "Search";
  for (const button of document.querySelectorAll(".menu-item")) button.disabled = !ready || asking;
}

function showError(container, message, retry, label = "Try again") {
  container.replaceChildren(element("p", message));
  const button = element("button", label, "retry");
  button.type = "button";
  button.addEventListener("click", retry);
  container.append(button);
  container.hidden = false;
}

function growComposer() {
  const field = $("#question");
  field.style.height = "auto";
  field.style.height = `${Math.min(field.scrollHeight + 4, 160)}px`;
}

// Rulebook index: a side panel from 1024px, a full-screen sheet below that, where
// everything behind it is inert.
function setIndex(open, opener) {
  if (open && opener) indexOpener = opener;
  $("#rulebook").hidden = !open;
  $("#rulebook-toggle").setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("index-open", open);
  for (const region of [".shell-head", ".chat", ".dock"]) $(region).inert = open && sheet.matches;
}

function closeIndex() {
  setIndex(false);
  const target = indexOpener?.isConnected && !indexOpener.disabled ? indexOpener : $("#rulebook-toggle");
  indexOpener = null;
  target.focus();
}

// Scroll only the conversation; the device frame never moves.
function keepInView(node, block = "end") {
  if (!followThread) return;
  const thread = $("#thread");
  const box = node.getBoundingClientRect(), frame = thread.getBoundingClientRect();
  const delta = block === "start" ? box.top - frame.top - 40 : box.bottom - frame.bottom + 24;
  const smooth = block === "start" && !reducedMotion.matches;
  // Scroll events caused here are not the reader scrolling away.
  autoScrollUntil = performance.now() + (smooth ? 800 : 100);
  thread.scrollTo({ top: thread.scrollTop + delta, behavior: smooth ? "smooth" : "instant" });
}

function renderSources(sources) {
  const fragment = document.createDocumentFragment();
  let list, current;
  for (const source of sources) {
    sourceCatalog.set(source.id, source);
    const heading = `§${sectionNumber(source)} ${sectionTitle(source)}`;
    if (heading !== current) {
      current = heading;
      const group = element("section", undefined, "index-section");
      group.dataset.section = source.section;
      list = element("div", undefined, "index-entries");
      group.append(element("h3", heading, "index-section-head"), list);
      fragment.append(group);
    }
    const details = element("details", undefined, "source-entry");
    details.id = source.id;
    const summary = element("summary");
    summary.append(element("span", tagText(source), "tag"), element("span", shortLabel(source), "entry-label"),
      element("span", preview(source), "entry-preview"));
    summary.setAttribute("aria-label", `${tagText(source)}: ${shortLabel(source)}, ${lineWords(source)}`);
    details.append(summary, passageBody(source.text));
    list.append(details);
  }
  $("#source-list").replaceChildren(fragment);
}

async function searchSources(query = "") {
  const sequence = ++sourceRequest;
  searching = true;
  updateControls();
  $("#source-status").textContent = "Searching the rulebook…";
  $("#source-error").hidden = true;
  $("#source-list").setAttribute("aria-busy", "true");
  try {
    const result = await request(`/api/sources?q=${encodeURIComponent(query)}`);
    if (sequence !== sourceRequest) return false;
    renderSources(result.sources);
    const count = numbers.format(result.count);
    $("#source-status").textContent = result.count ? `${count} ${result.count === 1 ? "entry" : "entries"}${query ? ` matching “${query}”` : ""}` : "No entries match. Try a rule, item or section name.";
    return true;
  } catch (error) {
    if (sequence !== sourceRequest) return false;
    renderSources([]);
    $("#source-status").textContent = "Rulebook unavailable.";
    showError($("#source-error"), `Could not load the rulebook: ${error.message} Check that the local server is running.`, () => searchSources(query));
    return false;
  } finally {
    if (sequence === sourceRequest) {
      searching = false;
      $("#source-list").setAttribute("aria-busy", "false");
      updateControls();
    }
  }
}

async function openSource(source, opener) {
  setIndex(true, opener);
  let entry = document.getElementById(source.id);
  if (!entry) {
    $("#source-query").value = "";
    if (!await searchSources()) return;
    entry = document.getElementById(source.id);
  }
  if (!entry) return;
  for (const selected of document.querySelectorAll(".source-entry.selected")) selected.classList.remove("selected");
  for (const group of document.querySelectorAll(".index-section.current")) group.classList.remove("current");
  entry.open = true;
  entry.classList.add("selected");
  entry.closest(".index-section")?.classList.add("current");
  const summary = entry.querySelector("summary");
  summary.focus({ preventScroll: true });
  summary.scrollIntoView({ block: "center", behavior: "instant" });
}

function tagButton(source) {
  const button = element("button", tagText(source), "citation");
  button.type = "button";
  button.dataset.sourceId = source.id;
  button.setAttribute("aria-label", `Source ${tagText(source)}: ${shortLabel(source)}, ${lineWords(source)}`);
  button.addEventListener("click", () => openSource(source, button));
  return button;
}

// ▸ menus: one button per question; ↑/↓ (and Home/End) move between them.
function menuItems(list, questions, itemClass) {
  list.replaceChildren();
  for (const question of questions) {
    const button = element("button", question, `menu-item ${itemClass}`);
    button.type = "button";
    button.disabled = !ready || asking;
    button.addEventListener("click", () => ask(question));
    const item = element("li");
    item.append(button);
    list.append(item);
  }
  return list;
}

function menu(heading, questions, itemClass) {
  const id = `menu-${++uid}`;
  const group = element("div", undefined, "menu");
  group.setAttribute("role", "group");
  group.setAttribute("aria-labelledby", id);
  const head = element("h4", heading, "menu-head");
  head.id = id;
  group.append(head, menuItems(element("ul", undefined, "menu-list"), questions, itemClass));
  return group;
}

function portrait(name) {
  const node = element("span", undefined, `portrait portrait-${name}`);
  node.setAttribute("aria-hidden", "true");
  return node;
}

function guideMessage({ tone, portrait: face, label }, className) {
  const article = element("article", undefined, `msg guide ${className}`);
  article.dataset.state = tone;
  const box = element("div", undefined, "box");
  const head = element("h3", undefined, "box-head");
  const stateLabel = element("span", undefined, "state-label");
  stateLabel.append(hiddenText(": "), document.createTextNode(label));
  head.append(element("span", "Rule guide", "nameplate"), stateLabel);
  box.append(head);
  article.append(portrait(face), box);
  return { article, box, stateLabel };
}

function verdictEnd(text) {
  for (const match of text.matchAll(/[.!?]["”’)]*(?=\s|$)|\n/g)) {
    const before = text.slice(0, match.index);
    if (!before.trim()) continue;
    if (match[0] === "\n") return match.index;
    if (/(^|\n)\s*\d+$/.test(before)) continue; // a "1." list marker, not a sentence end
    return match.index + match[0].length;
  }
  return text.length;
}

// The verdict is Claude's first sentence; segments that straddle it are split and
// both halves keep that segment's citations.
function splitVerdict(segments) {
  const end = verdictEnd(segments.map((segment) => segment.text).join(""));
  const verdict = [], rest = [];
  let offset = 0;
  for (const segment of segments) {
    const start = offset;
    offset += segment.text.length;
    if (offset <= end) verdict.push(segment);
    else if (start >= end) rest.push(segment);
    else {
      verdict.push({ ...segment, text: segment.text.slice(0, end - start) });
      rest.push({ ...segment, text: segment.text.slice(end - start) });
    }
  }
  if (rest.length) rest[0] = { ...rest[0], text: rest[0].text.replace(/^\s+/, "") };
  return { verdict, rest };
}

function endsSentence(text, following) {
  return /[.!?]["”’)]*$/.test(text) || !following.trim() || /^[ \t]*\n/.test(following);
}

function renderPieces(container, pieces, context) {
  pieces.forEach((segment, index) => {
    // Only the local source library supplies navigation targets and labels.
    const sources = segment.citations.filter((id) => context.allowed.has(id) && sourceCatalog.has(id)).map((id) => sourceCatalog.get(id));
    if (!sources.length && !segment.text.trim()) {
      container.append(document.createTextNode(segment.text));
      return;
    }
    const [, lead, body, trail] = /^(\s*)([\s\S]*?)(\s*)$/.exec(segment.text);
    if (lead) container.append(document.createTextNode(lead));
    if (sources.length) {
      const span = inlineText(element("span"), body);
      // The last word and its tags wrap together, so a tag never starts a line alone.
      const glue = element("span", undefined, "glue");
      const last = span.lastChild;
      const cut = last?.nodeType === Node.TEXT_NODE ? last.data.search(/\S+$/) : -1;
      if (cut > 0) { glue.append(last.data.slice(cut)); last.data = last.data.slice(0, cut); } else if (last) glue.append(last);
      span.append(glue);
      for (const [order, source] of sources.entries()) {
        context.references.set(source.id, source);
        (order ? span : glue).append(" ", tagButton(source));
      }
      container.append(span);
    } else if (context.markUncited) {
      // Never extend a citation's support to an adjacent uncited chunk.
      // Mark each line on its own; a stray "." or blank line left over from a
      // cited sentence stays plain.
      const parts = body.split(/(\n+)/);
      parts.forEach((part, at) => {
        if (!part) return;
        if (/^[\s.,;:!?)"”’]*$/.test(part)) { container.append(document.createTextNode(part)); return; }
        container.append(inlineText(element("mark", undefined, "uncited-text"), part));
        const following = at < parts.length - 1 ? parts.slice(at + 1).join("") : trail + (pieces[index + 1]?.text ?? "");
        if (endsSentence(part, following)) container.append(document.createTextNode("\u00a0"), element("span", "No source", "no-source"));
        else container.append(hiddenText(" (no source)"));
      });
    } else {
      container.append(inlineText(element("span"), body));
    }
    if (trail) container.append(document.createTextNode(trail));
  });
}

function evidenceList(references) {
  const id = `evidence-${++uid}`;
  const section = element("section", undefined, "evidence");
  section.setAttribute("aria-labelledby", id);
  const head = element("h4", "From the rulebook", "menu-head");
  head.id = id;
  const list = element("ul", undefined, "evidence-list");
  const rows = [...references.values()].map((source) => {
    const button = element("button", undefined, "source-row");
    button.type = "button";
    button.dataset.sourceId = source.id;
    button.setAttribute("aria-label", `Source ${tagText(source)}: ${shortLabel(source)}, ${lineWords(source)}. ${preview(source)}`);
    button.append(element("span", tagText(source), "tag"), element("span", shortLabel(source), "row-label"), element("span", `“${preview(source)}”`, "row-quote"));
    button.addEventListener("click", () => openSource(source, button));
    const item = element("li");
    item.append(button);
    list.append(item);
    return item;
  });
  section.append(head, list);
  const extra = rows.slice(3);
  if (extra.length) {
    for (const row of extra) row.hidden = true;
    const more = element("button", `Show ${extra.length} more`, "show-more");
    more.type = "button";
    more.setAttribute("aria-expanded", "false");
    more.addEventListener("click", () => {
      const expand = more.getAttribute("aria-expanded") === "false";
      for (const row of extra) row.hidden = !expand;
      more.setAttribute("aria-expanded", String(expand));
      more.textContent = expand ? "Show fewer" : `Show ${extra.length} more`;
    });
    section.append(more);
  }
  return section;
}

function renderGenerated(box, result) {
  const context = { allowed: new Set(result.citations.map((source) => source.id)), references: new Map(), markUncited: result.status === "generated" };
  const { verdict, rest } = splitVerdict(result.segments);
  const lead = element("p", undefined, "verdict");
  renderPieces(lead, verdict, context);
  box.append(lead);
  if (rest.length) {
    const explanation = element("p", undefined, "explanation");
    renderPieces(explanation, rest, context);
    box.append(explanation);
  }
  if (result.status === "uncited") box.append(element("p", result.message, "state-note"));
  if (context.references.size) box.append(evidenceList(context.references));
}

function renderConflict(box, result) {
  box.append(element("p", result.message, "plain"));
  const rules = element("div", undefined, "rules");
  result.citations.forEach((citation, index) => {
    const source = sourceCatalog.get(citation.id) || citation;
    const rule = element("section", undefined, "rule");
    const head = element("h4", undefined, "rule-head");
    head.append(element("span", `Rule ${String.fromCharCode(65 + index)}`, "rule-name"), tagButton(source));
    rule.append(head, passageBody(source.text));
    rules.append(rule);
  });
  box.append(rules);
  if (result.note) box.append(element("p", result.note, "state-note"));
}

function renderAnswer(result) {
  const state = STATES[result.status] || { tone: "blocked", portrait: "snorlax", label: "Can't help with that" };
  const { article, box } = guideMessage(state, `answer ${result.status}`);
  article.dataset.status = result.status;
  if (result.status === "ambiguous") renderConflict(box, result);
  else if (result.segments?.length) renderGenerated(box, result);
  else {
    box.append(element("p", result.message, "plain"));
    const references = new Map(result.citations.filter((source) => sourceCatalog.has(source.id)).map((source) => [source.id, sourceCatalog.get(source.id)]));
    if (references.size) box.append(evidenceList(references));
  }
  if (result.follow_ups?.length) box.append(menu("Ask next", result.follow_ups, "follow-up"));
  else if (REDIRECTS[result.status]) box.append(menu("Ask instead", [REDIRECTS[result.status]], "follow-up"));
  const usage = result.usage;
  box.append(element("p", result.response_method === "claude" && usage
    ? `${modelName(result.model)} · ${numbers.format(usage.input_tokens)} in · ${numbers.format(usage.output_tokens)} out`
    : "Answered locally · no paid request", "meta"));
  return article;
}

function announcement(result, article) {
  const state = STATES[result.status]?.label || "Reply";
  const lead = article.querySelector(".verdict, .plain")?.textContent.replace(/\s+/g, " ").trim() || "";
  const cited = result.response_method === "claude" ? ` ${result.citations.length} ${result.citations.length === 1 ? "source" : "sources"}.` : "";
  return `Rule guide, ${state}: ${lead}${cited}${result.follow_ups?.length ? " Suggested follow-up questions are below the answer." : ""}`;
}

function pendingMessage() {
  const { article, box } = guideMessage({ tone: "thinking", portrait: "pokeball", label: "Reading the rulebook…" }, "pending");
  article.setAttribute("aria-label", "Answer in progress");
  box.append(element("p", "Finding the passages that match your question.", "plain quiet"));
  return article;
}

function streamingMessage() {
  const { article, box } = guideMessage({ tone: "streaming", portrait: "pikachu", label: "Answering…" }, "streaming");
  article.setAttribute("aria-busy", "true");
  const text = element("p", undefined, "explanation streaming-text");
  const cursor = element("span", undefined, "next-cursor");
  cursor.setAttribute("aria-hidden", "true");
  box.append(text, element("p", "Sources are checked when the answer finishes.", "state-note"), cursor);
  return { article, text };
}

function failureMessage(reason, retry, withdrawn) {
  const { article, box } = guideMessage({ tone: "failed", portrait: "pokeball-open", label: "No answer this time" }, withdrawn ? "error withdrawn" : "error");
  article.setAttribute("role", "alert");
  if (withdrawn) box.append(element("p", "Answer withdrawn: the draft is gone because it did not pass the final check.", "plain"));
  box.append(element("p", reason, withdrawn ? "state-note" : "plain"), element("p", "Your question is back in the box below. Trying again sends a new request.", "state-note"));
  const button = element("button", "Try again", "retry");
  button.type = "button";
  button.addEventListener("click", retry);
  box.append(button);
  return article;
}

// One question: local guardrail answers arrive as JSON; Claude answers stream as
// newline-delimited JSON events ending in a validated answer or a withdrawal.
async function ask(question, existingTurn, priorHistory = history.slice(-historyLimit)) {
  if (!ready || asking) return;
  question = question.trim();
  if (!question || question.length > questionLimit) {
    $("#question").setCustomValidity(`Enter a question of at most ${questionLimit} characters.`);
    $("#question").reportValidity();
    return;
  }
  const turn = existingTurn || element("div", undefined, "turn");
  if (!existingTurn) {
    const user = element("article", undefined, "msg you");
    user.append(element("h3", "You asked", "visually-hidden"), element("p", question));
    turn.append(user);
    $("#messages").append(turn);
  } else {
    turn.querySelector(".error")?.remove();
  }
  $("#empty-chat").hidden = true;
  asking = true;
  followThread = true;
  updateControls();
  updateStatus();
  let current = pendingMessage();
  turn.append(current);
  keepInView(current);
  $("#chat-status").textContent = "Reading the rulebook. A sent request may be billed even if the connection fails.";
  $("#messages").setAttribute("aria-busy", "true");
  const retry = () => ask(question, turn, priorHistory);
  const fail = (reason, withdrawn) => {
    const failure = failureMessage(reason, retry, withdrawn);
    current.replaceWith(failure);
    current = failure;
    lastFailed = true;
    $("#question").value = question;
    $("#chat-status").textContent = `${withdrawn ? "Answer withdrawn: " : "No answer received: "}${reason} Your question is kept. Retrying sends another request.`;
  };
  const finish = (result) => {
    const answer = renderAnswer(result);
    current.replaceWith(answer);
    current = answer;
    if (result.response_method === "claude") history = [...priorHistory, { question, answer: result.answer_text }].slice(-historyLimit);
    lastFailed = false;
    $("#question").value = "";
    $("#chat-status").textContent = announcement(result, answer);
  };
  try {
    const response = await fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, history: priorHistory }), signal: AbortSignal.timeout(90000) });
    if (!(response.headers.get("Content-Type") || "").startsWith("application/x-ndjson")) {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || `Request failed (${response.status}).`);
      finish(body);
      return;
    }
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "", stream = null, settled = false;
    while (!settled) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      let newline;
      while (!settled && (newline = buffer.indexOf("\n")) >= 0) {
        const event = JSON.parse(buffer.slice(0, newline));
        buffer = buffer.slice(newline + 1);
        if (event.type === "delta") {
          if (!stream) {
            stream = streamingMessage();
            current.replaceWith(stream.article);
            current = stream.article;
            $("#chat-status").textContent = "The rule guide is answering.";
          }
          stream.text.append(document.createTextNode(event.text));
          keepInView(current);
        } else if (event.type === "done") {
          settled = true;
          finish(event.result);
        } else if (event.type === "error") {
          settled = true;
          fail(event.error, Boolean(stream));
        }
      }
    }
    if (!settled) fail("The connection ended before the answer was checked.", Boolean(stream));
  } catch (error) {
    fail(error.message, false);
  } finally {
    asking = false;
    $("#messages").setAttribute("aria-busy", "false");
    updateControls();
    updateStatus();
    growComposer();
    $("#question").focus({ preventScroll: true });
    // Show the question with its answer, unless the question is so tall that the
    // answer's first line would fall out of view.
    const asked = turn.querySelector(".you");
    keepInView(asked && asked.offsetHeight < $("#thread").clientHeight * 0.4 ? turn : current, "start");
  }
}

async function initialize() {
  ready = false;
  updateControls();
  $("#setup-error").hidden = true;
  setLamp("loading", "Connecting…");
  try {
    const info = await request("/api/info");
    backendInfo = info;
    updateStatus();
    $("#provenance").textContent = `${info.provenance.title} · ${info.provenance.status}`;
    questionLimit = info.max_question_length;
    historyLimit = info.live.max_history_turns;
    $("#question").maxLength = questionLimit;
    ready = true;
    menuItems($("#samples"), info.samples.map((sample) => sample.question), "suggestion");
    updateControls();
    await searchSources();
  } catch (error) {
    setLamp("failed", "Offline");
    $("#provenance").textContent = "Source details unavailable.";
    $("#source-status").textContent = "Rulebook unavailable until the connection is restored.";
    showError($("#setup-error"), `Could not connect: ${error.message} Start the local server and try again.`, initialize);
  }
}

$("#ask-form").addEventListener("submit", (event) => { event.preventDefault(); ask($("#question").value); });
$("#question").addEventListener("input", () => { $("#question").setCustomValidity(""); growComposer(); });
$("#question").addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) { event.preventDefault(); $("#ask-form").requestSubmit(); }
});
$("#thread").addEventListener("scroll", () => {
  if (performance.now() < autoScrollUntil) return;
  const thread = $("#thread");
  followThread = thread.scrollHeight - thread.scrollTop - thread.clientHeight < 96;
}, { passive: true });
document.addEventListener("keydown", (event) => {
  const item = event.target.closest?.(".menu-item");
  if (!item || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
  const items = [...item.closest(".menu-list").querySelectorAll(".menu-item:not(:disabled)")];
  const index = items.indexOf(item);
  const next = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: items.length - 1 }[event.key];
  event.preventDefault();
  items[(next + items.length) % items.length]?.focus();
});
$("#clear-chat").addEventListener("click", () => {
  $("#messages").replaceChildren();
  history = [];
  lastFailed = false;
  $("#empty-chat").hidden = false;
  updateStatus();
  $("#chat-status").textContent = "Conversation cleared. The next question starts fresh; nothing was stored.";
  updateControls();
  $("#question").focus();
});
$("#rulebook-toggle").addEventListener("click", () => {
  if (!$("#rulebook").hidden) { closeIndex(); return; }
  setIndex(true, $("#rulebook-toggle"));
  $("#index-heading").focus({ preventScroll: true });
});
$("#rulebook-close").addEventListener("click", closeIndex);
$("#rulebook-back").addEventListener("click", closeIndex);
$("#rulebook").addEventListener("keydown", (event) => { if (event.key === "Escape") closeIndex(); });
sheet.addEventListener("change", () => setIndex(!$("#rulebook").hidden));
$("#search-form").addEventListener("submit", (event) => { event.preventDefault(); searchSources($("#source-query").value.trim()); });
$("#source-query").addEventListener("search", () => searchSources($("#source-query").value.trim()));
initialize();
