function tier(score: number) {
  if (score >= 75) return { num: 'text-leaf', bar: 'bg-leaf' }
  if (score >= 50) return { num: 'text-mel', bar: 'bg-mel' }
  return { num: 'text-ink-2', bar: 'bg-ink-3' }
}

export default function CompatScore({ score }: { score: number }) {
  const { num, bar } = tier(score)
  return (
    <div className="inline-grid min-w-[84px] gap-1.5 text-right">
      <span className={`font-extrabold leading-[28px] tracking-[-0.03em] tabular-nums ${num}`} style={{ fontSize: 28 }}>
        {score}
        <small className="text-base font-bold">%</small>
      </span>
      <span className="h-1.5 overflow-hidden rounded-sm bg-surface-sunk">
        <span className={`block h-full rounded-sm ${bar}`} style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
      </span>
      <span className="text-xs text-ink-3">compatível</span>
    </div>
  )
}
