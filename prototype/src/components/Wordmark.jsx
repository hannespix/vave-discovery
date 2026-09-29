// Text-Wortmarke – bewusst kein Logo-Bild von VAVE
export default function Wordmark({ sub = 'Studio-Tool · Prototyp' }) {
  return (
    <p className="wordmark">
      <span className="wordmark__name">VAVE</span>
      {sub && <span className="wordmark__sub">{sub}</span>}
    </p>
  );
}
