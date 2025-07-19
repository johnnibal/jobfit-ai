import Image from 'next/image' // ⬅️ Make sure to import this!
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      
      {/* 🔍 AI Logo above heading */}
      <Image
        src="/AIlogo.png" // ⬅️ Must be inside your public/ folder
        alt="AI Logo"
          width={180}     // ⬅️ Increased from 100
  height={180}
        className="mb-4"
      />

      {/* 🏷️ Heading */}
      <h1 className="text-4xl font-bold mb-4">Welcome to JobFit.AI</h1>

      {/* 📄 Description */}
      <p className="text-lg text-gray-700 mb-6 max-w-xl">
        Paste your CV and a job description. Our AI will analyze how well you match, highlight skill gaps, and suggest improvements to become a top candidate.
      </p>

      {/* 🔗 Button to analyzer */}
      <Link
        href="/analyze"
        className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition"
      >
        🔍 Try the Analyzer
      </Link>
    </main>
  )
}
