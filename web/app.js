"use strict";
const $ = (selector) => document.querySelector(selector);
let ready = false;
let asking = false;
let searching = false;
let sourceRequest = 0;
let questionLimit = 1200;
const headings = { extracts: "Rulebook extracts", unsupported: "Not established by the rulebook", ambiguous: "Unresolved rule conflict", boundary: "Instructions cannot change the scope", private: "Hidden information stays private" };

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
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
  const response = await fetch(path, { ...options, signal: AbortSignal.timeout(10000) });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status}).`);
  return body;
}

function updateControls() {
  $("#question").disabled = !ready || asking;
  $("#ask-button").disabled = !ready || asking;
  $("#ask-button").textContent = asking ? "Finding passages…" : "Ask question";
  $("#clear-chat").disabled = asking || !$("#messages").childElementCount;
  $("#source-query").disabled = !ready;
  $("#search-button").disabled = !ready || searching;
  $("#search-button").textContent = searching ? "Searching…" : "Search";
  for (const button of $("#samples").querySelectorAll("button")) button.disabled = !ready || asking;
}

function showError(container, message, retry) {
  container.replaceChildren(element("p", message));
  const button = element("button", "Try again");
  button.type = "button";
  button.addEventListener("click", retry);
  container.append(button);
  container.hidden = false;
}

function renderSources(sources) {
  const fragment = document.createDocumentFragment();
  for (const source of sources) {
    const details = element("details", undefined, "source-entry");
    details.id = source.id;
    const summary = element("summary", source.label);
    summary.append(element("span", `${source.document} · lines ${source.line_start}–${source.line_end}`));
    details.append(summary, passageBody(source.text));
    fragment.append(details);
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
    $("#source-status").textContent = result.count ? `${result.count} passages${query ? ` matching “${query}”` : " · expand a section to read"}` : "No passages match. Try a rule, item, or section name.";
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
  let entry = document.getElementById(source.id);
  if (!entry) {
    $("#source-query").value = "";
    if (!await searchSources()) return;
    entry = document.getElementById(source.id);
  }
  if (!entry) return;
  for (const selected of document.querySelectorAll(".source-entry.selected")) selected.classList.remove("selected");
  entry.open = true;
  entry.classList.add("selected");
  const summary = entry.querySelector("summary");
  summary.focus({ preventScroll: true });
  summary.scrollIntoView({ block: "center", behavior: "instant" });
}

function sourceButton(source) {
  const button = element("button", `${source.label} · L${source.line_start}–${source.line_end}`, "citation");
  button.type = "button";
  button.setAttribute("aria-label", `Read supporting source: ${source.label}, lines ${source.line_start} to ${source.line_end}`);
  button.addEventListener("click", () => inspectSource(source));
  return button;
}

function renderAnswer(result) {
  const article = element("article", undefined, `answer ${result.status}`);
  article.dataset.status = result.status;
  article.append(element("h3", headings[result.status] || "Rulebook response", "answer-heading"), element("p", result.message));
  if (result.note) article.append(element("p", result.note, "rule-note"));
  const citations = new Map(result.citations.map((source) => [source.id, source]));
  for (const quote of result.quotes) {
    const source = citations.get(quote.citation);
    if (!source) continue;
    const block = element("blockquote");
    block.append(passageBody(quote.text), sourceButton(source));
    article.append(block);
  }
  if (result.related.length) {
    article.append(element("p", "Related passages · not answer citations", "related-heading"));
    const list = element("div", undefined, "related-list");
    for (const source of result.related) {
      const button = sourceButton(source);
      button.setAttribute("aria-label", `Read related passage, not answer support: ${source.label}`);
      list.append(button);
    }
    article.append(list);
  }
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
    const user = element("article", undefined, "user-message");
    user.append(element("h3", "Your question"), element("p", question));
    turn.append(user);
    $("#messages").append(turn);
  } else {
    turn.querySelector(".error")?.remove();
  }
  $("#empty-chat").hidden = true;
  asking = true;
  updateControls();
  $("#chat-status").textContent = "Finding rulebook passages…";
  $("#messages").setAttribute("aria-busy", "true");
  try {
    const result = await request("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }) });
    turn.append(renderAnswer(result));
    $("#question").value = "";
    $("#chat-status").textContent = `${headings[result.status]}. ${result.quotes.length} quoted ${result.quotes.length === 1 ? "passage" : "passages"}.`;
  } catch (error) {
    const failure = element("div", undefined, "error");
    failure.setAttribute("role", "alert");
    showError(failure, `No answer received: ${error.message} Check the local server, then retry.`, () => ask(question, turn));
    turn.append(failure);
    $("#question").value = question;
    $("#chat-status").textContent = "Request failed. Your question is kept for retry.";
  } finally {
    asking = false;
    $("#messages").setAttribute("aria-busy", "false");
    updateControls();
    $("#question").focus({ preventScroll: true });
    turn.scrollIntoView({ block: "start", behavior: "instant" });
  }
}

async function initialize() {
  ready = false;
  updateControls();
  $("#setup-error").hidden = true;
  $("#backend-label").textContent = "Connecting to local rulebook…";
  try {
    const info = await request("/api/info");
    $("#backend-label").textContent = info.backend;
    $("#provenance").textContent = `${info.provenance.title}. ${info.provenance.status}`;
    questionLimit = info.max_question_length;
    $("#question").maxLength = questionLimit;
    $("#question").setAttribute("aria-describedby", "question-help");
    $("#samples").replaceChildren();
    for (const sample of info.samples) {
      const button = element("button");
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
$("#question").addEventListener("input", () => $("#question").setCustomValidity(""));
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
$("#search-form").addEventListener("submit", (event) => { event.preventDefault(); searchSources($("#source-query").value.trim()); });
$("#source-query").addEventListener("search", () => searchSources($("#source-query").value.trim()));
initialize();
