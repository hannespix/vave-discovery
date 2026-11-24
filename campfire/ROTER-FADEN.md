# Playing with Fire: der rote Faden

> **Für Hannes, Vorbemerkung auf Deutsch.**
> - **Format:** Campfire-Talk bei VAVE, 90 Minuten, auf Englisch. Darum ist alles darunter Englisch: Kapitel, Kernsätze,
>   Sprechtext und Überleitungen.
> - **Bildsprache:** Die Lagerfeuer-Metapher trägt den ganzen Vortrag. Pixel-Art im pix·el-Look (LCD-Grün, Jersey 10, Pix)
>   bildet die Nacht; das Feuer ist die einzige warme Farbe.
> - **Ablauf auf dem Board:** Er ist eine Wanderkarte durch acht Stationen und liegt fertig als PixiNotes-Board
>   (`dist/campfire.pixiboard.json`) vor. Datei auf das Board ziehen: Es kommt als neues Board dazu, deine Boards bleiben
>   unberührt.
> - **Kennzeichnung:** Alles mit ⚑ musst du vor dem Vortrag klären. Alles mit [⇢ …] liegt fertig in `campfire/`.

---

## The one-sentence story

**Fire was humanity's first technology. AI might be its latest. Both give warmth and light, both need fuel, tending and
fireplace rules. And both burn the house down if nobody watches them.**

The talk walks the audience from the *spark* (what an LLM actually is) to the *forge* (how real software gets built
with it). It ends at the *embers*: what VAVE can start on Monday. On the way, Hannes is the living proof: a former
winemaker working in the public sector, not a trained developer, who shipped 40+ repositories in a year.

Three promises to the audience (say them in minute 3):
1. You will understand what these tools *are*, without maths.
2. You will see real things built by a non-developer, including things built *for you*.
3. You will leave with fireplace rules: how to use this without getting burnt.

---

## Timeline at a glance

| Clock | Station | Agreed chapter | Mode | On the board |
|---|---|---|---|---|
| 0:00–0:05 | **00 · Gather round** | – | warm-up | campfire scene, Pix, QR, mood bubbles |
| 0:05–0:12 | **01 · Who's by the fire** | – | story | life strip (6 pixel frames), repo wall |
| 0:12–0:25 | **02 · The spark** (what an LLM is) | Beginner | explain + play | deck *Spark*, module *Token Oracle*, module *Context Circle* |
| 0:25–0:40 | **03 · Kindling** (your first builds) | Beginner | demo | deck *Kindling*, module *Prompt Forge*, tiny-tool demos |
| 0:40–0:55 | **04 · Feeding the fire** (the loop) | Casual | demo | deck *Kindling* part 2, VAVE prototype, liquid type |
| 0:55–1:10 | **05 · The forge** (what, how, where: GitHub) | Advanced | explain + demo | deck *Forge*, module *Git Time Machine*, agent team, MCP reveal |
| 1:10–1:20 | **06 · Smoke signals** (risks, sensible use) | all | discuss | deck *Smoke*, module *Fireplace Check*, rule card |
| 1:20–1:25 | **07 · Embers** (chances for VAVE) | all | vote | idea bubbles with dot voting, "Try on Monday" kanban |
| 1:25–1:30 | **08 · Open fire** (Q&A, goodbye) | all | talk | question parking lot, resources, thank-you |

Questions are welcome at any time: anyone can drop a question bubble on the board, and Hannes picks them up at the end
of each station. Buffer: stations 03 and 05 can each give back 3 minutes if the room wants to talk longer.

---

## 00 · Gather round (0:00–0:05)

**Goal:** Turn a meeting room into a campfire circle. Lower the threshold before anyone thinks "this is a tech talk".

- **Board:** the animated campfire scene, with Pix sitting by the fire [⇢ `art/campfire-scene.svg`]. A QR code to the
  board (PixiNotes: Live → invite link / QR). A bubble card asks *"One word: right now, AI makes me feel…"*.
- **Interaction:** everybody adds one word. Read three of them out loud: one excited, one sceptical, one funny.
- **Say:**
  > "Welcome to the campfire. No slides that read themselves, no maths. Just stories, a few live experiments, and
  > questions whenever they come up. If you have one, drop it as a bubble, I'll pick it up."
- **Bridge:** "Before we talk about fire, let me tell you who's holding the matches."

## 01 · Who's by the fire (0:05–0:12)

**Goal:** Credibility through honesty. "If I can do it, you can."

- **Life strip**, six pixel frames [⇢ `art/life-strip.svg`]: hippie parents → childhood on a farm → the farm becomes a
  winery → viticulture engineer → wine crisis, into public administration → vibecoder.
  ⚑ Check the wording; it is your life. The order follows the six story pictures on pix-el.de.
- **Repo wall** [⇢ `art/repo-wall.svg`]: one pixel tile per repository, coloured by kind (work tools, family business,
  play, VAVE). The numbers: **41 repositories**. The biggest one has **323 test files**. **PixiNotes** went from v1.0 on
  day one (14 July 2026) to **440+ milestones** in four months.
- **Say:**
  > "I'm not a developer. I never studied computer science. My day job is vocational training in the green professions.
  > What I am is a translator: I know what the problem feels like, and I've learnt to explain it to a machine."
- **Show** (pick one, 60 seconds): `pix-el.de` (your brand, the hopping Pix), or `email-checker` ("Pix & fertig":
  a tiny tool that fixes e-mail typos).
- **Bridge:** "So what *is* this machine I'm talking to? Let's look at the spark."

## 02 · The spark: what an LLM really is (0:12–0:25) · *Beginner*

**Goal:** Demystify. Three mental models are enough to use these tools well.

1. **It predicts the next word.** An LLM is a very well-read autocomplete. It doesn't *know*, it *continues*. That's
   why it can sound confident and still be wrong.
   [⇢ module `token-oracle.html`: type the start of a sentence, see the candidate next words as burning pixel bars,
   turn up the "temperature" and watch the fire get wild.]
2. **It only sees what's inside the circle of light.** The context window is the campfire circle: whatever is in the
   light (your prompt, your files, the chat so far), the model can use. Everything in the dark doesn't exist for it.
   Long chats push old stuff into the dark. This is why good projects keep their memory in *files*.
   [⇢ module `context-circle.html`: messages walk into the light; when the circle is full, the oldest step back into
   the dark.]
3. **With tools, it can act.** Give it a search engine, a code runner, GitHub or your whiteboard (via **MCP**, the
   "USB-C port for AI tools") and a chat model becomes an *agent*: it plans, does, checks.
- **Landscape, one slide, no ranking:** Claude, ChatGPT, Gemini, Mistral (EU), open models that run on your own
  laptop (Ollama). For work it matters more *which plan* you use (business terms, no training on your data) than which
  logo.
- **Deck:** [⇢ `decks/spark.html`] 8 slides.
- **Bridge:** "Enough theory. Let's light something."

## 03 · Kindling: your first builds (0:25–0:40) · *Beginner*

**Goal:** Show that a first useful tool is one conversation away, and how to ask well.

- **Vibecoding, defined:** Andrej Karpathy coined the term in February 2025: *"fully give in to the vibes… and forget
  that the code even exists."* You describe the result, the AI writes the code, you judge by looking at it.
- **Beginner rule:** one HTML file. Double-click, it works, offline, on any laptop or phone. No server, no install.
- **The prompt recipe** [⇢ module `prompt-forge.html`]: *Who is it for · Goal · Context · Constraints · Done when ·
  Look & feel.* Show a weak prompt and a strong one side by side. Same AI, very different fire.
- **Live mini-build (5 min):** ask the AI for a single HTML file live, e.g. *"a pixel-art campfire that crackles and
  grows when you click"*. ⚑ Keep the pre-built result [⇢ `art/campfire-scene.svg`] as a fallback if Wi-Fi fails.
- **Examples, tiny to real:**
  - `email-checker`: tiny, single file, pixel branding.
  - The **VAVE survey** (`hannespix.github.io/vave-discovery/?test`): one HTML file; Tobias filled it out on his
    phone. ⚑ Only open it with `?test`, otherwise it counts as a real answer.
  - `pflanzenbestimmung` / `pflanze-bw.de`: a real tool with real users and its own domain.
- **Deck:** [⇢ `decks/kindling.html`] part 1.
- **Bridge:** "The first fire is easy. Keeping it burning is the craft."

## 04 · Feeding the fire: the loop (0:40–0:55) · *Casual*

**Goal:** The real skill isn't prompting, it's *iterating* with taste. That's design work, and designers are good at it.

- **The loop:** Describe → Build → **Look** → Give feedback (screenshots beat words) → Repeat. Small steps, each one
  visible.
- **AI forgets, files remember:** a `CLAUDE.md` (project memory), a design-principles file (your CD as rules), a
  `STATE.md` (where we are). Show the VAVE discovery repo: the rules *are* the design brief.
- **Give it your CD and it follows it:** the clickable VAVE prototype (`/vave-discovery/prototyp/`) in violet and
  lime with Readex Pro, built from the brand tokens. ⌘K command palette, `t` starts the timer.
- **From phone to production:** a change requested from the train, reviewed as a pull request, live minutes later.
  On 29 September 2026, 16 pull requests went live on this project in one day.
- **Design wow:** `liquidtype` (`hannespix.github.io/liquidtype/`): type "VAVE", pull the letters, hold to burst.
  Physics and shaders by a non-developer. ⚑ Not the `/MS/` sub-page.
- **Deck:** [⇢ `decks/kindling.html`] part 2.
- **Bridge:** "Now, how does a hobby fire become a forge that ships real software?"

## 05 · The forge: what, how, where (0:55–1:10) · *Advanced coding*

**Goal:** Explain the professional toolchain in designer language, and show that agents + tests + review make it
reliable.

- **GitHub in six words** [⇢ module `git-time-machine.html`]:
  - **Repository:** a project folder with a perfect memory.
  - **Commit:** a save point with a note.
  - **Branch:** a parallel sketch, the main version stays safe.
  - **Pull request:** a critique round before anything goes live.
  - **Actions:** robots that test and publish on every change.
  - **Pages:** free hosting, the link you send to the client.
- **An agent team, not one chat:** builder, critic, red team, gatekeeper. Each has one job; *agents propose, humans
  decide.* (VAVE discovery: `.claude/agents/`.)
- **Trust comes from checks, not from vibes:** automated browser tests, accessibility audits (13 screens, 0 findings),
  a test suite that runs before every release.
- **Scale stories (one slide):** PixiNotes, 440+ milestones in four months. `vave.log`: projects, time and
  budgets for VAVE in English, German and Chinese, with its own MCP server.
  ⚑ It contains publicly named VAVE people with made-up numbers: clear this with Tobias first, test the login the day
  before, and keep a screen recording as backup.
- **The reveal (big moment):** "By the way: this board you've been looking at all evening was built by an AI, through
  PixiNotes' own MCP server. I described the talk; it wrote the cards and laid them out, and the same script tucked the
  decks and tools inside." Show `campfire/tools/board.mjs` for ten seconds.
- **Where to work:** Claude Code (terminal, web, phone), Cursor / VS Code, GitHub, a database when needed
  (Supabase/Firebase), Pages for hosting.
- **Deck:** [⇢ `decks/forge.html`] 9 slides.
- **Bridge:** "Every fire makes smoke. Let's talk about the smoke signals."

## 06 · Smoke signals: risks and sensible use (1:10–1:20)

**Goal:** Honest, practical, no fear-mongering. Leave the room with rules, not worries.

Seven signals, each with what to do:

| Smoke | What it means | What to do |
|---|---|---|
| **Confidential data** | Client briefs, NDAs, personal data in consumer chats | Business plans only, anonymise, ask before pasting |
| **Secrets** | API keys and passwords end up in code, even in private repos | Keys in a vault / env, never in files; rotate when exposed |
| **Confident errors** | It sounds right, it's wrong | Verify facts, test behaviour, ask for sources |
| **Shipped insecurity** | Logins, databases, prompt injection | Row-level security, reviews, never trust outside text |
| **Rights** | Fonts, images, code licences, real people's photos | Use what you own or what's licensed, credit sources |
| **Orphan tools** | Who fixes it in six months? | Every tool has an owner, docs live in the repo |
| **Lost craft** | People stop thinking | AI amplifies taste; keep the taste human |

- **A true story, anonymised** ⚑ (only if you want it, and only after rotating the keys): *"While preparing this talk,
  an AI audit of my own private repositories found live keys in three of them. Private is not the same as safe."*
- **Interaction:** [⇢ module `fireplace-check.html`]: the room answers five questions about a real task
  ("client data? personal data? public output? who maintains it? reviewed?") and gets green, yellow or red with advice.
- **Fireplace rules for VAVE** [⇢ `art/fireplace-rules.svg`]:
  1. No client secrets in consumer chats.
  2. Keys never live in code.
  3. Every tool has an owner.
  4. Ship small, review always.
  5. Test what matters.
  6. Respect licences and people.
  7. Humans decide.
- **Deck:** [⇢ `decks/smoke.html`] 8 slides.
- **Bridge:** "So where should VAVE light the first fire?"

## 07 · Embers: chances for VAVE (1:20–1:25)

**Goal:** Turn the talk into the room's ideas, voted on.

- **Idea bubbles with dot voting** (three dots each). Seeds:
  - Pitch prototypes clients can click.
  - Exhibition interactives prototyped in days.
  - Internal tools: time, capacity, quotes.
  - Research and synthesis across EN / DE / ZH.
  - Data stories for clients.
  - Generative content inside the brand.
- **"Try on Monday" kanban:** one small experiment per person, e.g. *"rebuild one boring spreadsheet as a single HTML
  file"*.
- **Link to the agreed project** (one sentence, no sales pitch): "Phase one of VAVE's own tool is exactly this: time
  tracking, AI-assisted time entries, capacity planning, built in small visible steps."

## 08 · Open fire: Q&A and goodbye (1:25–1:30)

- Go through the question bubbles. Answer what you can, and park the rest on the kanban with a name.
- **Resources card:** links to the hub page, the decks and modules, the board file.
- **Last line:**
  > "Fire didn't replace cooks. It made cooking possible. Keep your taste, feed the fire, and mind the smoke. Thanks
  > for sitting with me."

---

## Example bank: what to show, and what not to

| Example | Shows | Safe? |
|---|---|---|
| `vave-discovery` survey + prototype | their own problem, their CD, agent loop | ✔ survey with `?test` only. Don't show `STATE.md` or `docs/research/` (personal notes, vendor research) |
| `vave.log` | VAVE app, MCP, EN/DE/ZH | ⚑ clear the people data with Tobias first, test the login, have a recording |
| PixiNotes | this board, MCP, 440+ milestones | ✔ |
| `liquidtype` | design wow | ✔ main page only, not `/MS/` |
| `pix-el.de` (+ `/interactive/`) | brand, live audience tool | ✔ live site only, never the repo |
| `email-checker` | tiny tool, 60 s | ✔ with dummy data |
| `pflanzenbestimmung` | real users, own domain | ✔ don't open the deploy workflow file |
| `tankverkauf` | family-winery story, demo mode | ✔ only "Nur ansehen", never log in |
| `thronerush` | pixel game, chiptune made in code | ⚑ check the humour first |
| `pixletics` | voice coach, pixel wordmark | ✔ don't log into Spotify |
| `autotrd` | the scale story (323 test files) | ⚑ one number only, nothing that looks like investment advice |
| Work tools (Berichtsheft, Prüfungen, M1, Plausibilisator …) | – | ✘ employer-internal or personal data, at most an anonymised one-liner ("a database for an authority, 43 automated checks") |

## Prep checklist (day before)

- [ ] Import `dist/campfire.pixiboard.json` into PixiNotes and run the presentation mode once end to end.
- [ ] Open every live link on the venue Wi-Fi (or hotspot). Recordings of `vave.log` and `liquidtype` as backup.
- [ ] Tobias: OK for `vave.log` demo people, OK to mention the project in one sentence.
- [ ] Rotate the exposed keys (see the private note from Claude) before telling the secrets story.
- [ ] Phone ready for the live mini-build; fallback file open in a tab.
- [ ] Clear the mood and question bubbles from the rehearsal.
