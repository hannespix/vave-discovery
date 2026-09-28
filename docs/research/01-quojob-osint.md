# QuoJob – OSINT-Recherche

Stand: 28. September 2026. Quellen am Ende.

## 1. Was QuoJob ist

- Browserbasierte **All-in-One-Agentursoftware** (PSA/ERP für Agenturen):
  Projektplanung, CRM, Zeiterfassung, Ressourcenplanung, Faktura,
  Buchhaltung, Controlling, HR – modular buchbar.
- Hersteller **QuoTec GmbH**, Ratingen (gegründet 2004, Software am Markt
  seit ca. 2003). Ursprünglich als betriebswirtschaftliche Standardsoftware
  für Werbeagenturen entwickelt (Gründerin Marion Wagenfeld).
- Betrieb wahlweise **gehostet** (Rechenzentrum Gunzenhausen) oder
  **On-Premise** auf eigenem Server.
- Über **450 Kunden**, u. a. Axel Springer, keko, ERGO, peoplegrapher;
  Zielgruppe Werbe-, Design-, Event-, PR-Agenturen, laut Fortes auch
  Architektur- und Beratungsunternehmen.
- Selbstbild: „Betriebssystem für kreative Agenturen", kein „digitaler
  Flickenteppich" aus Insellösungen.

## 2. Eigentümer und Richtung

- **27. Februar 2025:** Übernahme von QuoTec durch **Fortes** (Den Haag),
  PSA/PPM-Anbieter im Portfolio von **Main Capital Partners** (seit 2021).
  Dritte Akquisition von Fortes. Isa Said (CEO/Eigentümer seit 2022) bleibt.
- Strategische Begründung von Fortes: Agentur-Vertikal stärken, eigene
  PSA-Lösung **Milestones** in Deutschland ausrollen, europäischer
  Marktführer werden.
- **Februar 2026:** Umbenennung in **Fortes QuoJob**. Website wandert nach
  fortesquojob.com.
- Kritische Lesart: 20 Jahre organisch gewachsenes Produkt trifft
  PE-getriebene Konsolidierung. Roadmap und Preise werden künftig in den
  Niederlanden entschieden. Typischer Moment, in dem Kunden Alternativen
  prüfen – oder selbst bauen.

## 3. Funktionsumfang und USP

Kernbereiche laut Hersteller: CRM, Personal- und Ressourcenplanung,
Projektmanagement, Marketing-Retainer, Zeiterfassung, Controlling,
digitale Rechnungsverarbeitung, digitale Buchhaltung, Mobile App.

Der eigentliche USP steckt nicht im Projektmanagement, sondern in den
**Gruppen- und Backoffice-Modulen** (siehe `02-quojob-module-preise.md`):

- Mandantenmanagement (mehrere autonome Firmen in einer Installation,
  gemeinsame Kontakte/User, buchhalterisch getrennt)
- Währungsmodul mit automatischem EZB-Kursabgleich
- Mehrsprachigkeit DE/EN/FR/NL inkl. Zeitzonen je Mandant
- FiBu-Export: DATEV, Lexware, Diamant, SAP, DATEV Unternehmen online
- Retainer-Abrechnung, wiederkehrende Leistungen
- Exchange-Sync (beidseitig), Media-Abwicklung
- REST-API auf JSON-RPC-Basis (Einrichtung nur mit QuoTec-Admin, 2 h)
- OCR-Belegerkennung per KI (seit ca. 2024)
- Drei Lizenzstufen: Power User (alles inkl. Controlling), Non Power User
  (kein HR/Controlling/FiBu, kann keine Jobs anlegen), MyTime (nur Zeit)

## 4. Was Nutzer sagen

**Positiv (wiederkehrend):**
- Zeiten buchen ist einfach und schnell.
- Sonderwünsche werden in die Software eingebaut; Support freundlich.
- Viele Insellösungen abgelöst, alles in einem System.
- Für Controlling und Reporting stark.

**Negativ (wiederkehrend) – fast ausschließlich UX:**
- Bedienung „manchmal nicht selbsterklärend, versteckt und unübersichtlich".
- Einstellungen nicht auf den ersten Blick ersichtlich.
- Zu viele Schritte bis zum Ziel; manche Funktionen zu starr.
- Neuanwender von der Funktionsfülle überlastet; Einarbeitung braucht Zeit
  und Schulung.
- Kosten für kleinere Agenturen spürbar.
- Support nicht immer sofort verfügbar (einzelne Stimmen).
- dasauge-Forum (älter): explizite Abratung – zu teuer, Service werde nach
  Vertragsschluss schlechter. Einzelmeinung, aber deutlich.

**Einordnung:** Kleine Stichproben (OMT: 13 Bewertungen; Google: 28
Bewertungen, Ø 4,3/5). Viele Zitate auf Herstellerseiten sind kuratierte
Testimonials. Die Kritik zielt auf **Oberfläche, Wege, Starrheit** – nicht
auf fehlende Funktionen. Das ist die eigentliche Lücke.

## 5. Was moderne SaaS anders machen

Muster aus Vergleichen (trusted, OMR, Papierkram, agentursoftware-vergleich):

| Muster | Beispiele |
|---|---|
| Onboarding in Minuten, kein Kick-off-Tag | MOCO, helloHQ, awork |
| Transparente Preise pro Kopf | MOCO, helloHQ |
| Budgetstatus für alle sichtbar, auch Junioren | Die Agenturverwaltung |
| KI in Zeit- und Belegerfassung | Die Agenturverwaltung, MOCO |
| Integrationen statt Alleskönner (1.000+ Apps) | Die Agenturverwaltung |
| Kapazitäts-/Ressourcenpläne für komplexe Projekte | Troi, Teamleader Orbit |
| Ausgelegt auf große, standortübergreifende Netzwerke | Troi, Teambox |

QuoJob hat nachgezogen: OCR per KI, neue App, neuer Kalender, neue
Oberfläche, angekündigtes **QuoJob 5**. Die Wahrnehmung „alt und
umständlich" hält sich trotzdem.

## 6. Preislogik

Kein Pauschalpreis, individuelles Angebot. Bausteine aus dem öffentlichen
Konfigurator (Details in `02`):

- Serverlizenz 108 €/Monat (Pflicht)
- Power User 24 €, Non Power User 8 €, MyTime 4 € (jeweils pro Nutzer/Monat)
- Module 14–108 €/Monat je Modul
- Dienstleistungen: Programmierer 148 €/h, Onlineschulung 680 €,
  Kick-off 1.360 €, Integrationstag 1.360 €
- Beispiel OMR: 600 €/Monat für eine All-in-One-Konfiguration inkl. Hosting;
  Kaufvariante 11.340 € + 20 % Wartung/Jahr

**Überschlag für VAVE** (eigene Schätzung, ~100 Nutzer, Gruppen-Module):
1.500–2.000 €/Monat → **20–25 T€/Jahr**. Das ist die Messlatte für jede
Eigenentwicklung – in Lizenz + Betrieb + Haftung + Pflegezeit gerechnet.

## Quellen

- https://fortesquojob.com/de/ (Produktseite, Module)
- https://fortesquojob.com/de/faire-preisgestaltung/ (Konfigurator)
- https://fortesquojob.com/de/agentursoftware-app/
- https://quojob.de/pressemitteilung/ (Übernahme durch Fortes, 27.02.2025)
- https://www.fortesgroup.com/en/about-fortes/news/fortes-acquires-quotec-and-expands-to-the-german-psappm-software-market/
- https://www.the-playbook.de/de/firmen/quotec/
- https://www.agentursoftware-guide.de/marktuebersicht/quojob/
- https://omr.com/de/reviews/product/quojob
- https://www.omt.de/online-marketing-tools/fortes-quojob/
- https://trusted.de/quojob
- https://www.campixx.de/tool/agentur-management/quojob/
- https://www.hostpress.de/blog/quojob-softwarelosung-fur-agenturen/
- https://dasauge.de/forum/tipps_tricks/e4225
- https://trusted.de/agentursoftware
- https://www.omt.de/online-marketing-tools/quojob/alternativen/
- https://www.papierkram.de/aktuelles/agentursoftware/
- https://www.agentursoftware-vergleich.com/
- https://troi.de/vergleich/
