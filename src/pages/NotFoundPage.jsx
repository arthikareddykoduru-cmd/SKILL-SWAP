import { useNavigate } from 'react-router-dom'
import { AlertCircle, Home, Compass } from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'
import { useAuth } from '../context/AuthContext'

function NotFoundPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 selection:bg-violet-500 selection:text-white">
      <Card className="max-w-md w-full text-center p-8 sm:p-10 shadow-xl shadow-slate-200/50 border-slate-200/80 space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-100 text-violet-600 shadow-xs">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Page Not Found</h1>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          The link you followed may be broken or the page may have been moved.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Button onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')} className="px-5 py-2.5 text-xs font-bold shadow-md shadow-violet-500/25">
            <Home size={15} /> {isAuthenticated ? 'Back to Dashboard' : 'Back to Home'}
          </Button>
          {isAuthenticated && (
            <Button variant="outline" onClick={() => navigate('/search')} className="px-4 py-2.5 text-xs font-bold">
              <Compass size={15} /> Explore Skills
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

export default NotFoundPage
