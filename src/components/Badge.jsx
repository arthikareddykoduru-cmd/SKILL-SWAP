function Badge({ children, tone = 'blue', className = '' }) {
  const tones = {
    blue: 'bg-blue-50/80 text-blue-700 border-blue-200/60',
    purple: 'bg-violet-50/80 text-violet-700 border-violet-200/60',
    green: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/60',
    orange: 'bg-amber-50/80 text-amber-700 border-amber-200/60',
    rose: 'bg-rose-50/80 text-rose-700 border-rose-200/60',
    gray: 'bg-slate-100 text-slate-700 border-slate-200/60',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide ${tones[tone] || tones.blue} ${className}`}>
      {children}
    </span>
  )
}

export default Badge
