"""Deterministic lexical passage lookup, not semantic entailment or generation."""
from collections import Counter
from dataclasses import asdict, dataclass
from hashlib import sha256
import json
import math
from pathlib import Path
import re
import unicodedata

ROOT = Path(__file__).resolve().parent


def normalized(text):
    return unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode().lower()


@dataclass(frozen=True)
class Passage:
    id: str
    section: str
    label: str
    text: str
    line_start: int
    line_end: int


def parse_passages(text, sections):
    """Keep exact source spans; a table row includes its column headings."""
    lines = text.splitlines()
    passages, section, heading, subsection = [], "", "", ""
    pending, first, table_header, table_start = [], 0, "", 0

    def flush():
        nonlocal pending
        if pending and section in sections:
            label = f"§{section} · {heading}" + (f" / {subsection}" if subsection else "")
            fact = re.match(r"^(?:(?:-|\d+\.) )?\*\*([^*]+?):\*\*", pending[0])
            if fact:
                label += " / " + fact[1]
            passages.append(Passage(
                f"s{section.replace(' ', '-')}-l{first}", section, label,
                "\n".join(pending), first, first + len(pending) - 1))
        pending = []

    for n, line in enumerate(lines, 1):
        match = re.match(r"^#{2,3} (\d+(?:\.\d+)*|Appendix [A-Z])(?:\.| —)?\s*(.*)", line)
        if match:
            flush()
            section, heading = match.groups()
            subsection, table_header = "", ""
        elif line.startswith("#"):
            flush()
            if line.startswith("### "):
                subsection, table_header = line[4:], ""
            else:
                section = ""
        elif re.fullmatch(r"\*\*[^*]+\*\*", line):
            flush()
            subsection, table_header = line.strip("*"), ""
        elif line.startswith("|"):
            flush()
            if not table_header:
                table_header = line
                table_start = n
            elif not re.fullmatch(r"[| :\-]+", line):
                if section in sections:
                    passages.append(Passage(
                        f"s{section.replace(' ', '-')}-l{n}", section,
                        f"§{section} · {heading}" + (f" / {subsection}" if subsection else "") + " / " + line.split("|")[1].strip(),
                        table_header + "\n" + line, table_start, n))
        elif not line.strip():
            # A colon introduces the following list, even across a blank line.
            # Keep the exact contiguous span so headings cannot replace their rules.
            if pending and pending[-1].rstrip().endswith(":"):
                pending.append(line)
            else:
                flush()
        elif line.startswith("```"):
            flush()
        else:
            # Split sibling named facts, not children of an introductory list.
            if (re.match(r"^(?:-|\d+\.) \*\*[^*]+:\*\*", line) and pending
                    and not (pending[0].rstrip().endswith(":")
                             and not re.match(r"^(?:-|\d+\.) ", pending[0]))):
                flush()
            if not pending:
                first = n
            pending.append(line)
    flush()
    return passages


class Rulebook:
    def __init__(self, data_dir=ROOT / "data"):
        data_dir = Path(data_dir)
        self.policy = json.loads((data_dir / "answer-policy.json").read_text(encoding="utf-8"))
        self.provenance = json.loads((data_dir / "provenance.json").read_text(encoding="utf-8"))
        self.raw = (data_dir / "rulebook.md").read_text(encoding="utf-8")
        digest = sha256(self.raw.encode()).hexdigest()
        if digest != self.provenance["snapshot_sha256"]:
            raise ValueError("Rulebook changed: update provenance.json snapshot_sha256 before starting.")
        self.aliases = {normalized(k): v for k, v in self.policy["aliases"].items()}
        self.stopwords = set(self.policy["question_stopwords"].split())
        self.passages = parse_passages(self.raw, self.provenance["indexed_sections"])
        if not self.passages:
            raise ValueError("No indexed passages. Check indexed_sections in provenance.json.")
        self.docs = [Counter(self.tokens(p.label + " " + p.text)) for p in self.passages]
        self.lengths = [sum(d.values()) for d in self.docs]
        self.average = sum(self.lengths) / len(self.lengths)
        frequency = Counter(term for doc in self.docs for term in doc)
        self.idf = {t: math.log(1 + (len(self.docs) - n + .5) / (n + .5)) for t, n in frequency.items()}
        self.topics = {}
        self.topic_terms = set()
        for passage in self.passages:
            local = passage.label.rsplit(" / ", 1)[-1].split(" · ", 1)[-1]
            named = re.findall(r"\*\*([^*]+?):\*\*", passage.text)
            subject = re.match(r"(?:The )?([A-Za-z][A-Za-z -]*?)\s+(?:has|have|is|are)\b", passage.text)
            topic = set(self.tokens(local + " " + " ".join(named)))
            if subject:
                topic.update(self.tokens(subject[1]))
            self.topics[passage.id] = topic
            # Overviews and decision/evaluation tables remain searchable, but
            # their prose does not define the gameplay concept vocabulary.
            if passage.section in self.policy["rule_sections"]:
                self.topic_terms.update(topic)
                self.topic_terms.update(self.tokens(passage.label.split(" / ", 1)[0]))
        self.ambiguities = []
        for note in self.policy["ambiguities"]:
            evidence = []
            for selector in note["evidence"]:
                found = [p for p in self.passages if p.section == selector["section"]
                         and selector["contains"] in p.text
                         and selector.get("label_contains", "") in p.label]
                if len(found) != 1:
                    raise ValueError(f"Ambiguity {note['id']} requires exactly one matching evidence passage per selector.")
                evidence.extend(found)
            self.ambiguities.append((note, evidence))

    def tokens(self, text):
        result = []
        for word in re.findall(r"[a-z0-9]+(?:_[a-z]+)*", normalized(text)):
            if word in self.stopwords:
                continue
            word = self.aliases.get(word, word)
            if word.endswith("s") and len(word) > 3 and not word.endswith(("ss", "us")):
                word = word[:-1]
            result.append(self.aliases.get(word, word))
        return result

    def search(self, query, limit=30):
        terms = set(self.tokens(query))
        if not query.strip():
            return self.passages[:limit]
        if not terms:
            return []
        scored = []
        for index, doc in enumerate(self.docs):
            score = sum(self.idf[t] * doc[t] * 2.5 / (doc[t] + 1.5 * (.25 + .75 * self.lengths[index] / self.average))
                        for t in terms if t in doc)
            if score:
                scored.append((score, index))
        scored.sort(key=lambda item: (-item[0], item[1]))
        return [self.passages[i] for _, i in scored[:limit]]

    def source(self, passage):
        return {**asdict(passage), "document": self.provenance["title"]}

    def result(self, status, passages=(), related=(), note=None):
        return {
            "status": status, "backend": self.policy["backend"],
            "message": self.policy["messages"][status], "note": note,
            "quotes": [{"text": p.text, "citation": p.id} for p in passages],
            "citations": [self.source(p) for p in passages],
            "related": [self.source(p) for p in related],
        }

    def answer(self, question):
        if not isinstance(question, str) or not question.strip():
            raise ValueError("Enter a rule question.")
        if len(question) > self.policy["max_question_length"]:
            raise ValueError(f"Keep questions to {self.policy['max_question_length']} characters.")
        plain = normalized(question)
        # Defense in depth only: this backend cannot execute or obey user/document text.
        if (re.search(r"\b(ignore|override|forget|disregard|bypass)\b.{0,100}\b(instruction|rule|system|previous|scope)", plain)
                or re.search(r"\b(invent|pretend|roleplay|jailbreak|developer mode|system prompt)\b", plain)):
            return self.result("boundary")
        if (re.search(r"\b(show|reveal|list|tell|expose|infer|guess|give)\b", plain)
                and re.search(r"\b(opponent|enemy|other player|rng|seed|deck order)\b", plain)
                and re.search(r"\b(hidden|secret|inventory|holding|holds|hand|seed|order)\b", plain)):
            return self.result("private")
        terms = set(self.tokens(question))
        for note, evidence in self.ambiguities:
            if set(note["all_terms"]) <= terms and set(note["any_terms"]) & terms:
                return self.result("ambiguous", evidence, note=note["note"])
        # Query framing is not a rule concept. Derive actors from grammatical
        # position and source names, not a blacklist of particular actor words.
        framing = {t for t in terms if t.endswith("ly")}
        for match in re.finditer(
                r"\b(?:can|could|may|should|do|does|did|will|would)\s+"
                r"((?:a|an|the|each|every|my|your)\s+)?(\w+)\s+(\w+)", plain):
            actor = set(self.tokens(match[2]))
            if (not actor & self.topic_terms
                    and (match[1] or match[2] in self.stopwords or match[2].endswith("s"))):
                framing.update(actor)
        relation = re.match(r"\s*what\s+(\w+)\s+(\w+)", plain)
        following = set(self.tokens(relation[2])) if relation else set()
        if relation and (relation[2] in self.stopwords or following & self.idf.keys()):
            framing.update(self.tokens(relation[1]))
        for match in re.finditer(r"\b(?:is|are|was|were|been)\s+(\w+ed)\s+(?:in|at|with)\b", plain):
            framing.update(self.tokens(match[1]))
        if plain.lstrip().startswith("if "):
            state = re.search(r"\b(?:is|are)\b[^,;?]*\b(\w+)\s*\??$", plain)
            if state:
                framing.update(self.tokens(state[1]))
        qualifier = re.search(r"\b(?:at|on|in)\s+(\w+)\s*\??$", plain)
        if qualifier and not set(self.tokens(qualifier[1])) & self.topic_terms:
            framing.update(self.tokens(qualifier[1]))
        meaningful = terms - framing
        hits = self.search(" ".join(sorted(meaningful)), 30)
        # A novel mechanic/asset is not supported by matching familiar resources.
        if not meaningful or meaningful - self.idf.keys():
            return self.result("unsupported", related=hits[:3])
        focus = meaningful & self.topic_terms
        quantity = re.search(
            r"\bhow\s+(?:many|much)\s+(.+?)(?=\b(?:do|does|did|can|could|may|is|are|was|were|has|have)\b|[?]|$)",
            plain)
        facets = set(self.tokens(quantity[1])) - framing if quantity else set()
        direct = bool(re.match(r"\s*(?:can|could|may|should|do|does|did)\b", plain))
        evidence = []
        for passage in hits:
            body = set(self.tokens(passage.text))
            context = body | set(self.tokens(passage.label))
            local = self.topics[passage.id]
            # A table names a particular entity; a generic Ball match cannot
            # select every Ball type or a class that merely receives that item.
            if passage.text.startswith("|") and not local <= meaningful:
                continue
            anchored = bool(local & meaningful)
            if not anchored:
                parent = set(self.tokens(passage.label.split(" / ", 1)[0]))
                anchored = bool(facets and parent & focus and facets <= body)
            if (not anchored or not focus or not focus <= context
                    or not facets <= body or direct and not meaningful <= context):
                continue
            evidence.append(passage)
        if not evidence:
            return self.result("unsupported", related=hits[:3])
        source_ids = {p.id for p in evidence}
        for note, sources in self.ambiguities:
            if source_ids & {p.id for p in sources}:
                return self.result("ambiguous", sources, note=note["note"])
        # A bounded evidence set, not a winning overview section. Keep the
        # retriever's order; no second score or paid selection step.
        return self.result("extracts", evidence[:3])
