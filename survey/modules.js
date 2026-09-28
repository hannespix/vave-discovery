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
    { id: "kalender",     group: "alltag",    price: 0,   name: "Kalender & Termine",            desc: "Wer ist wann wo, Termine fürs Team" },
    { id: "zeit",         group: "alltag",    price: 0,   name: "Zeiterfassung",                 desc: "Stunden buchen, Urlaub und Krankentage" },
    { id: "kontakte",     group: "alltag",    price: 24,  name: "Kunden & Kontakte",             desc: "Wer ist wer beim Kunden, Rundmails, Ablage" },
    { id: "korrespondenz",group: "alltag",    price: 14,  name: "Korrespondenz",                 desc: "Briefe und Mails mit unserem Briefkopf" },
    { id: "bizdev",       group: "alltag",    price: 24,  name: "Pitches & Neugeschäft",         desc: "Chancen einschätzen, Pitches nachhalten" },
    { id: "suche",        group: "alltag",    price: 14,  name: "Volltextsuche",                 desc: "Alles finden, egal ob Datei, Mail, Termin" },

    { id: "pm",           group: "projekt",   price: 24,  name: "Aufgaben & Zeitpläne",          desc: "Karten auf Boards schieben, Gantt-Diagramm" },
    { id: "ressourcen",   group: "projekt",   price: 0,   name: "Ressourcenplanung",             desc: "Wer hat wann Luft, wer ist überbucht" },
    { id: "media",        group: "projekt",   price: 52,  name: "Mediaplanung & Einkauf",        desc: "Anzeigen und Spots planen, buchen, abrechnen" },

    { id: "angebote",     group: "finanzen",  price: 0,   name: "Angebote & Rechnungen",         desc: "Von der Kalkulation bis zur E-Rechnung" },
    { id: "controlling",  group: "finanzen",  price: 0,   name: "Controlling & Reports",         desc: "Was ein Projekt am Ende wirklich abwirft" },
    { id: "op",           group: "finanzen",  price: 14,  name: "Zahlungen & Mahnungen",         desc: "Wer uns noch Geld schuldet, nachfassen" },
    { id: "liquiditaet",  group: "finanzen",  price: 24,  name: "Cashflow-Vorschau",             desc: "Geld rein, Geld raus, Monate im Voraus" },
    { id: "fibu",         group: "finanzen",  price: 68,  name: "Übergabe ans Steuerbüro",       desc: "Buchungsdaten fertig für die Buchhaltung" },
    { id: "ocr",          group: "finanzen",  price: 52,  name: "Automatische Belegerfassung",   desc: "Beleg hochladen, Felder füllen sich selbst" },
    { id: "retainer",     group: "finanzen",  price: 108, name: "Retainer",                      desc: "Feste Monatsbudgets und was davon übrig ist" },
    { id: "wkl",          group: "finanzen",  price: 32,  name: "Regelmäßige Rechnungen",        desc: "Jeden Monat dieselbe Leistung abrechnen" },
    { id: "preislisten",  group: "finanzen",  price: 24,  name: "Preise je Kunde",               desc: "Eigene Stundensätze, Rabatte und Aufschläge" },
    { id: "kassenbuch",   group: "finanzen",  price: 32,  name: "Barkasse",                      desc: "Bareinnahmen und Barausgaben festhalten" },

    { id: "mandanten",    group: "gruppe",    price: 108, name: "Mandanten",                     desc: "Alle Firmen der Gruppe unter einem Dach" },
    { id: "waehrung",     group: "gruppe",    price: 24,  name: "Währungen",                     desc: "Anbieten und abrechnen in fremder Währung" },
    { id: "sprachen",     group: "gruppe",    price: 24,  name: "Mehrsprachigkeit",              desc: "Andere Sprachen und Zeitzonen je Studio" },
    { id: "hr",           group: "gruppe",    price: 24,  name: "Personalverwaltung",            desc: "Wer kann was, Überstunden, Personalakte" },

    { id: "app",          group: "anbindung", price: 28,  name: "Mobile App",                    desc: "Unterwegs Zeit buchen, Termine, Aufgaben" },
    { id: "exchange",     group: "anbindung", price: 52,  name: "Outlook-Abgleich",              desc: "Termine in beide Richtungen synchron" },
    { id: "mail",         group: "anbindung", price: 24,  name: "Postfach im System",            desc: "Mails lesen, schreiben, an Projekte hängen" },
    { id: "api",          group: "anbindung", price: 52,  name: "Anbindung eigener Tools",       desc: "Andere Programme greifen auf unsere Daten zu" },
    { id: "export",       group: "anbindung", price: 24,  name: "Export als Tabelle",            desc: "Listen und Kontakte nach Excel rausziehen" }
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
