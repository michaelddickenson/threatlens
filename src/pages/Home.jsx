export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] font-mono text-center px-4">
      <h1 className="text-4xl font-bold text-green-400 mb-4 tracking-widest">THREATLENS</h1>
      <p className="text-gray-400 text-lg mb-2">Interactive APT Attack Simulator</p>
      <p className="text-gray-600 text-sm">Attacker view. Defender view. Real TTPs.</p>
    </div>
  )
}