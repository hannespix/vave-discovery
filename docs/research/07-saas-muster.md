# SaaS-Muster für den Prototyp – Zeiterfassung, Agentur-Workflows, Gestaltung

Recherche r07 (2026-09-29) auf Wunsch von Hannes: den UI-Entwurf „modern, clean, unkompliziert, mit durchdachten
Workflows“ weiterentwickeln, orientiert an etablierten Produkten, ohne das Rad neu zu erfinden. Grundlage waren
öffentliche Hilfe-Center, Feature-Seiten, Reviews und 25 Produktbilder. Die Bilder wurden nur angesehen, nicht
übernommen: Im Repository liegen keine fremden Screenshots, Texte oder Logos (CLAUDE.md). Alles unten ist in
eigenen Worten zusammengefasst.

**Grenzen bleiben bis G2:** keine Rechnungs-, Buchhaltungs- oder Mandantenlogik, keine Geldbeträge. Budgets gibt es
nur in Stunden.

## 1 · Was sich überall bewährt hat

**Zeiterfassung**
- Drei Wege zur Zeit, jeder für einen eigenen Moment:
  - Timer für laufende Arbeit
  - Nachtragen für Vergessenes (Dauer oder Von–Bis)
  - Wochenraster (Projekt × Tag) für gesammeltes Eintragen
- „Vorwoche übernehmen“ kopiert nur Zeilen, nie Stunden.
- Tempo entsteht durch Kleinigkeiten:
  - zuletzt genutzte Kombinationen als Ein-Klick-Start, „Fortsetzen“ an jedem Eintrag
  - Tastenkürzel, die nur ohne Feldfokus wirken
  - eine einheitliche Dauer-Sprache (5 = 5 h, 1:30, 1,5) mit sofortigem Echo
  - Play-Knopf direkt an der Aufgabe
- Die häufigste Klage in Reviews sind vergessene Timer über Nacht. Übliche Antworten:
  - Hinweis ab einigen Stunden
  - Vorschlag, das Ende auf den Feierabend zu setzen
  - Kappung
  - Überwachung per Screenshot oder Leerlauf-Erkennung lehnen wir ab.
- Die formale Freigabe von Stundenzetteln dient Abrechnung und Lohn. Ohne Fakturierung wären das rund 100 Prüfungen
  pro Woche ohne Abnehmer. Deutsche Agentur-Tools setzen stattdessen auf Soll/Ist-Anzeige und Lückenhinweise.

**Projekte und Aufgaben**
- Projektgesundheit ist überall der Verbrauch gegen ein Stundenbudget, gezeigt als Stufe, Prozent und Rest in Stunden.
  Im Detail kommt ein Burn-up dazu (Ist, Budgetlinie, Prognose gestrichelt).
- Hinweise gibt es nur beim Überschreiten einer Schwelle, sonst entsteht Dauerwarnung.
- „Meine Aufgaben“ über alle Projekte, automatisch gruppiert nach Fälligkeit, mit Zählern.
- Board und Liste sind zwei Ansichten derselben Daten.
- Schätzung gegen gebucht macht Aufwand sichtbar, ohne Planungspflege.
- Tempo:
  - Befehlspalette (⌘K) für Suche und Aktionen, Kontext vorbelegt
  - ein globales „+“
  - Kürzel stehen neben der Aktion, so lernt man sie nebenbei; „?“ zeigt alle
- Auslastung ohne Planung heißt: gebucht gegen Soll je Person und Woche. Ein Ressourcenplaner braucht Pflege und
  gehört nicht in diesen Schritt.
- Internationale Teams:
  - Planungs-Tools lösen Zeitzonen schwach, Kalender- und Zeitzonen-Tools gut: eine Zeile je Ort,
    Arbeitszeit sichtbar, gemeinsames Fenster.
  - Für VAVE heute 3 h (Frankfurt 9–12). Ab 25.10.2026 (Ende der EU-Sommerzeit) sind es 2 h.

**Gestaltung (aus den Produktbildern)**
- Die Navigation ist neutral, ohne farbige Vollfläche. Der aktive Punkt ist leicht getönt, Gruppentitel sind klein
  und grau. Oben stehen genau eine Hauptaktion (oft der Timer) und die Suche.
- Seitenkopf in einer Zeile: Titel und Ansichtswahl links, Kennzahl und Hauptknopf rechts, darunter eine Haarlinie.
- Ruhe entsteht durch Ausrichtung und Weißraum, nicht durch Rahmen um jedes Element:
  - Listen statt Kacheln
  - Tabellen mit Haarlinien
  - leere Zellen als Strich
  - Details im Popover oder Seitenpanel statt auf eigener Seite
- 3–4 Schriftgrößen und 2 Gewichte. Kleine Labels in Versalien mit Laufweite, Zahlen rechtsbündig.
- Neutrals tragen rund 90 % der Fläche. Farbe nur für eine Hauptaktion, Zustände, Heute/Jetzt und kleine Projektpunkte.
- Übergänge dauern 100–200 ms. Löschen geht ohne Rückfrage, dafür mit Rückgängig.

## 2 · Übertragen auf VAVE: Farbrollen

- **Violett** (#641dff) steht für Aktion: eine gefüllte Hauptaktion je Ansicht und den laufenden Timer.
- **Limette** (#e8ffb9) steht für Zustand (aktiv, heute, ausgewählt). Sie erscheint immer als Fläche mit schwarzer
  Schrift, weil sie als Linie auf Weiß kaum sichtbar ist.
- **Schwarz und Grau** tragen die Struktur (Text, Linien, Pillen-Knöpfe mit schwarzem Rand wie auf vave.studio).
- **Koralle** dient nur als Signal für „überzogen“.
- **Projekt- und Studiofarben** erscheinen nur als Punkt.

Versalien stehen nur in Seitentiteln und kleinen Labels, nicht im Fließtext.

## 3 · Auswahl für r07 (bauen)

1. **Klares Gestaltungssystem.** Neutrale Seitenleiste, Farbrollen wie oben, einzeilige Seitenköpfe, Listen mit
   Haarlinien und Bearbeitung am Ort. *Warum:* Das beantwortet die Kritik „generisches Dashboard“ und ist der
   gemeinsame Nenner der besten Referenzen.
2. **Ein Timer, überall sichtbar, Buchen aus der Zeile.**
   - Timer-Pille in Seitenleiste bzw. Kopf.
   - Ein-Klick-Start aus den zuletzt genutzten Kombinationen.
   - Play-Knopf an Aufgaben; Einträge merken sich die Aufgabe.
   - *Warum:* Wer dort bucht, wo er arbeitet, muss weniger nachtragen.
3. **Zeiten in einer Leiste.**
   - Timer und Nachtragen umschaltbar im selben Balken.
   - Ansichten „Liste“ (nach Tag) und „Woche“ (Raster Projekt × Tag, Zellen direkt editierbar, Summen im Kopf).
   - Einheitliche Dauer-Sprache mit Echo.
   - Wochenziel als Ist/Soll-Balken.
4. **Befehlspalette und „+“.**
   - ⌘K bzw. Suche sucht Projekte, Aufgaben und Seiten und führt Aktionen aus (Timer starten, Zeit nachtragen,
     Aufgabe anlegen).
   - „?“ zeigt die Kürzel.
   - *Warum:* 100 Leute, eine Bedienung; Tastatur und Maus gleichwertig.
5. **Projekte als Zeilen, Detail mit Eigenschaften und Burn-up.**
   - Die Liste zeigt die Reststunden als Zahl mit schmalem Balken.
   - Im Detail stehen Eigenschaften als Chips, darunter Tabs (Übersicht, Board, Zeiten).
   - Burn-up mit Prognose „reicht bis KW …“ aus dem Tempo der letzten Wochen. Eigene Ableitung, weil die Referenzen
     dafür Planung voraussetzen.
   - Aufgaben mit Schätzung gegen gebucht.
6. **„Heute“ als eine Spalte.**
   - Timer-Leiste, heutige Einträge mit Tagessumme, eigene Aufgaben nach Fälligkeit.
   - Schmal daneben: Studios jetzt und knappe Budgets.
   - Ein sanfter Hinweis auf Lücken (z. B. gestern unter Soll).

## 4 · Später (nach Tobias' Antwort oder G2)

- Team-Woche gebucht gegen Soll je Person und Studio.
- Terminfinder über Studios (Schieberegler, Hinweis vor der Zeitumstellung, Arbeitszeit je Studio). Chinas
  verschobene Arbeitstage und Feiertage kennt die Demo nicht.
- Kalender-Anbindung (braucht eine echte Integration).
- Favoriten.
- Freigabe von Stundenzetteln: offene Frage an Tobias.

## 5 · Bewusst weggelassen

- Stundensätze, Kosten, Umsatz, Marge, „abrechenbar“, Angebote, Rechnungen, Retainer in Geld, Mandanten (G2).
- Ressourcenplaner mit Buchungen, Gantt, Abhängigkeiten, Automationen.
- Frei baubare Dashboards, Aktivitäts-Feed, Gamification, Pomodoro, KI-Zusammenfassungen.
- Screenshots, Autotracker, Leerlauf-Erkennung über Maus und Tastatur.
- Gestaltung: Maskottchen, Verläufe und 3D-Illustrationen, vollflächig bunte Projektfarben, Ring- und Tortendiagramme,
  schwebende Aktionsleisten, Kopfnavigation mit Icons über Labels, Dunkel als Standard.

## Quellen (Auswahl, abgerufen 2026-09-29)

**Zeiterfassung**
- Harvest: support.getharvest.com (Week view, Reminders, Approvals, Idle timer, Widget)
- Toggl: support.toggl.com (Shortcuts, Timesheet view, Calendar view, Reminders, Approvals)
- Clockify: clockify.me/help (Timesheet, Time entry, Idle detection, Android)
- Everhour: support.everhour.com/article/128-time-tracking-methods
- MOCO: mocoapp.com/funktionen (Zeiterfassung, Übersicht für den Chef)
- awork: support.awork.com/de (Meine erfassten Zeiten, Erinnerungen, Mobile App)

**Projekte und Agentur**
- Productive: help.productive.io (Forecasting in budgets, Time warnings, Time estimates, Timer)
- Teamwork: support.teamwork.com (Project budgets, Health reports, My work, Shortcuts, Quick add, Workload)
- Linear: linear.app/docs (My issues, Creating issues, Search, Favorites)
- Asana: asana.com/resources/asana-tips-my-tasks
- Float: support.float.com (Capacity, Team time zone)
- Harvest Forecast: help.getharvest.com/forecast

**Zeitzonen**
- Slack-Hilfe (Time zone, Work hours)
- Google-Kalender-Hilfe (Arbeitszeiten, Weltuhr)
- worldtimebuddy.com, timezone.io, everytimezone.com

**Gestaltung**
- Produktbilder von Linear, awork, Productive, Harvest, Toggl, Float, MOCO und Notion Calendar (nur angesehen)

**Reviews**
- Capterra (Harvest, Toggl), Software Advice (Clockify), OMR Reviews (MOCO, awork)
