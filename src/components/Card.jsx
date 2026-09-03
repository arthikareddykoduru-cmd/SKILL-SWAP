function Card({ children, className = '', padded = true, hover = false, glass = false }) {
  return (
    <div 
      className={`rounded-3xl border transition-all duration-300 ${
        glass 
          ? 'bg-white/80 backdrop-blur-xl border-white/60 shadow-lg shadow-slate-200/40' 
          : 'bg-white border-slate-200/80 shadow-xs shadow-slate-900/5'
      } ${
        hover ? 'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60 hover:border-violet-200' : ''
      } ${padded ? 'p-6 sm:p-7' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export default Card
