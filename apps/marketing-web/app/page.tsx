export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">AnvayaLabs</h1>
      <p className="text-lg text-gray-600 max-w-xl text-center">
        Battery & Textile Digital Product Passport Platform. Regulatory
        compliance made simple.
      </p>
      <div className="mt-8 flex gap-4">
        <a
          href="/battery"
          className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
        >
          Battery Passport
        </a>
        <a
          href="/textile"
          className="px-6 py-3 border border-black rounded-lg hover:bg-gray-100 transition"
        >
          Textile DPP
        </a>
      </div>
    </main>
  );
}
