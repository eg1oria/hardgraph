import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} HardGraph. All rights reserved.
        </div>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/explore" className="hover:text-foreground transition-colors">
            Explore
          </Link>
          <Link href="/templates" className="hover:text-foreground transition-colors">
            Templates
          </Link>
        </div>
      </div>
    </footer>
  );
}
