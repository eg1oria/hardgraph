import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border/50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs text-muted-foreground/50">
          © {new Date().getFullYear()} HardGraph
        </span>
        <div className="flex items-center gap-5 text-xs text-muted-foreground/50">
          <Link href="/explore" className="hover:text-muted-foreground transition-colors">
            Explore
          </Link>
          <Link href="/templates" className="hover:text-muted-foreground transition-colors">
            Templates
          </Link>
        </div>
      </div>
    </footer>
  );
}
