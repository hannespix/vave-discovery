# Design-Prinzipien — Maßstab für den `ui-critic`

Gilt für `survey/index.html` (M1) und später für den Prototyp (M3+). Zielperson der Umfrage:
Geschäftsführer einer Designagentur, Handy in der Hand, 5–7 Minuten, urteilt über Ästhetik in
der ersten Sekunde und über Bedienung in der zweiten. Er soll aus dem Bauch antworten können.

Jede Dimension wird 0–10 bewertet. Anker bei 4, 7 und 10. Kein Score ohne Beleg.
PASS ab 8 in **allen** Dimensionen.

## 1 · Tempo — Zeit bis fertig
- **4:** Testperson braucht > 10 Minuten oder fragt zwischendurch „wie viel noch?“
- **7:** 7–8 Minuten, Fortschritt sichtbar, aber ein Screen fühlt sich lang an
- **10:** ≤ 7 Minuten ohne Hektik; jeder Screen hat eine Aufgabe; Fortschrittsanzeige zeigt Rest in Minuten, nicht in Prozent

## 2 · Bauchbedienung — keine Erklärung nötig
- **4:** Ein Screen braucht einen Erklärtext > 1 Satz oder die Testperson sucht den „Weiter“-Knopf
- **7:** Alles selbsterklärend, aber ein Element (z. B. Frust-Slider) wird beim ersten Mal falsch verstanden
- **10:** Jede Interaktion ist beim ersten Sehen klar; Zonen, Slider und Karten erklären sich durch Form, Bewegung und ein Wort; Neutraloption („weiß nicht“) ist immer da und nie versteckt

## 3 · Klarheit & Ästhetik
- **4:** Mehr als zwei Schriftgrößen-Sprünge pro Screen, Farben ohne System, Karten ungleich
- **7:** Ruhiges Layout, klares Farbsystem, aber ein Screen wirkt voller als die anderen
- **10:** Ein Blick genügt: Hierarchie durch Größe und Abstand, max. drei Farben plus Neutrals, viel Weißraum, Typografie mit Fallback-Stack; wirkt wie ein Produkt, nicht wie ein Formular

## 4 · Bewegung — Animation dient, lenkt nicht ab
- **4:** Animationen > 400 ms, Elemente hüpfen ohne Grund, kein `prefers-reduced-motion`
- **7:** Bewegung erklärt Zustände (Karte landet, Zone reagiert), aber eine Animation ist Dekoration
- **10:** Jede Bewegung beantwortet eine Frage („Wo ist meine Karte hin?“, „Zählt das?“); Dauer 150–300 ms, Easing konsistent; animierte SVG-Zonen reagieren auf Nähe; `prefers-reduced-motion` schaltet auf Fades; eine Abschluss-Animation als SVG genau einmal, am Ende

## 5 · Mobil & Touch
- **4:** Drag funktioniert nur mit Maus; Texte < 16 px; horizontales Scrollen
- **7:** Touch-Drag geht, aber Ziele sind < 44 px oder liegen unter dem Daumen des Systems
- **10:** Viewport 390 px ohne Kompromiss; Drag mit Touch, Maus **und** Tastatur (Pfeiltasten + Enter als Alternative zum Ziehen); Trefferflächen ≥ 44 px; Safe-Area beachtet; einhändig bedienbar

## 6 · Zugänglichkeit
- **4:** Kein Fokus-Ring, Kontrast < 4,5:1, Slider ohne Label
- **7:** Kontrast und Fokus okay, aber Drag-Zonen sind für Screenreader stumm
- **10:** Tastatur-Weg für alles, sichtbarer Fokus, `aria-live` für Zonenwechsel, Kontrast ≥ 4,5:1 in Light **und** Dark Mode, Farbe trägt nie allein Bedeutung

## 7 · Vertrauen & Datenhoheit
- **4:** Unklar, wo die Daten landen; externer Request; kein Hinweis vor dem Download
- **7:** Alles lokal, aber der Nutzer erfährt es erst am Ende
- **10:** Erster Screen sagt in einem Satz: „Bleibt auf deinem Gerät, am Ende bekommst du eine Datei.“ Keine externen Referenzen (prüft `npm run check`), Wiederaufnahme nach Reload, Löschen-Knopf

## 8 · Freude — Micro-Rewards
- **4:** Kein Feedback beim Ablegen; Ende ist ein nackter Download-Button
- **7:** Karten reagieren, Ende feiert, aber die Mitte ist Fließbandarbeit
- **10:** Jede Karte, die landet, gibt ein kleines haptisches/visuelles „Ja“; Zwischenstände werden bemerkt („Halbzeit. Läuft.“); Ende belohnt mit Zusammenfassung in drei Sätzen, dann Download; Ton der Texte: knapp, warm, nie kumpelhaft

## Stilvorgabe von Hannes (Chat, 2026-09-28)
Animierte SVG-Animationen findet er schick; Emojis und ähnliches Zeug überall nicht. Daraus folgt für alle Dimensionen:
- Bewegung als animierte SVG-Linien und -Formen, passend und sparsam: Sie erklärt einen Zustand, sie schmückt nicht.
- Keine Emojis, keine Emoji-artigen Gesichter, kein Konfetti.
- Der Einstieg nennt keine Minutenzahl, sondern „ein paar Minuten“.

## Stilvorgabe von Hannes (Chat, 2026-09-29): Weißraum, Lesbarkeit, Barrierefreiheit
„Bitte achte im UI-Design auf genügend White Space, um die Readability zu gewährleisten. Barrierefreiheit. Clean
Design, das typische VAVE-CD beibehalten.“ Gilt für den Prototyp; die eingefrorene Umfrage nur bei Fehlerkorrekturen.
Messbar, jede Unterschreitung deckelt Dimension 3 (Klarheit) bzw. 6 (Zugänglichkeit) bei 7:
- **Weißraum:** Seitenrand ≥ 20 px am Handy; Abschnitte ≥ 56 px auseinander (Desktop ≥ 64 px); Listenzeilen ≥ 12 px
  oben und unten; Abstände nur über die `--space-*`-Tokens in `prototype/src/styles/tokens.css`.
- **Lesbarkeit:** Fließtext ≤ ~65 Zeichen je Zeile, Zeilenhöhe 1,5 (mehrzeilig nie unter 1,4); keine Schrift unter
  13 px; zwei Gewichte (400/600); Versalien nur für Seitentitel und kurze Labels, nie für Sätze.
- **Barrierefreiheit (WCAG 2.2 AA):** Kontrast ≥ 4,5:1 hell und dunkel, sichtbarer Fokus, Ziele ≥ 44 px, Reflow bei
  320 px ohne seitliches Rollen, Textabstände nach 1.4.12 ohne Abschneiden, Farbe nie allein.
- **VAVE-CD:** Schwarz/Weiß, Violett = Aktion und laufender Timer, Limette = Zustand mit schwarzer Kontur, Koralle nur
  „überzogen“; Readex Pro; Pillen mit schwarzer Kontur; Haarlinien statt Kästen; keine Deko, keine neuen Farben.

## Nicht verhandelbar (BLOCK, unabhängig vom Score)
- Externe Referenzen oder Datenabfluss
- Fremdes Branding, kopierte UI-Texte
- Fehlende Neutraloption auf einem Bewertungs-Screen
- Ergebnis-JSON entspricht nicht dem Schema
