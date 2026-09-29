import { CalendarRange, ChartColumn, FileText, Landmark, Calculator } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import '../styles/pages.css';

// Module, die erst nach der Auswertung kommen – bewusst ohne Logik (keine Rechnungs-, Buchhaltungs- oder Mandantenlogik vor G2)
const modules = [
  { id: 'offers', title: 'Angebote & Rechnungen', Icon: FileText,
    text: 'Ob Angebote und Rechnungen hier entstehen oder im bisherigen Werkzeug bleiben, entscheiden wir erst mit den Antworten aus der Umfrage.' },
  { id: 'accounting', title: 'Buchhaltung/Export', Icon: Calculator,
    text: 'Welche Daten die Buchhaltung in welchem Format braucht, ist noch offen – deshalb gibt es hier noch keinen Export.' },
  { id: 'entities', title: 'Mandanten & Währungen', Icon: Landmark,
    text: 'Fünf Studios in vier Ländern: Wie Gesellschaften und Währungen getrennt werden müssen, klären wir zuerst mit der Geschäftsführung.' },
  { id: 'resources', title: 'Ressourcenplanung', Icon: CalendarRange,
    text: 'Wer wann an welchem Projekt arbeitet, planen wir erst, wenn wir wissen, wie das Team heute plant und was dabei fehlt.' },
  { id: 'reports', title: 'Reports', Icon: ChartColumn,
    text: 'Welche Auswertungen wirklich gelesen werden, sagt uns die Umfrage – bis dahin bauen wir keine Berichte auf Verdacht.' },
];

export default function Later() {
  return (
    <>
      <PageHeader eyebrow="Ausblick" title="Nach Klärung">
        <p>Was genau gebraucht wird, klärt gerade die Umfrage.</p>
        <p>Diese Bereiche sind vorgemerkt, haben im Prototyp aber absichtlich keine Funktion.</p>
      </PageHeader>
      <ul className="later-grid" role="list">
        {modules.map(({ id, title, Icon, text }) => (
          <li key={id} className="card later-card">
            <span className="later-card__icon" aria-hidden="true"><Icon size={22} strokeWidth={1.75} /></span>
            <h2 className="later-card__title">{title}</h2>
            <p className="later-card__text">{text}</p>
            <p className="later-card__state"><span className="badge badge-outline">Wartet auf die Auswertung</span></p>
          </li>
        ))}
      </ul>
    </>
  );
}
