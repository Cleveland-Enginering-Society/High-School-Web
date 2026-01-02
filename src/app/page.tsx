export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Welcome to{" "}
          <span className="text-blue-600 dark:text-blue-400">
            Next.js
          </span>{" "}
          with{" "}
          <span className="text-cyan-600 dark:text-cyan-400">
            Tailwind CSS
          </span>
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 border border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors">
            <h2 className="text-xl font-semibold mb-2">Fast</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Built on React with server-side rendering for optimal performance.
            </p>
          </div>
          <div className="p-6 border border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors">
            <h2 className="text-xl font-semibold mb-2">Modern</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Using the latest Next.js App Router and TypeScript.
            </p>
          </div>
          <div className="p-6 border border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors">
            <h2 className="text-xl font-semibold mb-2">Styled</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Beautiful UI with Tailwind CSS utility classes.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

