---
name: Poke Monopoly Rules Helper
description: A Pokémon-flavoured rules chat whose guide points at the exact rulebook signpost
colors:
  sea: "#1b5680"
  sea-deep: "#123d5c"
  sea-tint: "#e3eef6"
  sea-text: "#eef5fa"
  sea-muted: "#bcd4e6"
  land: "#edf4e6"
  land-deep: "#dbe8cf"
  land-line: "#c3d4b4"
  paper: "#ffffff"
  ink: "#1b2a33"
  muted: "#4d5f6b"
  sign: "#f4e6bb"
  sign-edge: "#b8933f"
  sign-ink: "#4c3810"
  marker: "#cc3324"
  marker-deep: "#a3261a"
  spark: "#f6c945"
  warning-ink: "#6a4806"
  warning-ground: "#fcefc7"
  conflict-ink: "#57347f"
  conflict-ground: "#efe6fa"
  block-ink: "#2b5059"
  block-ground: "#e0edef"
  error-ink: "#8a262c"
  error-ground: "#ffebea"
  ok: "#7fd3a6"
typography:
  title:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  greeting:
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  body:
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  passage:
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontSize: "0.8125rem"
    fontWeight: 650
    lineHeight: 1.3
  fine:
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  bubble: "14px"
  bubble-tail: "4px"
  control: "10px"
  quote: "12px"
  stop: "4px"
  pill: "999px"
spacing:
  tight: "8px"
  group: "12px"
  message: "20px"
  column: "820px"
components:
  bubble-guide:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.bubble}"
    padding: "0.9rem 1.1rem"
  bubble-trainer:
    backgroundColor: "{colors.sea}"
    textColor: "{colors.sea-text}"
    rounded: "{rounded.bubble}"
    padding: "0.7rem 1rem"
  button-send:
    backgroundColor: "{colors.marker}"
    textColor: "{colors.paper}"
    rounded: "{rounded.bubble}"
    height: "52px"
  button-send-hover:
    backgroundColor: "{colors.marker-deep}"
    textColor: "{colors.paper}"
  chip-signpost:
    backgroundColor: "{colors.sign}"
    textColor: "{colors.sign-ink}"
    rounded: "{rounded.pill}"
    padding: "0.35rem 0.85rem 0.35rem 0.6rem"
  chip-related:
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
  stamp-extracts:
    backgroundColor: "{colors.sea-tint}"
    textColor: "{colors.sea-deep}"
    rounded: "{rounded.pill}"
  topbar:
    backgroundColor: "{colors.sea}"
    textColor: "{colors.sea-text}"
---

# Design System: Poke Monopoly Rules Helper

## Overview

**Creative North Star: "The Town Map guide"**

A rules chat set in the colours of a Pokémon region map. The sea-blue shell frames a pale land-green conversation ground. White guide bubbles carry the answers and sea-blue trainer bubbles carry the questions. Rulebook citations are sand-coloured signposts. A guide portrait from one Flaticon pack (Darius Dan, lineal colour) changes with the answer state. Pokéball means offline quotations, Pikachu means a Live Claude explanation, Psyduck means not established, Ditto means an unresolved conflict and Snorlax means a scope or privacy block. Every state is also named in text.

This is an Operate surface: a familiar chat layout comes first. The world supplies only colour, the portraits, the signpost chips and one signature move, the route map. Tapping a signpost opens the Rulebook map, lights its section stop in Pikachu yellow, and opens and focuses the exact passage.

**Key Characteristics:**
- Conversation thread with a composer docked at the bottom; the newest message is kept in view.
- Sources ride on the answer they support, as signposts with tabular line numbers.
- The rulebook map stays a click away and never dominates the page.
- State stamps (pill headings) and portraits name every answer state; colour never carries it alone.

## Colors

A committed map palette: sea for the shell and the trainer, land for the ground, sand for signposts, town red for the one primary action, and Pikachu yellow for "you are here".

### Primary
- **Map Sea** (#1b5680): top bar, trainer bubbles, focus rings, stop outlines, suggestion labels.
- **Town Marker Red** (#cc3324): the Ask button only. Deepens to #a3261a on hover.

### Secondary
- **Signpost Sand** (#f4e6bb, edge #b8933f, lettering #4c3810): citation chips and their post dot.
- **Pikachu Spark** (#f6c945): current route stop, selected passage outline, map toggle mark, text selection.

### Tertiary (state grounds)
- **Unsupported** amber (#6a4806 on #fcefc7): not-established stamp, uncited Live text, the unverified note.
- **Conflict** violet (#57347f on #efe6fa): conflict stamp and editorial note.
- **Blocked** slate teal (#2b5059 on #e0edef): scope and privacy stamps.
- **Error** red (#8a262c on #ffebea): operational failures and retry.

### Neutral
- **Land** (#edf4e6): conversation ground. Land line (#c3d4b4) draws bubble and dock borders.
- **Paper** (#ffffff): guide bubbles, dock, inputs.
- **Ink** (#1b2a33) for body text; **Muted** (#4d5f6b) for secondary text on white or land.

### Named Rules
**The Evidence Rule.** Only supporting citations wear filled signposts. Related navigation uses the dashed, unfilled chip under "Related passages · not answer citations".

**The One Red Rule.** Town Marker Red belongs to Ask. Errors use the separate error ink/ground pair.

## Typography

**Body Font:** system-ui stack (no web fonts; no third-party requests).

**Character:** A workhorse UI sans with a firm weight ladder, sized for reading rules in a chat.

### Hierarchy
- **Title** (700, 1.125rem, 1.2, -0.02em): app name in the top bar; "Rules Helper" at 450 in Sea Muted.
- **Greeting** (700, 1.25rem, 1.3): the guide's welcome heading.
- **Body** (400, 1rem, 1.55): generated explanations and trainer questions, max about 66ch.
- **Passage** (400, 0.9375rem): quoted rule text in answers; 0.875rem inside the map.
- **Label** (650–700, 0.8125rem): stamps, mode label, stop names, chip text.
- **Fine** (0.75rem): help line, answer meta (backend · method · tokens), credits. Never below 12px.

Line numbers in chips, stop counts and map entries use tabular numerals.

## Layout

Full-height app shell (100dvh): top bar, then a stage. The conversation column is centred at 820px max with clamp(1rem, 3vw, 2rem) gutters. The thread scrolls on its own; the document never scrolls. The dock spans the column under a 1px land-line rule.

Guide messages are a two-column grid: a 44px portrait, then the bubble. Trainer messages align right, at most min(560px, 85%). Messages are 20px apart.

The Rulebook map opens as a right column, minmax(360px, 30vw), at 1024px and wider. Below that it becomes a full-screen sheet, and the conversation is made inert while it is open. At 560px and below the portrait shrinks to 34px, the mode label is visually hidden (its programmatic label stays), the toggle reads "Map" and the long help line is dropped from view (still referenced by aria-describedby).

## Elevation & Depth

Flat, layered by tone and 1px lines. The one shadow is the portrait lift (`0 1px 3px rgba(18, 61, 92, .18)`), which separates the round icon from the land ground. Bubbles, dock and map use borders only.

## Shapes

Speech bubbles use a 14px radius with a 4px tail corner on the speaker's side. Controls and inputs use 10px; quotations 12px. Chips and stamps are pills. Route stops are 4px-rounded squares on a 4px sand rail.

## Components

### Composer dock
- Native select for Answer mode next to a quiet Clear button, which sits apart from Ask. A help line under it states the cost and credential truth for the selected mode (red when the key is missing). Then an auto-growing textarea (52–220px) and the red Ask button.
- Enter sends; Shift+Enter adds a newline. While answering, the mode, question and samples lock, and the button reads "Finding passages…" or "Asking Claude…".

### Thinking message
- A guide bubble with the mode's portrait and a CSS Pokéball. Both wobble like a catch attempt (1.6s, rotate ±16°) when reduced motion is not requested. The message is replaced in place by the answer or the error.

### Answer bubble
- State stamp, the policy message in muted text, then quotations or the generated prose, then sources. A dashed rule precedes the meta line: backend · method · usage.
- Uncited generated chunks are amber `mark`s with an explicit unverified note. Numbered sup references map only to their own chunk.

### Signpost chip
- Sand pill with a dark post dot, the section label, and a divider before tabular "L143" or "L149–157". It opens the map and focuses the passage. The aria-label keeps the full "lines X to Y".

### Rulebook map
- Sticky head (title, Full document, Close map), provenance, search, live count. Passages are grouped under section stops on a vertical route rail with passage counts. Each passage is a native details/summary with its sub-label (or a text preview) and its line span. The current stop fills yellow; the selected passage gets a yellow outline and a pale yellow ground. Escape closes the map and returns focus to the toggle.

### Suggestions
- Inside the welcome bubble: full-width outlined buttons with a small sea label and the question.

## Do's and Don'ts

### Do:
- **Do** name every state in text next to its portrait and stamp colour.
- **Do** keep sources attached to the answer they support and open them in the map, not a modal.
- **Do** keep icons from the one stored Flaticon pack (Darius Dan, lineal colour), local under `web/icons/`, credited in the UI and README.
- **Do** scroll only the thread; keep the top bar and dock fixed.

### Don't:
- **Don't** hotlink icons or load fonts or other assets from third-party hosts.
- **Don't** give related navigation the filled signpost of a supporting citation.
- **Don't** use Town Marker Red for anything but Ask.
- **Don't** turn the chat into a game board or invent game-state controls.
