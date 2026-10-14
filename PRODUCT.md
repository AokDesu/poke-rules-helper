# Poke Monopoly Rules Helper

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Python standard-library server with static HTML/CSS/JavaScript; no application packages or build step. Explicit Offline mode needs no external service. Explicit Live mode calls Claude's Messages API server-side using claude-haiku-5-5.

## Users

A CSC493 student preparing a local chatbot demonstration before the exam. The full exam rubric is not yet available.

## Product Purpose

Ask ordinary game-rule questions, inspect searchable labeled passages, and recognize when the written specification does not support an answer.

## Operating Context

Loopback-only local browser app. The game specification is a read-only input, not a live game-state feed. Conversation is transient and must not solicit opponents' hidden state.

## Capabilities and Constraints

Credential-free extractive lookup and deliberately selected Claude explanations share the deterministic retriever. Quotes and generated explanations have distinct labels, precise source navigation, and honest unresolved states. Rulebook and local screening instructions remain replaceable; the live safety instruction is server-side code. No deployment, login, vector service, runtime coding-account invocation, invented game rules, or live-game integration. English lexical retrieval; multilingual behavior is not promised.

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

The final exam rubric and game-rule clarifications remain undecided. The approved generative model is claude-haiku-5-5; a usable user API key and genuine paid verification are prerequisites for claiming live readiness. No official brand assets or media were supplied; use text only.
