# Graph Report - trouvaille  (2026-11-26)

## Corpus Check
- Corpus is ~7,010 words - fits in a single context window. You may not need a graph.

## Summary
- 118 nodes · 138 edges · 11 communities (7 shown, 4 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.8)
- Token cost: 59,715 input · 0 output

## Community Hubs (Navigation)
- Doc utilisateur et installation
- Manifest de l extension
- CI GitHub Actions
- Barre et chargement du transcript
- Scripts npm
- Test de bout en bout
- Tests unitaires recherche
- Commande raccourci
- Choix techniques (reprise)

## God Nodes (most connected - your core abstractions)
1. `ensureUI()` - 7 edges
2. `run()` - 7 edges
3. `refresh()` - 6 edges
4. `Trouvaille (extension, README FR)` - 6 edges
5. `Trouvaille (extension, README EN)` - 6 edges
6. `steps` - 5 edges
7. `with` - 5 edges
8. `icons` - 5 edges
9. `select()` - 5 edges
10. `get_panel transcript request` - 5 edges

## Surprising Connections (you probably didn't know these)
- `get_panel transcript request` --references--> `load()`  [INFERRED]
  REPRISE.md → src/trouvaille.js
- `Trouvaille (extension, README FR)` --references--> `parseTranscript()`  [INFERRED]
  README.fr.md → src/search.js
- `get_panel transcript request` --references--> `parseTranscript()`  [INFERRED]
  REPRISE.md → src/search.js
- `Trouvaille (extension, README EN)` --references--> `Trouvaille logo (magnifier over audio bars)`  [EXTRACTED]
  README.md → icons/icon.svg
- `Trouvaille (extension, README EN)` --semantically_similar_to--> `Trouvaille (extension, README FR)`  [INFERRED] [semantically similar]
  README.md → README.fr.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Shortcut to toggle bar flow** — reprise_execute_action_shortcut, reprise_main_world, reprise_shadow_dom_bar [INFERRED 0.75]

## Communities (11 total, 4 thin omitted)

### Community 0 - "Doc utilisateur et installation"
Cohesion: 0.10
Nodes (14): Trouvaille logo (magnifier over audio bars), Installation manuelle en mode developpeur, Limites connues, Raccourcis clavier de recherche, Trouvaille (extension, README FR), Known limitations, Manual developer-mode installation, Search keyboard shortcuts (+6 more)

### Community 1 - "Manifest de l extension"
Cohesion: 0.11
Nodes (18): action, default_icon, default_title, background, service_worker, content_scripts, 16, 32 (+10 more)

### Community 2 - "CI GitHub Actions"
Cohesion: 0.12
Nodes (16): jobs, test, name, on, pull_request, push, name, run (+8 more)

### Community 3 - "Barre et chargement du transcript"
Cohesion: 0.32
Nodes (15): ensureUI(), go(), h(), hide(), icon(), item(), load(), markers() (+7 more)

### Community 4 - "Scripts npm"
Cohesion: 0.15
Nodes (13): description, devDependencies, playwright@^1.65.1, license, name, private, scripts, e2e (+5 more)

### Community 6 - "Tests unitaires recherche"
Cohesion: 0.25
Nodes (4): assert, idx, segs, test

### Community 7 - "Commande raccourci"
Cohesion: 0.33
Nodes (6): commands, _execute_action, description, suggested_key, default, mac

## Knowledge Gaps
- **7 isolated node(s):** `Installation manuelle en mode developpeur`, `Raccourcis clavier de recherche`, `Limites connues`, `Known limitations`, `YouTube internal navigation handling` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 68 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_panel transcript request` connect `Doc utilisateur et installation` to `Barre et chargement du transcript`?**
  _High betweenness centrality (0.157) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `ensureUI()` (e.g. with `hide()` and `run()`) actually correct?**
  _`ensureUI()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Installation manuelle en mode developpeur`, `Raccourcis clavier de recherche`, `Limites connues` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Doc utilisateur et installation` be split into smaller, more focused modules?**
  _Cohesion score 0.10476190476190476 - nodes in this community are weakly interconnected._
- **Why does `load()` connect `Barre et chargement du transcript` to `Doc utilisateur et installation`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `run()` (e.g. with `ensureUI()` and `item()`) actually correct?**
  _`run()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Manifest de l extension` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._