function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-3 p-6 text-sm text-gray-500">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      <span>{label}</span>
    </div>
  )
}

export default Spinner
