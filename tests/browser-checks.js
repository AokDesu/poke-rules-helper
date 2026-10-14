async () => {
  // Run through chrome-devtools-axi eval on the app. Synthetic provider data,
  // never a paid request or a substitute for genuine live proof.
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const until = async (predicate) => {
    const deadline = Date.now() + 5000;
    while (!predicate()) {
      if (Date.now() > deadline) throw new Error("Browser regression timed out");
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  };
  await until(() => !document.querySelector("#answer-mode").disabled);
  const mode = document.querySelector("#answer-mode");
  const question = document.querySelector("#question");
  const select = (value) => { mode.value = value; mode.dispatchEvent(new Event("change", { bubbles: true })); };
  const submit = (text) => { question.value = text; document.querySelector("#ask-form").requestSubmit(); };
  const originalFetch = window.fetch;
  const sourceResponse = await originalFetch("/api/sources?q=catch");
  const { sources } = await sourceResponse.json();
  const source = sources.find((entry) => entry.section === "4.3");
  assert(source, "Catching evidence is required for this browser scenario");
  const before = document.querySelectorAll(".answer").length;
  const payload = {
    status: "generated", backend: "Claude · claude-haiku-5-5", model: "claude-haiku-5-5",
    response_method: "claude", usage: { input_tokens: 200, output_tokens: 50 },
    message: "Synthetic regression response, not a live proof.", quotes: [], related: [],
    citations: [source, { id: "invented-target", label: "fake support" }],
    segments: [
      { text: '<img src=x onerror="window.__unsafeRuleText=true"> <script>window.__unsafeRuleText=true</script>', citations: [source.id] },
      { text: "Uncited rule claim", citations: [] },
      { text: "Invented reference claim", citations: ["invented-target"] },
    ],
  };
  try {
    window.fetch = async (path, options) => path === "/api/ask"
      ? (await new Promise((resolve) => setTimeout(resolve, 80)), new Response(JSON.stringify(payload), { headers: { "Content-Type": "application/json" } }))
      : originalFetch(path, options);
    select("live");
    submit("Does a failed catch still use a Ball?");
    assert(mode.disabled, "Mode must not change during an in-flight answer");
    assert(document.querySelector("#messages").getAttribute("aria-busy") === "true", "Loading must be exposed");
    await until(() => !mode.disabled);
    const answer = [...document.querySelectorAll(".answer")].at(-1);
    assert(!answer.querySelector("img, script, a"), "Generated markup must be inert text");
    assert(!window.__unsafeRuleText, "Generated code must never run");
    assert(answer.textContent.includes("<img"), "Untrusted text must remain readable, not interpreted");
    assert(answer.querySelectorAll(".citation").length === 1, "Invented references must not become source navigation");
    assert(answer.querySelectorAll(".unverified").length === 2, "Uncited and invented-reference claims must be visibly unverified");
    answer.querySelector(".citation").click();
    await until(() => document.getElementById(source.id)?.open);
    assert(document.activeElement === document.getElementById(source.id).querySelector("summary"), "Citation must focus its source");
    select("offline");
    assert(answer.textContent.includes("Returned model: claude-haiku-5-5"), "Changing mode must not relabel old answers");
    window.fetch = originalFetch;
    submit("Does every catch attempt consume a Ball?");
    await until(() => !mode.disabled);
    const offline = [...document.querySelectorAll(".answer")].at(-1);
    assert(offline.dataset.status === "extracts", "Offline selection must produce exact extracts");
    assert(offline.querySelector("blockquote"), "Offline evidence must be quoted, not labelled as generated");
    assert(document.querySelectorAll(".answer").length === before + 2, "Each completed question must keep its own answer");
    document.querySelector("#clear-chat").click();
    assert(!document.querySelector("#empty-chat").hidden && !document.querySelector("#messages").childElementCount, "Clear must restore the empty conversation");
    return { result: "passed", scenarios: ["inert generated markup", "unverified uncited text", "invented citation rejection", "loading mode lock", "citation focus", "live/offline transition", "clear conversation"], paid_requests: 0 };
  } finally {
    window.fetch = originalFetch;
    delete window.__unsafeRuleText;
  }
}
