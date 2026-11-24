# Playing with Fire: der rote Faden (Version 2, die Quest)

> **Für Hannes, Vorbemerkung auf Deutsch.**
> - **Format:** Campfire-Talk bei VAVE, 90 Minuten, auf Englisch. Version 2 ist als Pixel-Rollenspiel gebaut: zehn
>   Level, Fachbegriffe als Inventar, Risiken als Bossgegner.
> - **Schwerpunkte:** KI-Geschichte und Gerüchte, GitHub mit Accounts und mehreren KIs, modulares Arbeiten über viele
>   Repos, die Entstehung von vave.log und Beispiele aus VAVEs Welt (Raumkommunikation, Messe, Showroom).
> - **Inhalte:** Alle Begriffe, Jahreszahlen und Gerüchte stehen in `shared/lore.js`. Decks, Module und Board lesen
>   daraus, so stimmt jede Zahl überall.
> - **Board:** liegt als `dist/campfire.pixiboard.json` vor. Auf ein Board ziehen, es kommt als neues Board dazu.
> - **Öffentlich:** Diese Datei liegt in einem öffentlichen Repo und enthält nur, was auch im Vortrag zu hören ist.
>   Klärpunkte und Ampel stehen in der privaten Notiz.

---

## The one-sentence story

**Fire was humanity's first technology; AI might be its latest. Tonight is a quest: ten levels from "press start" to
"new game+". We collect the right items, learn the lore, meet the guild, fight a few bosses, and end at a campfire,
which in every good game is a save point.**

Three promises (minute 3):
1. You'll understand the words people throw around: tokens, agents, MCP, pull requests. Explained with booths, not maths.
2. You'll see real things built by a non-developer, including VAVE's own tool, and how it came to be.
3. You'll leave with fireplace rules, so nobody gets burnt.

The running jokes (use them, they carry the evening):
- **Campfires are save points.** At the end of every level: "Saving game…" and one sentence that sums it up.
- **Every term is an item** with stats: rarity, effect, "watch out".
- **Every risk is a boss** with a weakness.
- **AGI has been "a few years away" since 1956.**

---

## Timeline at a glance

| Clock | Level | Agreed chapter | On the board |
|---|---|---|---|
| 0:00 | **0 · PRESS START** | – | title screen, warm-up bubbles, how to play |
| 0:05 | **1 · CHARACTER SELECT** | – | character sheet, life strip, repo wall |
| 0:11 | **2 · THE LORE** | Beginner | AI history as a timeline, *Myth or Fact?* |
| 0:23 | **3 · THE INVENTORY** | Beginner | *Inventory* (30 terms), *Token Oracle*, *Context Circle* |
| 0:35 | **4 · KINDLING** | Beginner | *Prompt Forge*, live mini-build, tiny-to-real |
| 0:45 | **5 · CRAFTING** | Casual | the loop, memory files, liquid type for LED walls |
| 0:55 | **6 · THE GUILD HALL** | Advanced | GitHub, accounts and roles, many AIs, many repos (remix map), *Git Time Machine* |
| 1:07 | **7 · QUEST LOG: vave.log** | Advanced | making-of timeline, architecture, roadmap proposals |
| 1:17 | **8 · BOSS FIGHT** | all | seven bosses, *Fireplace Check*, fireplace rules |
| 1:25 | **9 · NEW GAME+** | all | side quests for VAVE (dot voting), *Booth Builder*, try on Monday, Q&A |

Questions are side quests: drop a bubble any time, they get picked up at the next save point.

---

## 0 · PRESS START (0:00–0:05)

- **Board:** title screen [⇢ `art/title-screen.svg`], Pix by the fire, the QR code to join (invite link without
  account).
- **Warm-up bubbles:** *"One word: right now, AI makes me feel …"*. Read three out loud.
- **How to play (say it like a game tutorial):**
  > "Ten levels, ninety minutes. Questions are side quests: drop them as bubbles. Campfires are save points. Nobody
  > dies, but some bosses hit hard."
- **Save point:** "Saving game… The room is a campfire now."

## 1 · CHARACTER SELECT (0:05–0:11)

- **Character sheet** (one slide, RPG style):
  - **Class:** Translator (problem → machine)
  - **Origin:** farm kid, winery, wine engineer, public administration
  - **Special skill:** asks good questions at 11 pm
  - **Weakness:** never studied computer science
  - **Inventory:** 41 repositories
- **Life strip** [⇢ `art/life-strip.svg`] and **repo wall** [⇢ `art/repo-wall.svg`].
- **Say:**
  > "I'm not a developer. My day job is in public administration, not in IT. What I am is a translator: I know what
  > the problem feels like, and I've learnt to explain it to a machine."
- **Save point:** "If he can, you can."

## 2 · THE LORE: AI history and rumours (0:11–0:23)

**Goal:** Context and laughter. Hype is old, mistakes are funny, and some myths are true.

- **The timeline** [⇢ `art/lore-strip.svg`, deck *Lore*]:
  - 1950 the imitation game
  - 1956 the summer that took 70 years
  - 1966 ELIZA
  - the AI winters
  - 1997 Deep Blue
  - 2011 Watson
  - 2012 the cat paper
  - 2016 Move 37
  - 2017 "Attention is all you need" (the T in GPT)
  - 2020 GPT-3
  - 2022 ChatGPT
  - 2023 agents and drama
  - 2024 glue on pizza
  - 2025 vibe coding
  - 2026 you are here
- **Myth or Fact?** [⇢ module `myth-or-fact.html`]: The room votes with hands, Hannes reveals. 14 claims, from "the
  first bug was a real moth" (half true) to "a chatbot sold an SUV for one dollar" (half true) to "AI will replace
  designers by 2025" (myth).
- **Lesson:** Every hype cycle had a winter. Treat every "AGI next year" headline as a rumour until you see it work.
- **Save point:** "Hype is old. Glue on pizza is new."

## 3 · THE INVENTORY: what the words mean (0:23–0:35)

**Goal:** The ten words everybody uses, explained with VAVE's world. [⇢ module `inventory.html`: 30 items with pixel
icons, rarity, "in the booth world" and "watch out"]

The must-have items, one sentence each:
- **LLM:** the know-it-all intern who has seen every booth on Pinterest.
- **Token:** language Lego; that's why "strawberry" was hard.
- **Context window:** the booth footprint; old chat pushes the hero product into storage.
- **Temperature:** the lighting dimmer, from museum showcase to club night.
- **Hallucination:** the render that ignores gravity.
- **RAG:** the material library it checks before answering.
- **Embedding:** the invisible moodboard where similar vibes stick together.
- **Agent:** the PM who can actually call the carpenter.
- **MCP:** the standard power socket on the fair floor.
- **Open weights / local:** buying the booth system instead of renting it.

Live play:
- [⇢ `token-oracle.html`]: it predicts the next word; turn up the temperature and watch it get wild.
- [⇢ `context-circle.html`]: the fact walks into the dark, and the AI answers "coffee brown" with total confidence.
- **Landscape, no ranking:** chat AIs (ChatGPT, Claude, Gemini, Mistral, DeepSeek); image and video (Midjourney,
  Firefly, Flux, Runway, Veo, Sora); coding agents (Claude Code, Codex, Copilot, Cursor, Jules); local (Ollama). The
  rankings change faster than this talk. The plan matters more than the logo: business terms, no training on your
  data, a signed data processing agreement, and the client's NDA decides what may go in at all.
- **Save point:** "Inventory full. You now speak AI."

## 4 · KINDLING: your first builds (0:35–0:45) · *Beginner*

- **Vibecoding** (Karpathy, February 2025, meant for weekend projects): describe the result, let the AI write the
  code, judge by looking at it. Collins made it Word of the Year 2025.
- **Beginner rule:** one HTML file. Double-click, offline, any laptop, any phone.
- **Prompt recipe** [⇢ `prompt-forge.html`]: Who · Goal · Context · Constraints · Done when · Look & feel. Same AI,
  very different fire.
- **Live mini-build (5 min), spatial on purpose:**
  *"A single HTML file: a top view of a 6 × 4 m booth where I can drag a counter, a lounge and an LED wall, and it
  shows the walking paths."* Fallback: the finished *Booth Builder* from level 9.
- **Tiny to real:**
  - email-checker: tiny
  - the VAVE survey: one file, made for a CEO's phone
  - pixoodle.de: real users, own domain
- **Save point:** "A small fire is still a fire."

## 5 · CRAFTING: the loop (0:45–0:55) · *Casual*

- **The loop:** Describe → Build → Look → Feedback (screenshots beat words) → Repeat. That's design work, and
  designers are good at it.
- **AI forgets, files remember:** `CLAUDE.md` / `AGENTS.md` (how we work here), design principles (the CD as rules),
  `STATE.md` (where we are). Every coding AI reads them, whichever brand.
- **Give it your CD and it follows it:** the clickable VAVE prototype in violet and lime with Readex Pro.
- **Design wow for spaces:** liquid type, letters you can pull and burst. Imagine it on an LED wall that reacts to
  visitors.
- **From phone to production:** a change requested from the train, reviewed as a pull request, live minutes later.
  19 pull requests in one day on the discovery project.
- **Save point:** "Taste is the real skill."

## 6 · THE GUILD HALL: GitHub, accounts, many AIs, many repos (0:55–1:07) · *Advanced*

**Goal:** Why GitHub is the neutral meeting room where people and different AIs work together, and how to build
modularly: Lego, not monoliths.

**GitHub in six words** [⇢ `git-time-machine.html`]:
- **repository:** folder with memory
- **commit:** save point
- **branch:** variant B
- **pull request:** client approval round
- **Actions:** safety inspectors
- **Pages:** public shop window

**Accounts and roles** [⇢ `art/guild-hall.svg`]:
- **One human, one account, many guilds.** Your personal account joins the VAVE organization. People come and go; the
  repos stay with the agency.
- **Teams and roles:** Design, Build and Finance get the keys they need: read, triage, write, maintain, admin.
- **Outside collaborators:** a freelancer or a client reviewer gets one repo, not the whole house.
- **Bots and apps:** AI agents and robots get their own limited keys and work through pull requests like everybody
  else.
- **Gates:** `main` only through a pull request, with green checks and a review (branch protection).
  `CODEOWNERS`: the brand guardian must approve changes to the design files.
- **Secrets** live in the vault, never in the code.
- **Issues and Projects** are the quest board.
- **Codespaces** is a workshop in the cloud, nothing to install.

**Many AIs, one workflow:** Claude Code, Codex, Copilot, Cursor and Jules all propose changes as pull requests. Same
review, same checks, any AI can take the next shift. That's the antidote to the lock-in dragon.

**Many repos, one Lego box (the remix map)** [⇢ `art/remix-map.svg`]:
- Small repos with one job each: a survey, a whiteboard, a slide editor, liquid type, a pixel brand.
- Pieces travel between them with AI as the courier: *"Take the mascot from pix-el, adapt it to PixiNotes' grid, note
  where it came from."*
- **Examples:**
  - Pix: pix-el → PixiNotes → this talk.
  - Liquid type: liquidtype → PixiNotes and pix-el.
  - Slides: Vibe Studio → PixiNotes.
  - Flame: pixletics → this talk.
  - Survey and prototype: discovery → vave.log.
- **Plugs between repos:** single HTML files that run anywhere (these modules run inside PixiNotes cards), JSON
  exports, and MCP servers.
- **House rules for remixing:** one job per repo, note the origin, same routine everywhere (branch → pull request →
  checks → merge → live check), and check the licence before you take.

**The reveal:** "By the way: the board you've been looking at was built by an AI, through PixiNotes' own MCP server.
I described the quest; it wrote the cards and laid them out." Show `campfire/tools/board.mjs` for ten seconds.

**Save point:** "Guilds beat lone heroes."

## 7 · QUEST LOG: vave.log (1:07–1:17) · *Advanced*

*(filled from the repo history; see the deck* Quest log *and the board frame)*

## 8 · BOSS FIGHT: risks and sensible use (1:17–1:25)

Seven bosses, each with a weakness [⇢ `art/bosses.svg`]:

| Boss | Attacks with | Weakness |
|---|---|---|
| **The Hallucinator** | confident errors | verify, sources, tests |
| **The Leaker** | confidential data in the wrong chat | business plan, client NDA first, anonymise, ask |
| **The Key Goblin** | passwords and keys in code | vault, never in files; let an AI audit your repos, rotate what it finds |
| **The Licence Lich** | fonts, images, code, AI output | own or license it, check tool terms and the client contract, label AI content where required |
| **The Orphan Golem** | tools nobody maintains | every tool has an owner, docs in the repo |
| **The Lock-in Dragon** | one vendor for everything | pull requests and open formats, so any AI can take the next shift |
| **The Brain Drain** | people stop thinking | AI amplifies taste; keep the taste human |

- **Interaction:** [⇢ `fireplace-check.html`]: six questions about a real task, then green, yellow or red. A rule of
  thumb, not legal advice: the client contract and the NDA always win.
- **Fireplace rules:**
  1. No client secrets in consumer chats.
  2. Keys never live in code.
  3. Every tool has an owner.
  4. Ship small, review always.
  5. Test what matters.
  6. Respect licences and people.
  7. Humans decide.
- **Save point:** "Bosses beaten. Rules kept."

## 9 · NEW GAME+: side quests for VAVE (1:25–1:30)

- **Side quests in space** (dot voting, three dots each):
  - concept sprint
  - fair rules decoder
  - booth flow test
  - living LED walls
  - showroom stories in EN / DE / ZH / AR
  - modular reuse
  - build-up radar
  - pitch prototypes
- **Booth Builder** [⇢ `booth-builder.html`]: place counter, LED wall and lounge, open the doors, watch the heat map.
  A rule-based critic says what a visitor would say. Built in an afternoon; that's the point.
- **Try on Monday:** one small experiment per person, with dummy data.
- **Q&A:** pick up the side-quest bubbles.
- **Last line:**
  > "Fire didn't replace cooks. It made cooking possible. Keep your taste, feed the fire, mind the smoke, and save
  > your game. Thanks for sitting with me."
