'use client'
import { useEffect, useState } from 'react'

const CITIES = ['Delhi', 'Mumbai', 'Agra', 'Jaipur', 'Lucknow', 'Kanpur', 'Bhopal', 'Indore', 'Surat', 'Pune', 'Nagpur', 'Patna']
const NAMES = ['Rahul', 'Priya', 'Amit', 'Sonia', 'Vikram', 'Neha', 'Raj', 'Sunita', 'Arjun', 'Kavya', 'Deepak', 'Meena', 'Rohit', 'Anjali']

function randomEntry() {
  const name = NAMES[Math.floor(Math.random() * NAMES.length)]
  const city = CITIES[Math.floor(Math.random() * CITIES.length)]
  return `${name} from ${city} just joined!`
}

export default function LiveFeed() {
  const [entries, setEntries] = useState<string[]>([randomEntry(), randomEntry(), randomEntry()])

  useEffect(() => {
    const interval = setInterval(() => {
      setEntries(prev => [randomEntry(), ...prev.slice(0, 4)])
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  const doubled = [...entries, ...entries]

  return (
    <div className="overflow-hidden bg-casino-800/60 border border-purple-900/30 rounded-xl py-2 px-4">
      <div className="flex gap-8 animate-marquee whitespace-nowrap" style={{ width: 'max-content' }}>
        {doubled.map((e, i) => (
          <span key={i} className="text-xs text-gray-400 inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
            {e}
          </span>
        ))}
      </div>
    </div>
  )
}
