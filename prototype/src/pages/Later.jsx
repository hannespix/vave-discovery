import { CalendarRange, ChartColumn, FileText, Landmark, Calculator } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import '../styles/pages.css';

// Bereiche, über die erst die Auswertung entscheidet – ob, nicht wann. Bewusst ohne Logik (keine Rechnungs-,
// Buchhaltungs- oder Mandantenlogik vor G2) und ohne Vorgriff auf das Zielbild: bauen, zukaufen oder nichts davon.
const modules = [
  { id: 'offers', title: 'Angebote & Rechnungen', Icon: FileText,
    text: 'Ob Angebote und Rechnungen hier entstehen, zugekauft werden oder im bisherigen Werkzeug bleiben, ist offen.' },
  { id: 'accounting', title: 'Buchhaltung & Export', Icon: Calculator,
    text: 'Ob und in welchem Format Daten an die Buchhaltung gehen, klärt sich erst, wenn feststeht, was das Tool übernimmt.' },
  { id: 'entities', title: 'Studios & Gesellschaften', Icon: Landmark,
    text: 'Fünf Studios in vier Ländern: Ob das Tool dafür zuständig ist oder ein bestehendes System das regelt, klären wir mit der Geschäftsführung.' },
  { id: 'resources', title: 'Ressourcenplanung', Icon: CalendarRange,
    text: 'Ob Planung hierher gehört, hängt davon ab, wie das Team heute plant und was dabei fehlt.' },
  { id: 'reports', title: 'Reports', Icon: ChartColumn,
    text: 'Welche Auswertungen wirklich gelesen werden, zeigt die Umfrage – bis dahin keine Berichte auf Verdacht.' },
];

export default function Later() {
  return (
    <>
      <PageHeader eyebrow="Ausblick" title="Nach Klärung">
        <p>Ob und was davon gebaut wird, ist offen: Umfrage und Gespräch entscheiden, ob etwas neu entsteht, zugekauft wird oder beim bisherigen Werkzeug bleibt.</p>
        <p>Deshalb haben diese Bereiche im Prototyp absichtlich keine Funktion.</p>
      </PageHeader>
      <ul className="later-grid" role="list">
        {modules.map(({ id, title, Icon, text }) => (
          <li key={id} className="card later-card">
            <span className="later-card__icon" aria-hidden="true"><Icon size={22} strokeWidth={1.75} /></span>
            <h2 className="later-card__title">{title}</h2>
            <p className="later-card__text">{text}</p>
            <p className="later-card__state"><span className="badge badge-outline">Offen: ob und wie</span></p>
          </li>
        ))}
      </ul>
    </>
  );
}
