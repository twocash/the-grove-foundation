# 4D Experience Model Reference

> Canonical terminology for Grove Foundation's experience architecture.

## Overview

The 4D Experience Model replaces the MVP terminology (Hub/Journey/Node) with
a more expressive vocabulary that reflects the declarative nature of Grove's
experience architecture.

## Terminology

| Term | Definition | Replaces |
|------|------------|----------|
| **Experience Path** | The declarative route through content | Hub |
| **Experience Sequence** | Ordered collection of experiences | Journey |
| **Experience Moment** | Single interaction point | Node |
| **Cognitive Domain** | Knowledge area for routing | Topic Hub |

## Cognitive Routing

The unified provenance model:

| Field | Description |
|-------|-------------|
| `path` | Experience path taken |
| `prompt` | Active prompt/mode |
| `inspiration` | Triggering context |
| `domain` | Cognitive domain (optional) |

## Usage Guidelines

- Use **full terms** in user-facing documentation
- Use **short labels** (Path, Sequence, Moment, Domain) in code comments
- Use **camelCase** for identifiers: `experiencePath`, `sequenceId`, `momentId`

## Migration Notes

Legacy code may still use old terminology. When displaying provenance:
- Transform `hub` → `domain`
- Transform `journey` → `path` (conceptually, the sequence name)
- Transform `node` → `moment`

---

*4D Experience Model v1.0*