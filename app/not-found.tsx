import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-background">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-500/10 text-brand-500 mb-4 shadow-glow">
        <FileQuestion className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground">404 - Page Not Found</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        The task, board, or page resource you requested does not exist or has been moved.
      </p>
      <div className="mt-6">
        <Link href="/dashboard">
          <Button size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
