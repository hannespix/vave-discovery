# STATE — lebender Zustand (max. 150 Zeilen, wird jede Runde fortgeschrieben)

Stand: Runde r02 · 2026-09-28 · Meilenstein **M1 Umfrage** · nächstes Gate **G0**

## Aktueller Meilenstein
M1 — Umfrage. Die Umfrage (7 Stationen) läuft; `pages.yml` deployt sie bei jedem Merge auf main als Vorschau
(https://hannespix.github.io/vave-discovery/). **Pages zeigt noch den Stand vor r02** (mit Herstellernamen), weil
r02 wegen B2–B4 nicht gemergt ist. Den Link bis zum nächsten Merge nicht verschicken.

## Offene Gates
- **G0** — Kriterien 2/3 erfüllt. Fehlt: Liste der bei VAVE gebuchten Module (bis dahin D-002). Freigabe Hannes ausstehend.
- **G1** — offen. Vor dem Versand an Tobias müssen B1–B4 erledigt sein.

## Blocker
- **B1 · Regel 1 schlägt Zielbild C bei Unwissen vor** (Übernahmeprüfung). „Kenne ich nicht“ senkt `keptBack` wie
  „Brauchen wir nicht“. Ändert eine ROADMAP-Regel → Entscheidung Hannes (Entwurf D-005 in PR #2). Blockiert nur den Versand.
- **B2 · Neutraloption auf dem Handy verdeckt** (r02-Regression; ui-critic hoch, red-team hoch). Unter 941 px liegen
  die Zonen untereinander; bei 390 × 844 liegt „Kenne ich nicht“ unter der Navigation, ab Karte 5 nie zusammen mit der
  Karte sichtbar. Vor r02 lagen alle drei Zonen nebeneinander und waren sichtbar.
- **B3 · Wischen schreibt Antworten** (ui-critic hoch). Senkrechter Wisch auf Zonen-Chips (Station 1) verschiebt
  Karten; auf Reglern (Station 2, 5) setzt er Werte. „nicht bewertet/eingestellt“ lässt sich nicht wiederherstellen.
- **B4 · Kaufen-oder-Bauen kippt unbemerkt** (red-team hoch). Anzeige „Offen“ für 35–65, Regeln greifen bei ≤ 40 (B)
  und ≥ 60 (C); kein sichtbarer Daumen, Pflicht-Tipp; ±28 px neben der Mitte ergibt 40 bzw. 60.

## Offene Entscheidungen (Entwürfe in PR #2)
- **D-004 Basiswechsel** — im Chat entschieden, Eintrag in DECISIONS.md fehlt.
- **D-005 Regel 1 (B1)** — „Kenne ich nicht“ weder behalten noch weg; Mindestzahl bewerteter Finanz-/Gruppen-Karten.
- **Preise auf den Karten** (D-002) · **Budget-Neutraloption** für Schmerzgrenze und Regler (Schema) ·
  **Rollen** (Funktion gegen Standort) · **„Retainer“** als Branchenbegriff behalten? (r02-A)

## Nächste Zwischenziele (Reihenfolge = Priorität; jedes mit DoD)

1. **Handy, Touch und Zugänglichkeit** (r03) — `survey/index.html`, `survey/modules.js`; behebt B2–B4
   DoD: Station 1 bei 360–430 px: aktuelle Karte und alle drei Zonen über den ganzen Stapel gleichzeitig sichtbar und
   ohne Scrollen erreichbar. Scrollen ändert nie eine Antwort (Station 1, 2, 5); „nicht bewertet“ und „nicht
   eingestellt“ lassen sich wiederherstellen; „Rest zu ‚Kenne ich nicht‘“ fragt nach. Keine Station breiter als der
   Bildschirm bei 360–430 px. Station 2: unbewertete Zeilen zeigen keinen Wert, ein Tipp speichert, die Anleitung sagt,
   was zu tun ist (Hannes); das Smiley wird eine abstrakte Reibungslinie (Stilvorgabe). Station 5: gesperrtes „Weiter“
   nennt am Handy, was fehlt; unberührte Regler sind als Regler erkennbar; Kaufen-oder-Bauen-Beschriftung folgt den
   Regelgrenzen, ein Tipp springt nicht unbemerkt über eine Grenze. Ziele ≥ 44 px, Antworttexte ≥ 16 px, Kontrast Text
   ≥ 4,5:1 und Bedienelemente ≥ 3:1, Fokus bleibt nach Enter am Element. Einstieg „ein paar Minuten“ (Hannes).
   Texte in `modules.js` neutral (Steuerbüro, Retainer, Personalverwaltung, wertende Wörter; Wünsche neutral eingeleitet,
   ohne Unterstellung, eine Sache je Wunsch). Verschränkung proportional: ab 14 sortierten Karten ist der
   Backoffice-Anteil im Rest ≤ 50 %. `npm run check` grün; Headless 360/390/430 mit Touch und 1280; Export schema-konform.
2. **Wünsche von Hannes, Teil 2** (r04) — `survey/index.html`
   DoD: Statusleiste: jede erreichte Station per Touch (≥ 44 px), Maus und Tastatur anwählbar, vor und zurück, auch nach
   Reload. „Per E-Mail an Hannes senden“: `.eml` an hannes@pix-el.de mit JSON und Brief als Anhang (`X-Unsent: 1`,
   MIME korrekt), am Handy zusätzlich „Teilen“ mit beiden Dateien, Adresse zum Kopieren. SVG-Animationen: Route zeichnet
   sich beim Einstieg, Finale statt Konfetti; ≤ 300 ms je Interaktion, Sequenzen ≤ 1,5 s, reduzierte Bewegung statisch.
3. **Frage an Tobias** — 3 Zeilen: welche Module gebucht, wie viele Power-/Non-Power-User, API-Modul?
   DoD: von Hannes verschickt; Antwort oder „keine Antwort bis <Datum>“ in DECISIONS.
4. **Test durch eine unbeteiligte Person** — eigenes Handy, Pages-Link, ohne Erklärung
   DoD: < 8 Minuten; Export validiert; Stolperstellen als Liste in „Gelernt“.
5. **Versandpaket und Brief-Probelauf** — Zwei-Zeilen-Anleitung; `/brief data/results/example.json`
   DoD: Datei öffnet auf iPhone-Safari und Android-Chrome; Brief mit Belegen, kein Widerspruch zu `hypothesis.target`.

## Erledigt (letzte 5 Runden, älteres → git log)
- r02: Korrekturen vor dem Versand (PR #3, nicht gemergt). 16 Namen und 28 Beschreibungen generisch, 0 Dreiwortfolgen
  mit dem Herstellertext; Karten reihum über die Gruppen; Mittwort-Umbrüche 311 → 0; Budget ohne sichtbare Vorbelegung;
  `FRONT` = ROADMAP; `hypothesis()` stimmt in 120 Zufallsprofilen mit der ROADMAP überein. ui-critic BLOCK (Mobil 4),
  red-team BLOCK (2 × hoch) → B2–B4. Stilvorgabe von Hannes in `docs/design-principles.md`.
- Basiswechsel (Hannes, 2026-09-28): Upload-Fassung übernommen, Pages-Deploy der gebündelten Einzeldatei (PR #2).
- r01 (alter Katalog, ersetzt): ui-critic FIX, red-team BLOCK (`killCore` auf nicht gebuchten Modulen).
- r00: Repo-Skelett, Umfrage (7 Stationen), Schema `vave-discovery/1`, Recherche 00–06, `check.mjs`, `bundle.mjs`.

## Gelernt (kurz, was künftige Runden wissen müssen)
- Die Kritik an QuoJob ist fast ausschließlich UX/Starrheit → Zielbild A ist Arbeitshypothese, entschieden wird in G2.
- VAVE ist eine Gruppe (DE/CN/AE/SG) → Mandanten/Währung/Sprache sind Kern, nicht Zusatz.
- Kartentexte tragen die Zielbild-Rechnung mit: eine missverständliche Karte verschiebt die Regeln. Texte vor der
  Erhebung einfrieren; neue Namen können messen, was sie vorher nicht maßen (red-team r02: Steuerbüro, Retainer).
- Layout-Korrekturen immer gegen „Karte + alle drei Zonen sichtbar bei 360–430 px“ prüfen: Das Untereinanderlegen der
  Zonen gegen Wortumbrüche hat in r02 die Neutraloption unter die Falz geschoben.
- Prüfungen über alle Stationen laufen lassen: Die Wortbreitenprüfung in r02 deckte nur Station 1, Station 2 wurde überbreit.
- Regler ohne sichtbaren Wert plus Pflicht-Tipp machen die Eingabe zufällig; Beschriftungen müssen den Regelgrenzen folgen.
- Reihum über ungleich große Gruppen bündelt die größte Gruppe am Ende (Finanzen 10 Karten) → proportional verteilen.
- Output-Ordner sind nicht exklusiv: Ergebnisse immer in Git committen.

## Nächste Runde startet mit
`/loop 1` (Handy, Touch und Zugänglichkeit) als r03 auf demselben Branch; PR #3 wird danach r02 + r03 enthalten.
