export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] mt-32">
      <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between text-sm text-[var(--color-muted)]">
        <p>Espen Campbell · {new Date().getFullYear()}</p>
        <div className="flex gap-6">
          <a href="https://github.com/eazycxmp" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-fg)] transition-colors">GitHub</a>
          <a href="https://espencampbell.substack.com" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-fg)] transition-colors">Substack</a>
          <a href="mailto:espen@espencampbell.com" className="hover:text-[var(--color-fg)] transition-colors">Email</a>
        </div>
      </div>
    </footer>
  );
}
