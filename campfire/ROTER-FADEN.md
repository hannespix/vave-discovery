# Playing with Fire: der rote Faden (Version 3, Geschichten am Feuer)

> **Für Hannes, Vorbemerkung auf Deutsch.**
> - **Format:** Campfire-Talk bei VAVE, 90 Minuten, auf Englisch. Version 3 liegt zwischen den ersten beiden: der
>   Lagerfeuer-Abend aus Version 1 mit den reicheren Inhalten aus Version 2, aber ohne Spielmechanik (keine Level,
>   keine Save Points, keine Seltenheit). Acht Kapitel, erzählt wie am Feuer.
> - **Board = Bühne:** Alle sehen das Whiteboard. Im Präsentationsmodus kommen nur Karten für das Publikum: je Kapitel
>   die Pixel-Kapitelkarte, das Deck, die Live-Tools und die Mitmach-Bubbles. Keine Notizen, keine Anleitungen, keine
>   Zeitangaben, keine Rahmen-Titelfolien. Nur der Pfad zwischen den Lagerplätzen ist gezeichnet.
> - **PixiNotes dunkel stellen:** Im dunklen Theme liegen Kapitelkarten, Bubbles und Kanban auf Nachtgrund statt in
>   einem weißen Rahmen. Das trägt die Lagerfeuer-Stimmung durch den ganzen Abend.
> - **Du redest frei.** Die Decks tragen die Geschichte; die Sprechernotizen (Taste S) sind Stichworte, kein Skript.
> - **Inhalte:** Begriffe, Jahreszahlen, Gerüchte und Risiken stehen in `shared/lore.js`.
> - **Öffentlich:** Diese Datei liegt in einem öffentlichen Repo und enthält nur, was auch im Vortrag zu hören ist.
>   Klärpunkte und Checkliste stehen in der privaten Notiz.

---

## The story in one breath

**Fire was humanity's first technology; AI might be its latest. Tonight we sit around one fire and tell its story:
how we gathered, the old tales and the rumours, the words people use, how to light your first small fire and keep it
going, how many fires make a camp, the one we lit for VAVE, the smoke to watch out for, and the embers you take
home.**

The arc of the evening is the life of a fire: a spark, kindling, a camp of many fires, smoke, embers. The board shows
it as a trail from camp to camp.

Three promises (minute 3):
1. You'll understand the words people throw around (tokens, agents, MCP, pull requests), explained with booths and
   showrooms, not maths.
2. You'll see real things built by a non-developer, including a tool built for VAVE, and how it came to be.
3. You'll go home with fireplace rules, so nobody gets burnt.

Motifs that carry the evening (light touch, never a game):
- **Every chapter ends with an ember:** one sentence worth taking home.
- **Questions are sticks for the fire:** anybody can throw one in any time, as a bubble on the board.
- **Every campfire has ghost stories.** Ours are true, and each one has a way to keep it away.
- **AGI has been "a few years away" since 1956.**

---

## The evening at a glance

| Clock | Chapter | Agreed chapter | On the board, in this order |
|---|---|---|---|
| 0:00 | **I · The gathering** | – | liquid title *Playing with Fire*, deck *The gathering*, bubbles *One word* |
| 0:07 | **II · Old fires** | Beginner | deck *Old fires*, *Myth or Fact?*, bubbles *Rumours* |
| 0:19 | **III · Words by the fire** | Beginner | deck *Words by the fire*, *Token Oracle*, *Context Circle*, *Words* (30 terms) |
| 0:33 | **IV · Kindling** | Beginner → Casual | deck *Kindling*, *Prompt Forge* |
| 0:50 | **V · Many fires** | Advanced | deck *Many fires*, *Git Time Machine* |
| 1:03 | **VI · A fire for VAVE** | Advanced | deck *A fire for VAVE*, kanban *vave.log: proposals* (the room can move cards; the last column, *Decided by VAVE*, stays empty) |
| 1:15 | **VII · Smoke** | all | deck *Smoke*, *Fireplace Check* |
| 1:23 | **VIII · Embers** | all | bubbles *Side quests*, *Booth Builder*, kanban *Try on Monday*, bubbles *Your questions*, then the deck *Embers* closes the evening |

---

## I · The gathering (0:00–0:07)

**Mood:** dark room, one fire, everyone pulls a chair closer. [⇢ deck *The gathering*, `art/title-fire.svg`]

- **Open with the fire, not with yourself:** "Long before anyone wrote, people sat around a fire and told stories.
  Fire was our first technology. Tonight we talk about what might be the latest one."
- **Who's telling:** farm kid, winery, wine engineer, public administration, 41 repositories
  [⇢ `art/life-strip.svg`, `art/repo-wall.svg`].
  > "I'm not a developer. My day job is in public administration, not in IT. What I am is a translator: I know what
  > the problem feels like, and I've learnt to explain it to a machine."
- **The trail of the evening** [⇢ `art/story-map.svg`]: eight camps, one evening.
- **Three promises** (see above). **Sticks for the fire:** questions any time, as bubbles.
- **Board after the deck:** bubbles *"One word: right now, AI makes me feel …"*. Read three out loud.
- **Ember:** "If he can, you can."

## II · Old fires: AI's history and its rumours (0:07–0:19)

**Mood:** the old tales. Hype is old, mistakes are funny, some myths are true. [⇢ deck *Old fires*,
`art/lore-strip.svg`]

- **Told as one story, not a list:** 1950 Turing asks if machines can think → 1956 a proposal hopes to crack it in
  one summer (the summer took 70 years) → 1966 ELIZA, and people confide in a script → two winters after big
  promises → 1997 Deep Blue, 2016 Move 37 → 2017 the Transformer, the T in GPT → 2022 ChatGPT → 2024 glue on pizza
  → 2025 "vibe coding" gets a name → tonight.
- **Rumours by the fire** [⇢ module *Myth or Fact?*]: the room votes with hands, Hannes reveals. 14 tales, from "the
  first bug was a real moth" (half true) to "AI will replace designers by 2025" (myth).
- **Board after the module:** bubbles *"Which AI rumour have you heard lately?"*
- **Ember:** "Every hype had a winter. Treat 'AGI next year' as a rumour until you see it work."

## III · Words by the fire (0:19–0:33)

**Mood:** the words everybody uses, said plainly, with VAVE's world as the picture. [⇢ deck *Words by the fire*]

Ten words, one sentence each (all 30 live in the module *Words*):
- **LLM:** the know-it-all intern who has seen every booth on Pinterest.
- **Token:** language Lego; that's why "strawberry" was hard.
- **Context window:** the booth footprint; old chat pushes the hero product into storage.
- **Temperature:** the lighting dimmer, from museum showcase to club night.
- **Hallucination:** the render that ignores gravity.
- **RAG:** the material library it checks before answering.
- **Embedding:** the invisible moodboard where similar vibes stick together.
- **Agent:** the project manager who can actually call the carpenter.
- **MCP:** the standard power socket on the fair floor.
- **Open weights / local:** buying the booth system instead of renting it.

Three pictures to keep, each with a live tool:
1. **It guesses the next word** [⇢ *Token Oracle*]: turn up the temperature, watch it get wild.
2. **It only sees what's inside the circle of light** [⇢ *Context Circle*]: the fact walks into the dark, and the AI
   answers "coffee brown" with total confidence.
3. **Give it tools and it can act:** hand the intern a phone, a laser measure and the shared calendar.

- **The landscape, no ranking:** chat, image and video, coding agents, local models. Rankings change faster than this
  talk. **The plan matters more than the logo:** business terms, no training on your data, a signed data processing
  agreement, and the client's NDA decides what may go in at all.
- **Board after the deck:** *Token Oracle*, *Context Circle*, then *Words* (all 30 terms to browse during Q&A).
- **Ember:** "You now speak AI. Not fluently, but enough to order dinner."

## IV · Kindling: your first small fire, and how to keep it going (0:33–0:50)

**Mood:** hands on. Small and useful beats big and impressive. [⇢ deck *Kindling*]

- **Vibecoding** (Karpathy, February 2025, meant for weekend projects): describe the result, let the AI write the
  code, judge by looking at it. Collins made it Word of the Year 2025.
- **One HTML file:** double-click, offline, any laptop, any phone.
- **The recipe** [⇢ *Prompt Forge*]: Who · Goal · Context · Constraints · Done when · Look & feel. Same AI, very
  different fire.
- **Live mini-build (5 min), spatial on purpose:** *"A single HTML file: a top view of a 6 × 4 m booth where I can drag
  a counter, a lounge and an LED wall, and it shows the walking paths."* Fallback: *Booth Builder* in chapter VIII.
- **Three fires, three sizes:** email-checker (tiny) · the VAVE survey (one file, made for a phone) · pixoodle.de (real
  users, own domain).
- **Keeping it going:** the loop Describe → Build → Look → Feedback. Screenshots beat words. That's design work, and
  designers are good at it.
- **AI forgets, files remember:** `CLAUDE.md` / `AGENTS.md` (how we work here), design principles (the CD as rules),
  `STATE.md` (where we are). Every coding AI reads them.
- **Brand in, brand out:** give it your CD and it follows it. **For spaces:** liquid type, letters you pull and burst,
  imagined on an LED wall that reacts to visitors.
- **From phone to production:** a change asked for on the train, reviewed as a pull request, live minutes later.
- **Ember:** "A small fire is still a fire. Taste is what keeps it burning."

## V · Many fires: GitHub, many accounts, many AIs, many repos (0:50–1:03)

**Mood:** one fire is a story; many fires are a camp. Why GitHub is the neutral meeting place where people and
different AIs work together, and how to build like Lego, not monoliths. [⇢ deck *Many fires*, `art/guild-hall.svg`,
`art/remix-map.svg`]

- **GitHub in six words** [⇢ *Git Time Machine*]: repository = folder with memory · commit = a saved version · branch =
  variant B · pull request = client approval round · Actions = safety inspectors · Pages = shop window.
- **One person, one account, many camps:** your personal account joins the VAVE organization. People come and go; the
  work stays with the agency. Teams and roles (read, triage, write, maintain, admin); a freelancer gets one repo, not
  the whole house; bots and AI agents get their own limited keys; `main` only through a reviewed pull request;
  `CODEOWNERS` lets the brand guardian approve design files; secrets live in the vault, never in the code.
- **Many AIs, one workflow:** Claude Code, Codex, Copilot, Cursor and Jules all propose changes as pull requests. Same
  review, same checks; any AI can take the next shift. No lock-in.
- **Many repos, one Lego box (the remix map):** small repos with one job each, and the AI as the courier between them:
  *"Take the mascot from pix-el, adapt it to PixiNotes' grid, note where it came from."*
  - **Pix moves house:** a 16 × 16 mascot from pix-el became a PixiNotes card whose eyes follow your finger.
  - **Liquid letters:** a WebGL experiment was carried file by file into PixiNotes, each file noting its origin.
  - **Audience in, bubbles out:** ideas typed on phones float as bubbles on a slide; later the slide editor moved into
    PixiNotes as one card.
- **House rules for remixing:** one job per repo, note the origin, the same routine everywhere (branch → pull request
  → checks → merge → live check), check the licence before you take.
- **The reveal:** "The board you're looking at is built by a script that an AI wrote. The text goes in through
  PixiNotes' own MCP plug."
- **Ember:** "One fire is a story. Many fires are a camp."

## VI · A fire for VAVE: the making of vave.log (1:03–1:15)

**Mood:** the honest story of one fire, lit for this room. A tool built for VAVE, a draft in testing, not in daily
use. [⇢ deck *A fire for VAVE*, `art/vavelog-quest.svg`]

- **How it started:** a discovery project, a survey as one HTML file and a clickable prototype. Then vave.log was
  built on assumptions and public research, on purpose, as a phase-one draft to be tested with real people.
  > "Every feature in here is a hypothesis until you've used it."
- **How it grew** (from the repository's history, 105 commits, pull requests up to #91): Day 1, an empty repo becomes
  a working app with login and the MCP foundation · Day 2, about 30 pull requests · Day 3, invoices, quotes that turn
  into projects, checks against WCAG 2.2 AA · Week 2, eight milestones around leave and capacity · Weeks 5–6, an audit
  with about 60 findings, and the capacity plan rebuilt after **watching one real user work** · Week 6, group of
  companies, holidays for China, Dubai and Singapore, polish.
- **What the draft can do:** time (timer, approvals, flextime), leave (team calendar, holidays for six countries),
  capacity (heatmap, scenarios, an Excel-style plan), projects, finance (quotes, invoices with e-invoice and DATEV
  export), seven rights templates, English · Deutsch · 中文.
- **How it's built, one picture:** a web app talks to a database with login; everybody only sees what they may see. A
  plug for AI with 68 tools lets an assistant log time or ask "where is it burning?", with exactly the rights of the
  person asking. About 70 test files; every change passes checks before it goes live.
- **The lesson:** the best feature came from watching one real person use it for an hour. Not from a prompt.
- **Where it could go: proposals, not decisions** (agents propose, humans decide), on the board as a kanban the room
  can move:
  - **Now:** AI time entry with a proper consent screen · capacity plan v2 (rates per service, € per phase)
  - **Next:** build-up radar (crews, trucks, hall slots) · fair deadline radar from the technical guidelines ·
    modular stock (frames, LED tiles, furniture) · site reports from the phone · client approvals for render
    variants
  - **Later:** cross-company staffing · multi-currency invoices, only with tax advice
- **Ember:** "The best ideas come from watching, not prompting."

## VII · Smoke: ghost stories that are true (1:15–1:23)

**Mood:** every campfire has ghost stories. Ours are true, and each one has a way to keep it away.
[⇢ deck *Smoke*, `art/bosses.svg`]

| In the smoke | What it does | How to keep it away |
|---|---|---|
| **The Hallucinator** | confident errors | verify, ask for sources, test what it built |
| **The Leaker** | confidential data in the wrong chat | business plan, client NDA first, anonymise, ask |
| **The Key Goblin** | passwords and keys in code | a vault, never in files; let an AI audit your repos, rotate what it finds |
| **The Licence Lich** | fonts, images, code, AI output | own or license it, check tool terms and the client contract, label AI content where required |
| **The Orphan Golem** | tools nobody maintains | every tool has an owner, docs live in the repo |
| **The Lock-in Dragon** | one vendor for everything | pull requests and open formats, so any AI can take the next shift |
| **The Brain Drain** | people stop thinking | AI amplifies taste; keep the taste human |

- **Live:** [⇢ *Fireplace Check*]: six questions about a real task, then green, yellow or red. A rule of thumb, not
  legal advice: the client contract and the NDA always win.
- **The fireplace rules:** no client secrets in consumer chats · keys never live in code · every tool has an owner ·
  ship small, review always · test what matters · respect licences and people · humans decide.
- **Ember:** "Mind the smoke, and the fire stays friendly."

## VIII · Embers: what you take home (1:23–1:30)

**Mood:** the fire is low, the conversation gets honest. [⇢ deck *Embers*]

- **Side quests in space** (board: bubbles, three dots each): concept sprint · fair rules decoder · booth flow test ·
  living LED walls · showroom stories in four languages · modular reuse · build-up radar · pitch prototypes.
- **Booth Builder** (board): place counter, LED wall and lounge, open the doors, watch where people stop. A rule-based
  critic says what a visitor would say. Built in an afternoon; that's the point.
- **Try on Monday** (board: kanban): one small experiment per person, with dummy data.
- **Questions** (board: bubbles): the sticks the room threw into the fire.
- **Last line:**
  > "Fire didn't replace cooks. It made cooking possible. Keep your taste, feed the fire, mind the smoke. Thanks for
  > sitting with me."
