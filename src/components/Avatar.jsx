function Avatar({ name, size = 'md', status = 'offline', image, initials, className = '' }) {
  const sizeClasses = {
    xs: 'h-7 w-7 text-[11px]',
    sm: 'h-9 w-9 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-16 w-16 text-lg font-bold',
    xl: 'h-24 w-24 text-3xl font-extrabold sm:h-28 sm:w-28 sm:text-4xl',
  }

  const indicatorSizes = {
    xs: 'h-2 w-2 border',
    sm: 'h-2.5 w-2.5 border-2',
    md: 'h-3.5 w-3.5 border-2',
    lg: 'h-4 w-4 border-2',
    xl: 'h-5 w-5 border-3 sm:h-6 sm:w-6 sm:border-4',
  }

  const firstLetter = initials || name?.charAt(0)?.toUpperCase() || '?'

  return (
    <div className={`relative shrink-0 select-none ${className}`}>
      <div className={`flex items-center justify-center overflow-hidden rounded-full border border-white/60 bg-gradient-to-tr from-violet-600 to-blue-500 font-bold text-white shadow-xs ${sizeClasses[size] || sizeClasses.md}`}>
        {image ? (
          <img src={image} alt={name || 'Avatar'} className="h-full w-full object-cover" />
        ) : (
          <span>{firstLetter}</span>
        )}
      </div>
      {status && (
        <span 
          className={`absolute bottom-0.5 right-0.5 rounded-full border-white ${indicatorSizes[size] || indicatorSizes.md} ${
            status === 'online' 
              ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]' 
              : status === 'away' 
              ? 'bg-amber-400' 
              : 'bg-slate-300'
          }`} 
        />
      )}
    </div>
  )
}

export default Avatar

