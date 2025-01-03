import Link from "next/link";

export default function Page() {
  return (
    <main className="p-8 text-center">
      <h1 className="text-4xl font-bold mb-6 text-gray-900">Welcome to BookStore!</h1>
      <p className="text-lg text-gray-700 mb-6">
        Track your reading, explore your library, and manage your book lists.
      </p>
      <Link
        href="/library"
        className="bg-blue-500 text-white px-6 py-3 rounded-md shadow-md hover:bg-blue-600"
      >
        Go to Library
      </Link>
    </main>
  );
}

