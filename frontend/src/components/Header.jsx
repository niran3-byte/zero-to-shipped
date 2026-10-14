export default function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="#top">
        <span className="brand-mark">0→S</span>
        <span className="brand-name">0 to Shipped</span>
      </a>
      <nav className="site-nav">
        <a href="#analyze">Analyze</a>
        <a href="#how">How it works</a>
        <a href="#faq">FAQ</a>
      </nav>
    </header>
  );
}
