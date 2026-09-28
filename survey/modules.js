// Datenbasis der Umfrage. Einzige Quelle für Karten, Wünsche und Rollen.
// Preise: €/Monat netto laut QuoJob-Konfigurator (09/2026); 0 = in Lizenz enthalten.
// Wird von index.html per <script src="modules.js"> geladen – kein fetch, damit
// die Umfrage auch direkt aus dem Dateisystem (file://) läuft.

window.VAVE_DATA = {
  respondent: "Tobias",

  groups: {
    alltag: "Alltag",
    projekt: "Projekt",
    finanzen: "Finanzen",
    gruppe: "Gruppe",
    anbindung: "Anbindung"
  },

  modules: [
    { id: "kalender",     group: "alltag",    price: 0,   name: "Kalender & Termine",            desc: "Termine, Tagesplanung, Teamkalender" },
    { id: "zeit",         group: "alltag",    price: 0,   name: "Zeiterfassung",                 desc: "Stunden buchen, Soll-Ist, Urlaub und Krankheit" },
    { id: "kontakte",     group: "alltag",    price: 24,  name: "Kontakte & Akquise",            desc: "Kunden, Ansprechpartner, Serienmails, Dokumente" },
    { id: "korrespondenz",group: "alltag",    price: 14,  name: "Korrespondenz",                 desc: "Briefe und E-Mails auf dem eigenen Briefbogen" },
    { id: "bizdev",       group: "alltag",    price: 24,  name: "Business Development",          desc: "Pitches und Auftragschancen bewerten" },
    { id: "suche",        group: "alltag",    price: 14,  name: "Volltextsuche",                 desc: "Suche über Dateien, Dokumente, Termine" },

    { id: "pm",           group: "projekt",   price: 24,  name: "Projektmanagement Pro",         desc: "Aufgaben, Boards, Gantt, Drag & Drop" },
    { id: "ressourcen",   group: "projekt",   price: 0,   name: "Ressourcenplanung",             desc: "Kapazitäten und Auslastung im Team" },
    { id: "media",        group: "projekt",   price: 52,  name: "Media-Abwicklung",              desc: "Schaltungen, Streu- und Kostenpläne" },

    { id: "angebote",     group: "finanzen",  price: 0,   name: "Angebote & Rechnungen",         desc: "Kalkulation, Faktura, E-Rechnung" },
    { id: "controlling",  group: "finanzen",  price: 0,   name: "Controlling & Reports",         desc: "Projektrentabilität, Auswertungen" },
    { id: "op",           group: "finanzen",  price: 14,  name: "Offene Posten & Mahnwesen",     desc: "Zahlungseingänge, Mahnlauf" },
    { id: "liquiditaet",  group: "finanzen",  price: 24,  name: "Liquiditätsplanung",            desc: "Kosten und Erlöse vorausschauen" },
    { id: "fibu",         group: "finanzen",  price: 68,  name: "FiBu-Schnittstelle",            desc: "Export an DATEV, Lexware, SAP, Steuerberater" },
    { id: "ocr",          group: "finanzen",  price: 52,  name: "Belegerkennung (OCR)",          desc: "KI liest Eingangsrechnungen ein" },
    { id: "retainer",     group: "finanzen",  price: 108, name: "Retainer",                      desc: "Vereinbarte Stunden oder Budgets abrechnen" },
    { id: "wkl",          group: "finanzen",  price: 32,  name: "Wiederkehrende Leistungen",     desc: "Periodische Rechnungen automatisch" },
    { id: "preislisten",  group: "finanzen",  price: 24,  name: "Kundenpreislisten",             desc: "Individuelle Sätze, Rabatte, Zuschläge" },
    { id: "kassenbuch",   group: "finanzen",  price: 32,  name: "E-Kassenbuch",                  desc: "Bargeldvorgänge sauber erfassen" },

    { id: "mandanten",    group: "gruppe",    price: 108, name: "Mandanten",                     desc: "Mehrere Gesellschaften in einem System" },
    { id: "waehrung",     group: "gruppe",    price: 24,  name: "Währungen",                     desc: "Angebote und Rechnungen in Fremdwährung" },
    { id: "sprachen",     group: "gruppe",    price: 24,  name: "Mehrsprachigkeit",              desc: "DE/EN/FR/NL, Zeitzonen je Standort" },
    { id: "hr",           group: "gruppe",    price: 24,  name: "HR Professional",               desc: "Überstunden, Qualifikationen, Personalakte" },

    { id: "app",          group: "anbindung", price: 28,  name: "Mobile App",                    desc: "Zeiten, ToDos, Termine unterwegs" },
    { id: "exchange",     group: "anbindung", price: 52,  name: "Outlook / Exchange",            desc: "Termine beidseitig synchron" },
    { id: "mail",         group: "anbindung", price: 24,  name: "E-Mail-Client",                 desc: "Mails direkt an Jobs und Kontakte hängen" },
    { id: "api",          group: "anbindung", price: 52,  name: "REST API",                      desc: "Andere Tools anbinden" },
    { id: "export",       group: "anbindung", price: 24,  name: "Daten-Export",                  desc: "Reports und Kontakte nach Excel & Co." }
  ],

  // Vorschläge aus dem SaaS-Vergleich (docs/research/01-quojob-osint.md, Abschnitt 5). Kurz, konkret, in Tobias' Sprache.
  wishes: [
    { id: "budget-ampel",   text: "Budget-Ampel pro Projekt, für alle sichtbar" },
    { id: "zeit-5s",        text: "Zeit buchen in 5 Sekunden, auch am Handy" },
    { id: "ki-belege",      text: "KI liest Belege und Stundenzettel" },
    { id: "onboarding",     text: "Neue Leute sind in 10 Minuten drin, ohne Schulung" },
    { id: "kapazitaet",     text: "Auslastung aller Studios live auf einer Seite" },
    { id: "forecast",       text: "Umsatz und Auslastung drei Monate voraus" },
    { id: "dashboards",     text: "Ein Dashboard je Rolle: GF, PM, Kreation, Finanzen" },
    { id: "slack-teams",    text: "Slack- oder Teams-Anbindung" },
    { id: "kundenportal",   text: "Kundenportal für Freigaben und Status" },
    { id: "en-zh",          text: "Oberfläche auf Englisch und Chinesisch" },
    { id: "auto-rechnung",  text: "Rechnung entsteht automatisch aus dem Projekt" },
    { id: "offene-api",     text: "Offene API und Automationen ohne Herstellertermin" },
    { id: "schnell",        text: "Schnelle, aufgeräumte Oberfläche, Dark Mode" },
    { id: "preis-pro-kopf", text: "Transparenter Preis pro Kopf" }
  ],

  roles: [
    { id: "gf",         name: "Geschäftsführung" },
    { id: "pm",         name: "Projektmanagement" },
    { id: "kreation",   name: "Kreation & Design" },
    { id: "tech",       name: "Tech & Development" },
    { id: "finanzen",   name: "Backoffice & Finanzen" },
    { id: "asia",       name: "Studios Asien & Middle East" },
    { id: "freelancer", name: "Freelancer" }
  ],

  frequency: [
    { id: "never",  label: "nie" },
    { id: "rarely", label: "selten" },
    { id: "weekly", label: "wöchentlich" },
    { id: "daily",  label: "täglich" }
  ],

  frictionLabels: [
    "läuft rund",
    "kleine Haken",
    "kostet regelmäßig Zeit",
    "nervt jede Woche",
    "bremst täglich"
  ]
};
