# Ergebnisse (Rohdaten — lesen ja, ändern nie)

Exporte aus der Umfrage. Namensschema: `YYYY-MM-DD_<vorname>.json` und `YYYY-MM-DD_<vorname>.md`
(so benennt die Umfrage die Downloads). Beide Dateien hier ablegen.

- Die `.json` ist die Rohquelle (Format `vave-discovery/1`, Schema in `../../docs/survey/results-schema.json`).
- Die `.md` ist Tobias' lesbare Fassung inkl. der Hypothese, die die Umfrage selbst berechnet.
- `example.json` ist erfunden und dient nur `npm run check` und zum Ausprobieren von `/brief`.

Auswerten in Claude Code: `/brief data/results/2026-10-02_tobias.json`, danach `/gate G2`.

Piloten-Runden (M4) heißen `YYYY-MM-DD_pilot-<vorname>.json`.
