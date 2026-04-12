import { useState, useEffect } from 'react'
import { Zap } from 'lucide-react'
import { timeRemaining, pad2 } from '@/lib/utils'

export default function FlashCountdown({ endsAt, title = 'Flash Sales | Live Now' }) {
  const [time, setTime] = useState(timeRemaining(endsAt))
  useEffect(() => {
    const id = setInterval(() => setTime(timeRemaining(endsAt)), 1000)
    return () => clearInterval(id)
  }, [endsAt])
  if (time.expired) return null
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 text-white">
        <Zap size={16} className="fill-white" />
        <span className="font-bold text-sm">{title}</span>
      </div>
      <div className="flex items-center gap-1 text-white text-sm font-mono font-bold">
        <span>Time Left:</span>
        <span className="bg-black/30 px-1.5 py-0.5 rounded">{pad2(time.hours)}h</span>
        <span>:</span>
        <span className="bg-black/30 px-1.5 py-0.5 rounded">{pad2(time.minutes)}m</span>
        <span>:</span>
        <span className="bg-black/30 px-1.5 py-0.5 rounded">{pad2(time.seconds)}s</span>
      </div>
    </div>
  )
}