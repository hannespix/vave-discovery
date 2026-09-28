# Umfrage – Konzept

Ziel: In 6–7 Minuten die drei Eckpunkte **Pain Points, Anforderungen,
Budget** einsammeln – und zwar so, dass das Ergebnis direkt als
Vibecoding-Brief nutzbar ist. Zielperson: Tobias Geisler, Designer,
Geschäftsführer, wenig Zeit, hoher Anspruch an Oberflächen.

## Leitidee

Die Umfrage ist als **Weg durch eine Ausstellung** aufgebaut – VAVEs
eigenes Metier. Oben läuft eine Route mit Stationen; jede Station ist ein
Raum mit genau einer Aufgabe. Keine Formularseiten, keine Radiobuttons.

## Stationen

| # | Station | Aufgabe | Bedienung | Liefert |
|---|---|---|---|---|
| 0 | Eingang | Kontext, Dauer, Start | ein Button | – |
| 1 | Sortieren | QuoJob-Bausteine als **Kartenstapel**, eine Karte nach der anderen, in drei Zonen: **Brauchen wir** / **Brauchen wir nicht** / **Kenne ich nicht** | Karte in Zone ziehen, Zone antippen oder Tasten 1/2/3; Karte in Zone antippen → zurück in den Stapel; „Rest zu ‚Kenne ich nicht'" | Must-haves, Ballast, Wissenslücken |
| 2 | Reibung | Für jeden behaltenen Baustein: *Wie oft bremst er?* | Regler 0–4 mit animiertem Gesicht | Pain Points, priorisiert |
| 3 | Wünsche | Was fehlt heute? Vorschläge aus modernen SaaS + eigene | Chips: einmal tippen = wäre schön, zweimal = unverzichtbar | Nice-to-haves vs. Must-haves |
| 4 | Rollen | Wer nutzt QuoJob wie oft? | Segmentierte Steuerung je Rolle | Wo der Hebel liegt (A vs. C) |
| 5 | Budget | Heutige Kosten, Schmerzgrenze, Bauen vs. Kaufen | drei Regler, „weiß ich nicht" | Budgetrahmen, Haltung |
| 6 | Zauberstab | Eine Sache ändern; eine Sache, die nie passieren darf | zwei Textfelder | Vision und Leitplanke |
| 7 | Ergebnis | Zusammenfassung, Zielbild-Hypothese, Export | Download JSON + Brief, Kopieren | Rohdaten + Prompt |

Bewegung: Karte fliegt in die Zone, nächste Karte steigt aus dem Stapel;
sonst nur Rückmeldung auf Aktionen (Zonen-Puls, Gesicht, Route). Konfetti
am Ende, außer bei `prefers-reduced-motion`.

Warum Stapel statt Kartenwolke: Bei 28 Bausteinen wäre die Wolke höher
als der Bildschirm, die Zonen lägen unter der Falz, Drag müsste scrollen.
Eine Karte zur Zeit hält Zonen und Karte immer zusammen im Blick und
zwingt zu einer Bauchentscheidung pro Baustein.

## Datenbasis

`survey/modules.js` – drei Listen:

- `modules`: Bausteine mit `id`, `name`, `group` (alltag/projekt/finanzen/
  gruppe/anbindung), `price` (€/Monat, `0` = in Lizenz enthalten), `desc`.
- `wishes`: Vorschläge, abgeleitet aus dem SaaS-Vergleich (`docs/research/01-quojob-osint.md`, Abs. 5).
- `roles`: VAVE-Rollen inkl. „Studios Asien & Middle East".

Sobald bekannt ist, welche Module VAVE gebucht hat: Liste eindampfen. Nicht
gebuchte Module gehören nicht in „Sortieren", höchstens in „Wünsche".

## Export-Schema (JSON)

```json
{
  "schema": "vave-discovery/1",
  "exportedAt": "2026-10-02T14:03:00.000Z",
  "startedAt": "2026-10-02T13:56:12.000Z",
  "respondent": "Tobias",
  "sort": { "<moduleId>": "keep" | "drop" | "unknown" },
  "friction": { "<moduleId>": 0 },
  "wishes": { "<wishId>": "nice" | "must" },
  "customWishes": [ { "id": "custom-…", "text": "…", "level": "nice" | "must" } ],
  "roles": { "<roleId>": "never" | "rarely" | "weekly" | "daily" },
  "budget": {
    "current": 1500, "currentUnknown": false,
    "max": 2500, "buildBuy": 50
  },
  "wand": "…",
  "noGo": "…",
  "hypothesis": { "target": "A" | "B" | "C", "reasons": ["…"] }
}
```

`buildBuy`: 0 = lieber kaufen, 100 = lieber selbst bauen. `friction`
enthält nur bewertete Bausteine; nicht bewertete fehlen.

## Markdown-Brief

Wird aus dem Zustand erzeugt (`buildBrief()` in `index.html`). Aufbau:

1. Kopf: Datum, Person, Dauer
2. Behalten – Tabelle Baustein / Reibung (0–4) / Preis, sortiert nach Reibung
3. Weg damit – Liste
4. Kenne ich nicht – Liste (Schulungs- oder Kommunikationslücke)
5. Vermisst – Unverzichtbar, dann Wäre schön (inkl. eigene Wünsche)
6. Rollen – wer nutzt wie oft
7. Budget – Zahlen und Haltung
8. Zauberstab und No-Go wörtlich
9. Zielbild-Hypothese mit Begründungen aus den Antworten
10. „Erster Prompt" – ein Absatz, der die Ergebnisse als Bauauftrag
    formuliert

Der Brief ist Diskussionsgrundlage, kein Urteil. Die Hypothese ist als
solche gekennzeichnet.
