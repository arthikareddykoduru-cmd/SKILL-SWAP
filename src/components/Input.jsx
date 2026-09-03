function Input({ label, className = '', ...props }) {
  return (
    <label className="block text-xs font-bold text-slate-700">
      {label ? <span className="mb-1.5 block">{label}</span> : null}
      <input 
        className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10 ${className}`} 
        {...props} 
      />
    </label>
  )
}

export default Input
