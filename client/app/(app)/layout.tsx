import { Sidebar } from '@/components/sidebar'
import { ToastProvider } from '@/components/ui/toast'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex h-screen bg-slate-950 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  )
}
