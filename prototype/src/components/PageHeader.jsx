import '../styles/components.css';

// Seitenkopf-Muster für alle Seiten und Werkzeuge:
//   <PageHeader eyebrow="Dienstag, 29. September" title="Zeiten" actions={<a className="btn" …/>}>Einleitung</PageHeader>
// Die Überschrift ist die einzige <h1> der Seite (id „page-title“). Die Hülle fokussiert sie nach jedem Routenwechsel.
export default function PageHeader({ eyebrow, title, actions, children, titleId = 'page-title' }) {
  return (
    <header className="page-header">
      <div className="page-header__main">
        {eyebrow && <p className="eyebrow page-header__eyebrow">{eyebrow}</p>}
        <h1 id={titleId} tabIndex={-1} className="page-header__title">{title}</h1>
        {children && <div className="page-header__lead">{children}</div>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}
