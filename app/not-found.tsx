import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="rounded-full bg-surface p-4 mb-4">
        <Search className="h-8 w-8 text-text-muted" />
      </div>
      <h2 className="text-3xl font-bold mb-2">Page Not Found</h2>
      <p className="text-text-secondary max-w-md mb-8">
        Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or deleted.
      </p>
      <Link href="/">
        <Button>Return Home</Button>
      </Link>
    </div>
  );
}
