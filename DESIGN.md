---
name: Poke Monopoly Rules Helper
description: A local rule reference with evidence beside the question
colors:
  ink: "#172f35"
  muted: "#496168"
  shell: "#123f48"
  shell-muted: "#bedde0"
  ground: "#edf3f2"
  paper: "#ffffff"
  reference: "#e1eeea"
  line: "#b6cbc7"
  primary: "#195e58"
  primary-hover: "#10463f"
  citation: "#653f8c"
  warning-ink: "#66430c"
  warning-ground: "#fcf0d1"
  error-ink: "#8a262c"
  error-ground: "#ffebea"
typography:
  title:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  section:
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  passage:
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
rounded:
  control: "6px"
spacing:
  small: "8px"
  medium: "16px"
  region: "24px"
  reading: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "0.55rem 0.85rem"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.paper}"
---

# Design System: Poke Monopoly Rules Helper

## Overview

**Creative North Star: "Field-guide evidence"**

An operating surface, not a game simulation or promotional page. A petrol shell, mint reference area, and white reading area separate the jobs. Native web controls and a compact system-sans hierarchy prioritize repeat lookup under ordinary indoor study lighting.

**Key Characteristics:**
- Familiar form and expandable reference list.
- Citation selection opens and focuses the exact evidence.
- Textual state labels accompany every state color.

## Colors

Primary green identifies actions and resolved reference selection. Violet binds quotations to source controls. Ochre marks unresolved rules; red marks operational failures. Cool neutral surfaces separate conversation and reference without shadows.

**The Evidence Rule.** Related navigation never receives the label of a supporting answer citation.

## Typography

One system family for operating controls and reading. The compact title/section hierarchy deliberately follows Operate guidance rather than enlarging headings to satisfy a marketing-page detector. Passage prose uses the passage role; labels and provenance are smaller but retain contrast. Source code notation alone uses monospace. No display typography or licensed game art.

## Layout

A bounded workspace (1376px) uses two minmax columns, with wider conversation and narrower source library. At 850px it becomes one stacked column. At 420px the submit action spans the available width. Source scrolling is bounded to keep the composer usable. Quote prose has a 70ch maximum for surrounding explanation; table rows become labeled definition lists rather than overflowing pipe-delimited text.

## Elevation & Depth

No shadows. Tonal regions and single-pixel divisions carry hierarchy. Focus uses a visible violet outline; selected evidence uses a green outline and pale ground. No decorative blur or motion.

## Shapes

Small, consistent control corners from the control token. Source rows are unboxed disclosures separated by rules. Buttons retain native semantics and at least 44px height.

## Components

Primary buttons have readable hover, active, disabled, and loading states. Text fields have explicit labels, themed caret/selection, length boundaries, and keyboard submission. Source disclosures use native summaries; a citation opens the exact entry, clears conflicting filters, scrolls it into view, and transfers focus. Source-selection color settles once over 180ms only when reduced motion is not requested.

## Do's and Don'ts

- Do retain source labels, line spans, and textual state names.
- Do render source content with safe text nodes and limited formatting.
- Do distinguish operational errors from unsupported rules.
- Don't turn the app into a game board or invent game-state controls.
- Don't hide unresolved rules behind confident-looking success styling.
