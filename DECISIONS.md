# DECISIONS — Entscheidungslog

Nur Menschen schreiben hier. Agenten liefern Vorschläge nach `docs/brief/` oder als Kommentar in STATE.md.
Format: fortlaufende Nummer, Datum, Entscheider, Entscheidung, Grund, was sie kippen würde.
Änderung einer Entscheidung = neuer Eintrag, der auf den alten verweist. Nichts wird gelöscht.

---

## D-001 · 2026-09-28 · Hannes · Kein Nachbau vor der Befragung
**Entscheidung:** Es wird kein Prototyp-Code geschrieben, bevor Gate G2 ein Zielbild festlegt.
**Grund:** VAVE ist eine internationale Gruppe; ein Nachbau von QuoJob wäre ein ERP mit Steuer- und
Buchhaltungsrelevanz. Die Nutzerkritik an QuoJob betrifft fast ausschließlich UX. Erst messen, dann bauen.
**Kippt, wenn:** Tobias ein anderes, klar umrissenes Problem nennt, das nichts mit QuoJob zu tun hat.

## D-002 · 2026-09-28 · Hannes · Annahme zu gebuchten Modulen
**Entscheidung:** Bis VAVE die gebuchte Modulliste bestätigt, gilt `"assumedBooked": true` in
`docs/survey/modules.json` als Arbeitsannahme. Module mit `assumedBooked: false` werden in der Umfrage
trotzdem gezeigt (Zone „Miss“ braucht Kandidaten).
**Grund:** M1 soll nicht auf eine E-Mail warten.
**Kippt, wenn:** die Liste kommt → Katalog anpassen, Eintrag D-00x.

## D-003 · 2026-09-28 · Hannes · Umfrage als Einzeldatei
**Entscheidung:** `survey/index.html` ist eine Datei ohne Build und ohne externe Abhängigkeiten.
**Grund:** Wird per Link/Datei an einen Geschäftsführer geschickt; muss auf jedem Gerät sofort laufen,
darf keine Daten an Dritte senden, Ergebnis bleibt lokal (JSON-Download).
**Kippt, wenn:** Mehrpersonen-Modus mit zentraler Sammlung nötig wird (dann G1-Verzweigung).

---

## Vorlage

## D-0xx · JJJJ-MM-TT · Entscheider · Titel
**Entscheidung:**
**Grund:**
**Kippt, wenn:**
**Bezug:** (Gate, Brief, vorheriger Eintrag)
