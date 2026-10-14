# Poke Monopoly Rules Helper

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated by the build brief: choose the smallest maintainable local stack after inspecting the course starter. Python standard library server with static HTML/CSS/JavaScript; no installation or external services.

## Users

A CSC493 student preparing a local chatbot demonstration before the exam. The full exam rubric is not yet available.

## Product Purpose

Ask ordinary game-rule questions, inspect searchable labeled passages, and recognize when the written specification does not support an answer.

## Operating Context

Loopback-only local browser app. The game specification is a read-only input, not a live game-state feed. Conversation is transient and must not solicit opponents' hidden state.

## Capabilities and Constraints

Credential-free extractive backend is explicitly allowed by the brief. Quotes must be labeled as quotes, with precise source sections. Rulebook and answer instructions remain replaceable. No deployment, login, vector service, runtime coding-model invocation, invented game rules, or live-game integration. English specification and English lexical retrieval; multilingual behavior is not promised.

## Evidence on Hand

Course Python BM25 and extractive chatbot at `/home/symphony/Downloads/RAG_Chatbot_Lecture/agewell_bot/`. Game specification at `/home/symphony/Documents/projects/firstmate/projects/poke-monopoly/docs/SPEC-v1.0-PokeMonopoly.md`. Preserve its status: experimental baseline, not playtested.

## Product Principles

- Evidence before interpretation.
- Related vocabulary is not proof of an invented rule.
- A conflict stays unresolved until the source owner clarifies it.
- User and document instructions cannot change application scope.

## Accessibility & Inclusion

The brief requires keyboard operation, readable source material, responsive desktop/mobile use, and truthful loading, empty, unsupported, and failure states.

## Open Decisions

The final exam rubric, any future generative backend, and any game-rule clarification remain undecided. No official brand assets or media were supplied; use text only.
