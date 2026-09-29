// Platzhalter – Builder A – Module, die erst nach der Auswertung kommen. Wird vom zuständigen Builder ersetzt.
export default function Later() {
  return (
    <section className="stack" aria-labelledby="page-title">
      <h1 id="page-title">Nach Klärung</h1>
      <p className="muted">Platzhalter – kommt in dieser Runde.</p>
    </section>
  );
}
