---
name: "Poke Monopoly Rules Helper"
description: "Rulebook Pokédex: a red device frame, Gen-1 dialogue boxes and exact rulebook index numbers"
colors:
  shell: "#C8102E"
  shell-deep: "#8E0C21"
  on-shell: "#FFFFFF"
  on-shell-muted: "#FFE3E7"
  bg: "#EDF4E6"
  surface: "#FFFFFF"
  ink: "#1A1C22"
  ink-muted: "#4B5160"
  line: "#C7CFBE"
  accent: "#C8102E"
  accent-deep: "#8E0C21"
  go: "#FFCB05"
  lens: "#1F5FBF"
  user: "#2B2F3A"
  shell-dark: "#8E0C21"
  shell-deep-dark: "#5E0716"
  on-shell-dark: "#FFFFFF"
  on-shell-muted-dark: "#FFD0D7"
  bg-dark: "#14161B"
  surface-dark: "#1E2128"
  ink-dark: "#E8EAE3"
  ink-muted-dark: "#A7ADB8"
  line-dark: "#343843"
  accent-dark: "#FF5A6E"
  accent-deep-dark: "#C8102E"
  go-dark: "#FFCB05"
  lens-dark: "#7FB0FF"
  user-dark: "#3A3F4C"
  cited-ink: "#1F6B45"
  cited-ground: "#E3F3EA"
  uncovered-ink: "#7A4E00"
  uncovered-ground: "#FFF1CC"
  conflict-ink: "#5B3A8C"
  conflict-ground: "#EEE6F8"
  blocked-ink: "#3E4A5C"
  blocked-ground: "#E4E8EE"
  failed-ink: "#A3152B"
  failed-ground: "#FDE7EA"
  mark: "#FFE08A"
  mark-line: "#7A4E00"
  lens-tint: "#E6EEFA"
  lens-tint-dark: "#243149"
  go-hover: "#FFD83D"
  go-disabled: "#E8D27A"
  lamp-ready: "#3DBE6B"
  lamp-missing: "#FFCB05"
  lamp-failed: "#FF8A8A"
typography:
  display:
    fontFamily: "\"Pixelify Sans\", \"Noto Sans Thai\", \"Leelawadee UI\", system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.1
  body:
    fontFamily: "\"Atkinson Hyperlegible Next\", \"Noto Sans Thai\", \"Leelawadee UI\", system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  mono:
    fontFamily: "\"Atkinson Hyperlegible Mono\", \"Noto Sans Thai\", \"Leelawadee UI\", system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.4
  verdict:
    fontFamily: "\"Atkinson Hyperlegible Next\", \"Noto Sans Thai\", \"Leelawadee UI\", system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.35
  greeting:
    fontFamily: "\"Pixelify Sans\", \"Noto Sans Thai\", \"Leelawadee UI\", system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.25
  empty-title:
    fontFamily: "\"Pixelify Sans\", \"Noto Sans Thai\", \"Leelawadee UI\", system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: 1.1
  label:
    fontFamily: "\"Atkinson Hyperlegible Next\", \"Noto Sans Thai\", \"Leelawadee UI\", system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.4
  meta:
    fontFamily: "\"Atkinson Hyperlegible Mono\", \"Noto Sans Thai\", \"Leelawadee UI\", system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  dialogue: "12px"
  nameplate: "6px"
  tag: "6px"
  field: "10px"
  ask: "28px"
  bubble: "12px"
  bubble-tail: "4px"
  row: "8px"
spacing:
  gap-8: "8px"
  gap-12: "12px"
  gap-16: "16px"
  gap-20: "20px"
  gap-28: "28px"
  thread: "720px"
  box: "640px"
  bubble: "520px"
  index: "400px"
components:
  dialogue-box:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.dialogue}"
    padding: "16px 20px"
    width: "{spacing.box}"
  nameplate:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.nameplate}"
    padding: "4px 10px"
  state-label:
    backgroundColor: "{colors.cited-ground}"
    textColor: "{colors.cited-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.nameplate}"
    padding: "2px 10px 4px"
  citation-tag:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.lens}"
    typography: "{typography.mono}"
    rounded: "{rounded.tag}"
    padding: "0 6px"
  question-bubble:
    backgroundColor: "{colors.user}"
    textColor: "{colors.on-shell}"
    typography: "{typography.body}"
    rounded: "{rounded.bubble}"
    padding: "10px 16px"
    width: "{spacing.bubble}"
  ask-button:
    backgroundColor: "{colors.go}"
    textColor: "{colors.ink}"
    rounded: "{rounded.ask}"
    padding: "0"
    height: "56px"
    width: "56px"
  ask-button-hover:
    backgroundColor: "{colors.go-hover}"
  ask-button-disabled:
    backgroundColor: "{colors.go-disabled}"
    textColor: "{colors.mark-line}"
  message-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "14px 16px"
    height: "56px"
  menu-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.row}"
    padding: "10px 8px 10px 30px"
  shell-button:
    backgroundColor: "transparent"
    textColor: "{colors.on-shell}"
    rounded: "{rounded.field}"
    padding: "0 14px"
---
# Poke Monopoly Rules Helper — Design Direction (v2)

## Concept

"Rulebook Pokédex."

A handheld Pokédex you ask about Poke Monopoly's rules. The red device frames a calm screen; the rule guide answers in Gen-1 dialogue boxes, and every rule it quotes carries the same number as its entry in the rulebook index, so a player (or an examiner watching the demo) sees at a glance what the rulebook backs and what it doesn't.

Direction: Retro-futurism / Y2K, adapted to the late-1990s Pokémon handheld: molded Pokédex-red plastic instead of chrome, a pale Game Boy LCD screen instead of neon on black, pixel display type only for nameplates and menus, and a hyperlegible face for every rule sentence. No gradients, glows or chrome.

Changed from v1: replaced. "The Town Map guide" (sea blue #1b5680, land green, sand signposts, system-ui) did not read as Pokémon, and its answer states shared similar warm stamps.

Fixed: the five Darius Dan Flaticon portraits (Poké Ball, Pikachu, Psyduck, Ditto, Snorlax) and what each means, and the Poké Ball app mark. No official brand assets exist.

Surfaces:
- Chat (signature): playful device frame, calm readable screen, medium density. The newest answer's verdict line leads.
- Rulebook index (drawer): denser reference, a Pokédex list. The search field and the selected entry lead.

## Color Tokens

Strategy: committed. Pokédex red owns the frame (header and dock, about 30% of the viewport); the screen stays quiet so rule text reads.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--shell` | `#C8102E` | `#8E0C21` | Header and dock frame (the brand accent) |
| `--shell-deep` | `#8E0C21` | `#5E0716` | Hinge line under the header and above the dock; pressed states |
| `--on-shell` | `#FFFFFF` | `#FFFFFF` | Wordmark and labels on the shell (5.88:1) |
| `--on-shell-muted` | `#FFE3E7` | `#FFD0D7` | Secondary shell text (4.87:1) |
| `--bg` | `#EDF4E6` | `#14161B` | Screen ground behind the thread |
| `--surface` | `#FFFFFF` | `#1E2128` | Dialogue boxes, input field, index panel |
| `--ink` | `#1A1C22` | `#E8EAE3` | Body text and the dialogue-box double border |
| `--ink-muted` | `#4B5160` | `#A7ADB8` | Secondary text (7.94:1 on white; 7.14:1 dark) |
| `--line` | `#C7CFBE` | `#343843` | Hairlines on the screen |
| `--accent` | `#C8102E` | `#FF5A6E` | Brand only: frame, app-mark ring, active index section |
| `--accent-deep` | `#8E0C21` | `#C8102E` | Accent hover and pressed |
| `--go` | `#FFCB05` | `#FFCB05` | The Ask button only, with ink text (11.19:1); 3.87:1 against the red shell |
| `--lens` | `#1F5FBF` | `#7FB0FF` | Interaction: focus ring (2px plus 2px offset), citation tags, links, menu cursor (6.09:1 on white) |
| `--user` | `#2B2F3A` | `#3A3F4C` | Your question bubbles, white text (13.37:1) |

Status colors map to the app's real answer states. Each has a portrait, a label and a color; color is never the only signal.

| State | Portrait | Label | Ink / ground |
| --- | --- | --- | --- |
| Answered from the rulebook | Pikachu | "From the rulebook" | `#1F6B45` / `#E3F3EA` (5.63:1) |
| Not in the rulebook | Psyduck | "Not in the rulebook" | `#7A4E00` / `#FFF1CC` (6.41:1) |
| Unverified sentence inside an answer | — | "No source" tag after the sentence | ink on mark `#FFE08A` (13.2:1), dotted underline `#7A4E00` |
| Rules conflict | Ditto | "Rules conflict" | `#5B3A8C` / `#EEE6F8` (7.13:1) |
| Blocked (scope or hidden information) | Snorlax | "Can't help with that" | `#3E4A5C` / `#E4E8EE` (7.3:1) |
| Failed or withdrawn | Poké Ball (open) | "No answer this time" | `#A3152B` / `#FDE7EA` (6.59:1) |
| Thinking, then streaming | Poké Ball (shaking), then Pikachu | "Reading the rulebook…", then "Answering…" | ink on surface |

Header status lamp: ready `#3DBE6B`, key missing `#FFCB05`, failed `#FF8A8A`, always followed by a text label.

## Typography

All fonts are self-hosted as woff2 in `web/fonts/` with their OFL.txt; the page makes no third-party requests.

- Display: **Pixelify Sans** 600/700 (OFL). Only the wordmark, the speaker nameplate on each box, menu headings, the Ask label and the index title. Never rule text.
- Body: **Atkinson Hyperlegible Next** 400/600/700 (OFL). Rule text is full of look-alike characters ("1–3 AI", "Il", "0/O"), and this face was designed to keep them distinct.
- Mono / numeric: **Atkinson Hyperlegible Mono** 500 (OFL). Citation numbers (`§4.1 L143`) and token counts.
- Script coverage: all three are Latin and Latin-ext. The product promises English only, but Claude may answer in Thai, so every stack ends with `"Noto Sans Thai", "Leelawadee UI", system-ui, sans-serif`.

Scale (px / line height):
- 12 / 1.4: meta (mono) and credits; never smaller.
- 14 / 1.4: nameplates, state labels, tags, menu headings.
- 16 / 1.55: body, questions, menu items (the mobile minimum).
- 20 / 1.35: the answer verdict line (600).
- 24 / 1.25: the welcome greeting (Pixelify 600).
- 32 / 1.1: the wide-screen empty-state title only.

Max line length 64ch. Sentence case everywhere; uppercase only in the 14px Pixelify nameplate (the games' convention), letter-spacing 0.04em.

Formats: thousands separators ("4,483"); line spans with an en dash ("L149–157"); Appendix A tags as `§A`; coins as "20 coins", the rulebook's own unit.

## Shape, Depth, and Motion

- Dialogue box (guide replies): `border: 6px double #1A1C22`, radius 12px, padding 16px 20px, white. The Gen-1 text box.
- Nameplate: a tab on the box's top-left edge, `#1A1C22` fill, white Pixelify 14px, radius 6px 6px 0 0, padding 4px 10px.
- Your question bubble: `#2B2F3A`, white text, radius 12px with 4px on the bottom-right, no border.
- Citation tag: 1px `#1F5FBF` border, radius 6px, white fill, mono 14px `#1F5FBF`; 44px hit area.
- Input field: radius 10px, 2px `#8E0C21` border, white, on the shell.
- Ask button: 56×56px desktop, 48×48px mobile, radius 28px, `#FFCB05`, 2px `#1A1C22` ring, "Ask" in Pixelify 600 16px.
- ▸ menus: no border or fill; 44px rows; the cursor is a CSS-drawn triangle, never a Unicode ▶ glyph that can render as emoji.
- Shadows: none on the screen. Shell only: header `box-shadow: 0 3px 0 #8E0C21`; dock `box-shadow: 0 -3px 0 #8E0C21`.
- Motion: message arrive 200ms `cubic-bezier(.16, 1, .3, 1)` from 4px below; Poké Ball shake 3× over 1.2s `cubic-bezier(.45, 0, .55, 1)` then 0.6s rest; ▼ cursor blink 1s `steps(2)` while streaming; menu cursor move 120ms ease-out; index entry focus outline 160ms ease-out. Under `prefers-reduced-motion: reduce` there is no shake, blink or arrive motion; state text carries everything.
- Icons: the five Darius Dan lineal-colour PNGs as 48px portraits (40px below 768px) in a 2px `#1A1C22` circle; UI glyphs (▸ ▼ ×) drawn in CSS.

## Signature Details

1. **Gen-1 dialogue box** for every guide reply, with the "RULE GUIDE" nameplate and a blinking ▼ at bottom-right while text streams.
2. **▸ menu** for the welcome starters and the "Ask next" follow-ups, like the battle menu: ↑/↓ moves the cursor inside it, Enter asks.
3. **Index numbers**: every quoted rule carries a `§4.1 L143` mono tag that matches its Rulebook index entry exactly, so the source is one tap and one glance away.

## Screens

### Chat: answer (signature screen)

Inside the dialogue box, top to bottom:
1. "RULE GUIDE" nameplate on the box edge, the Pikachu portrait outside the box, and the green "From the rulebook" label beside the nameplate.
2. Verdict line, 20px/600: Claude's first sentence, the direct answer. Example: "Each player starts with 20 coins."
3. Explanation, 16px: the remaining sentences. Each cited sentence ends with its tag(s), such as `§4.1 L143`. An uncited sentence gets the `#FFE08A` mark, a dotted underline and a "No source" tag.
4. "From the rulebook" list, at most 3 rows visible, then "Show 2 more": tag, short label and the quoted line. Example: `§4.1 L143` · Starting kit · "20 coins, the class Starter, 5 Poké Balls and 1 class item."
5. ▸ "Ask next" menu with Claude's three suggested questions.
6. Meta, 12px mono, one line, on Claude answers only: "Haiku 5.5 · 4,381 in · 237 out".

Primary action: open a source (a tag or row opens the Rulebook index on that entry). Secondary: ask next.

Streaming: the box appears with the shaking Poké Ball and "Reading the rulebook…". When text arrives the portrait becomes Pikachu, the label reads "Answering…", text grows behind the ▼ cursor, and "Sources are checked when the answer finishes" sits under it. A checked answer swaps the tags in place; a failed check turns the box into the failed state and keeps the question in the input.

Desktop: thread column at most 720px, centred; your bubbles at most 520px, right-aligned; boxes at most 640px. Mobile: full width minus 16px gutters; the 40px portrait sits above-left of the box.

### Chat: rules conflict

Ditto portrait, violet "Rules conflict" label, one plain sentence: "The rulebook says two different things here, so I can't pick one. Ask the rule owner which applies." Then two columns at 768px and wider, stacked below that:
- Rule A, `§4.6 L250–251`: "Blocks one whole hostile action and is then consumed."
- Rule B, `§A L760–765`: "Blocks the next hostile item/Ability or PvP coin loss; does not stack."

No verdict line. Meta: "Answered locally · no paid request".

### Chat: blocked and failed

- Blocked (Snorlax, slate): one sentence of reason ("I only answer from the written rules, so I can't hand out 100 coins.") and a ▸ menu with one useful redirect ("What do I get for passing Start?"). Meta: "Answered locally · no paid request".
- Failed (open Poké Ball, red): "No answer this time: the Claude request failed." with the reason and a "Try again" button; the question stays in the input. No partial text is left looking verified.

### Welcome

Pikachu portrait and a "RULE GUIDE" box: "Hi! Ask me anything about Poke Monopoly's rules. I only answer from the rulebook and show where each rule comes from. A source shows where a rule is written, not that my reading of it is right." Then a ▸ menu: "How do I play this game?", "How many coins do I start with?", "Explain how combat works.", "Does Price Shield block the whole PvP action?". No category labels.

When the key is missing, the welcome box becomes a failed-state box with the setup steps (put `ANTHROPIC_API_KEY` in `.env` beside `app.py`, restart).

### Header and dock

- Header (56px, red shell): Poké Ball mark, "Rules Helper" wordmark (Pixelify 700 20px) with "Poke Monopoly" above it at 12px. Right side: status lamp with "Ready" or "Key missing", the "Rulebook" button, and "Clear", which sits here, away from Ask, because it erases the conversation.
- Dock (red shell): white input field (48px minimum, grows to 160px) and the yellow Ask button. Desktop only, under the field: "Enter to ask · Shift+Enter for a new line" at 12px `#FFE3E7`. Nothing else lives in the dock.

### Rulebook index (drawer)

At 1024px and wider, a 400px right panel and the thread narrows; below 1024px, a full-screen sheet with "Back to chat", and the thread is inert while it is open. Esc closes and returns focus to the opener.

Head: "RULEBOOK" (Pixelify 600 20px), the "Full document" link, close. The search field comes first. Rows: tag, label and a one-line preview, grouped under 14px section headings in ink-muted. The selected row expands to the full passage with a 2px `#1F5FBF` outline. Provenance at the bottom: "Poke Monopoly — Specification v1.0 · baseline, not playtested".

## Data Visualization

No charts: the app answers questions and nothing is trended or compared over time. The only numbers are token counts (12px mono meta) and line spans (tags).

## Responsive

- Breakpoints: 360, 768, 1024, 1440.
- Below 768: header 56px with the wordmark and the lamp plus "Ready"; 40px portraits; dock 72px total; help line hidden from view (kept in aria-describedby); conflict rules stacked.
- 768–1023: thread at most 720px; the index opens as a full sheet.
- 1024 and wider: the index is a side panel when open.
- 1440 and wider: the thread stays at 720px.
- Only the thread scrolls; header and dock stay fixed; the newest message stays in view unless the user scrolled up.
- Tap targets at least 44px; mobile body text at least 16px.

## Avoid

Found in v1:
- Cards nested in cards (quote cards inside the reply bubble).
- Identical stacked cards (the four labeled starter boxes).
- One pill shape for three meanings (state stamps, citations and follow-ups were all 999px pills).
- Bounce-like easing on the Poké Ball wobble (detector warning).
- A system font with no type contrast.
- Gray text on white below 4.5:1 ("Clear conversation", `#8d9aa1`, 2.89:1).
- Meta text that contradicts itself ("Claude · claude-haiku-5-5 · Local guardrail · no Claude request made").

Standard:
- Purple or blue gradients, glows, chrome and neon.
- Emoji or Unicode glyphs used as icons.
- Uppercase tracked labels beyond the nameplate.
- The same radius or shadow on everything; everything centred.
- Placeholder copy and fake numbers.
- Pixel type for any sentence a player must read.
- Turning the chat into a game board or adding game-state controls.
- Jokes in errors or refusals (the game's own UI rule: plain tone).

Realistic content: use real rulebook facts in examples and mockups, such as "Each player starts with 20 coins" (§4.1 L143), "one human against 1–3 AI opponents" (§1 L27), "Passing Start pays 5 coins" (§4.1 L145), and the Price Shield conflict (§4.6 L250–251 vs §A L760–765).
