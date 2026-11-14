import Link from 'next/link';

export default function EnNotFound() {
  return (
    <div className="text-center py-24 space-y-4">
      <h2 className="text-4xl font-black text-slate-900 dark:text-white">404</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">Page or tool not found.</p>
      <Link
        href="/en/"
        className="inline-flex px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
      >
        Back to ZebraCode Kit
      </Link>
    </div>
  );
}
