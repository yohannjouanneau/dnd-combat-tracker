# Campaign Block Import — YAML Format

This document describes the YAML format for importing building blocks into campaigns.

The intended workflow is:
1. Find raw text online (a wiki, an adventure module, your notes…)
2. Ask an LLM to convert it to this YAML format
3. Import the file in the app via **Campaign → Import blocks**

---

## Top-level structure

Either a **single block** (shorthand):

```yaml
name: The Dark Cellar
type: room
description: A damp stone chamber lit by a single guttering torch.
```

Or a **list of blocks**:

```yaml
blocks:
  - name: The Dark Cellar
    type: room
    description: A damp stone chamber.

  - name: Cellar Rat Swarm
    type: combat
    description: A writhing mass of rats disturbed from their nest.
```

---

## Block fields

| Field | Required | Description |
|---|---|---|
| `name` | yes | Title of the block |
| `type` | yes | Block category — see types below |
| `description` | — | Markdown text (use `\|` for multiline) |
| `icon` | — | A single emoji, overrides the type's default icon |
| `tags` | — | List of free-form labels for filtering |
| `checks` | — | Stat checks / skill challenges |
| `items` | — | List of loot items (use with `type: loot`) |
| `countdown` | — | Step tracker (use with `type: environment` or `scene`) |
| `children` | — | Nested sub-blocks — same structure, recursive |

---

## Block types

| Value | Default icon | Use for |
|---|---|---|
| `room` | 🚪 | Locations, areas, rooms |
| `character` | 🧙 | NPCs, allies, villains |
| `combat` | ⚔️ | Encounters, battles |
| `loot` | 📦 | Treasure, rewards, items |
| `environment` | 🌍 | Events, hazards, weather, time-limited effects |
| `scene` | 🎭 | Complex scenes mixing all of the above |

Unknown type values fall back to `scene`.

---

## Stat checks

```yaml
checks:
  - label: Perception check        # required — short title
    skill: Perception              # optional — D&D 5e skill or ability name
    dc: 15                         # required — difficulty class (integer)
    outcomes:                      # optional — branching results
      - label: Success
        description: You notice a tripwire near the door.
      - label: Failure
        description: You walk straight into it.
```

---

## Countdown

A step tracker for environmental changes or event timers.

```yaml
countdown:
  steps: 5                         # required — total number of steps
  labels:                          # optional — one label per step
    - "Guards are unaware"
    - "Guards are suspicious"
    - "Guards are on alert"
    - "Alarm raised"
    - "Reinforcements arrive"
```

---

## Nested children

Children are full blocks defined inline. The app creates them as child blocks under their parent.

```yaml
name: The Sunken Vault
type: room
description: A flooded chamber.
children:
  - name: Vault Guardian
    type: character
    description: An undead knight.
  - name: Vault Treasure
    type: loot
    items:
      - Gold coins (50 gp)
      - Rusty longsword
```

Children can themselves have children (unlimited depth).

---

## Full example

```yaml
blocks:
  - name: The Sunken Vault
    type: room
    icon: 🕯️
    description: |
      A flooded stone chamber. The water is knee-deep and cold.
      *Smell of mildew and old iron.*
    tags: [dungeon, flooded, level-2]
    checks:
      - label: Athletics — wade quickly
        skill: Athletics
        dc: 13
        outcomes:
          - label: Success
            description: Cross in one action.
          - label: Failure
            description: Takes two actions and makes noise.
      - label: Perception — hidden alcove
        skill: Perception
        dc: 15
        outcomes:
          - label: Success
            description: You spot a stone lever behind a pillar.
    children:
      - name: Vault Guardian
        type: character
        icon: 💀
        description: An undead knight bound to this vault for centuries.
        tags: [undead, elite]
      - name: Vault Treasure
        type: loot
        items:
          - Gold coins (50 gp)
          - Obsidian key
          - Potion of water breathing

  - name: Flooding Mechanism
    type: environment
    description: |
      A lever in the alcove controls the water level.
      Each pull raises the water by 1 foot.
    countdown:
      steps: 4
      labels:
        - "Ankle-deep (no effect)"
        - "Knee-deep (difficult terrain)"
        - "Waist-deep (disadvantage on attacks)"
        - "Neck-deep (swimming required)"
```

---

## Notes

- `id` fields are always regenerated on import — no conflicts with existing blocks.
- Unknown fields are silently ignored.
- Internal references (`linkedNpcIds`, `combatId`) are not supported in import files.
