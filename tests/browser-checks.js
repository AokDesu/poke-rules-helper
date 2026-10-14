async () => {
  // Run through chrome-devtools-axi eval on the app. Synthetic provider streams,
  // never a paid request or a substitute for genuine live proof.
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const until = async (predicate) => {
    const deadline = Date.now() + 5000;
    while (!predicate()) {
      if (Date.now() > deadline) throw new Error("Browser regression timed out");
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  };
  await until(() => !document.querySelector("#question").disabled);
  const question = document.querySelector("#question");
  const submit = (text) => { question.value = text; document.querySelector("#ask-form").requestSubmit(); };
  const originalFetch = window.fetch;
  const { sources } = await (await originalFetch("/api/sources?q=catch")).json();
  const source = sources.find((entry) => entry.section === "4.3");
  assert(source, "Catching evidence is required for this browser scenario");
  const bodies = [];
  let release;
  // Each scripted reply is a list of NDJSON events; a "hold" pauses the stream.
  const reply = (events) => async (path, options) => {
    if (path !== "/api/ask") return originalFetch(path, options);
    bodies.push(JSON.parse(options.body));
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      async start(controller) {
        for (const event of events) {
          if (event === "hold") { await new Promise((resolve) => { release = resolve; }); continue; }
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
          await new Promise((resolve) => setTimeout(resolve, 30));
        }
        controller.close();
      },
    });
    return new Response(body, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8" } });
  };
  const result = {
    status: "generated", backend: "Claude · claude-haiku-5-5", model: "claude-haiku-5-5", response_method: "claude",
    usage: { input_tokens: 200, output_tokens: 50 }, message: "Synthetic regression response, not a live proof.",
    note: null, citations: [source, { id: "invented-target", label: "fake support" }],
    segments: [
      { text: '<img src=x onerror="window.__unsafeRuleText=true"> <script>window.__unsafeRuleText=true</script>', citations: [source.id] },
      { text: "Uncited rule claim", citations: [] },
      { text: "Invented reference claim", citations: ["invented-target"] },
    ],
    follow_ups: ['What about <img src=x onerror="window.__unsafeRuleText=true">?'],
    answer_text: "Every catch attempt uses a Ball.",
  };
  try {
    window.fetch = reply([{ type: "delta", text: "Every catch " }, "hold", { type: "delta", text: "attempt uses a Ball." }, { type: "done", result }]);
    submit("Does a failed catch still use a Ball?");
    await until(() => document.querySelector("#messages .streaming .streaming-text")?.textContent.includes("Every catch"));
    assert(question.disabled, "The composer must lock while an answer streams");
    assert(document.querySelector("#messages").getAttribute("aria-busy") === "true", "Streaming must be exposed as busy");
    await until(() => typeof release === "function");
    release();
    await until(() => !question.disabled);
    const answer = [...document.querySelectorAll(".answer")].at(-1);
    assert(!document.querySelector("#messages .streaming"), "The streamed draft must be replaced by the checked answer");
    assert(!answer.querySelector("img, script, a"), "Generated markup must be inert text");
    assert(answer.textContent.includes("<img"), "Untrusted text must remain readable, not interpreted");
    assert(answer.querySelectorAll(".citation").length === 1, "Invented references must not become source navigation");
    const unverified = [...answer.querySelectorAll(".uncited-text")].map((node) => node.textContent);
    assert(unverified.includes("Uncited rule claim") && unverified.includes("Invented reference claim"), "Uncited claims must be visibly unverified");
    const followUp = answer.querySelector(".follow-up");
    assert(followUp && followUp.textContent.startsWith("What about <img"), "Follow-up suggestions must be inert, tappable text");
    answer.querySelector(".citation").click();
    await until(() => document.getElementById(source.id)?.open);
    assert(document.activeElement === document.getElementById(source.id).querySelector("summary"), "Citation must focus its source");
    document.querySelector("#map-close").click();

    window.fetch = reply([{ type: "delta", text: "A draft that fails validation" }, { type: "error", error: "Claude returned invalid source references.", code: "invalid_citations" }]);
    followUp.click();
    await until(() => !question.disabled);
    assert(bodies.at(-1).history.length === 1 && bodies.at(-1).history[0].answer === result.answer_text, "A follow-up must carry the previous exchange");
    assert(!document.querySelector("#messages").textContent.includes("A draft that fails validation"), "A failed answer must be withdrawn, not left looking verified");
    assert(document.querySelector("#messages .withdrawn"), "Withdrawal must be visible");
    assert(question.value.startsWith("What about"), "The failed question must be kept for a manual retry");

    document.querySelector("#clear-chat").click();
    assert(!document.querySelector("#empty-chat").hidden && !document.querySelector("#messages").childElementCount, "Clear must restore the empty conversation");
    window.fetch = reply([{ type: "done", result }]);
    submit("Does every catch attempt consume a Ball?");
    await until(() => !question.disabled);
    assert(bodies.at(-1).history.length === 0, "Clear must start a fresh conversation");
    document.querySelector("#clear-chat").click();
    return { result: "passed", scenarios: ["progressive streaming with composer lock", "inert generated markup and follow-ups", "unverified uncited text", "invented citation rejection", "citation focus", "withdrawn failed answer", "follow-up history", "clear starts fresh"], paid_requests: 0 };
  } finally {
    window.fetch = originalFetch;
    delete window.__unsafeRuleText;
  }
}
