import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <h1 className="page-title">Page not found</h1>
      <p className="mt-2 text-muted">The page does not exist, or you do not have access to it.</p>
      <Link href="/me" className="btn-primary mt-8">Go to my page</Link>
    </main>
  );
}
