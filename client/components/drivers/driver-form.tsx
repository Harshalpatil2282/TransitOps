'use client'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Driver } from '@/lib/types'
import { apiPost, apiPatch } from '@/lib/api'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  licenseNo: z.string().min(1, 'Required'),
  licenseCategory: z.enum(['LMV', 'HMV', 'HPMV']),
  licenseExpiry: z.string().min(1, 'Required'),
  contact: z.string().min(10, 'Min 10 digits'),
  safetyScore: z.coerce.number().min(0).max(100).default(100),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED']).optional(),
})
type FormData = {
  name: string
  licenseNo: string
  licenseCategory: 'LMV' | 'HMV' | 'HPMV'
  licenseExpiry: string
  contact: string
  safetyScore: number
  status?: 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED'
}

interface DriverFormProps {
  driver?: Driver
  onSuccess: (driver: Driver) => void
  onClose: () => void
}

export function DriverForm({ driver, onSuccess, onClose }: DriverFormProps) {
  const isEdit = !!driver
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: driver ? {
      name: driver.name,
      licenseNo: driver.licenseNo,
      licenseCategory: driver.licenseCategory as any,
      licenseExpiry: driver.licenseExpiry.split('T')[0],
      contact: driver.contact,
      safetyScore: driver.safetyScore,
      status: driver.status,
    } : { safetyScore: 100 },
  })

  const onSubmit = async (data: FormData) => {
    const { data: result, error, status } = isEdit
      ? await apiPatch<Driver>(`/drivers/${driver!.id}`, data)
      : await apiPost<Driver>('/drivers', data)

    if (error) {
      if (status === 409) {
        setError('licenseNo', { message: 'License number already exists' })
      } else {
        setError('root', { message: error })
      }
      return
    }
    onSuccess(result)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errors.root && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
          {errors.root.message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name *</label>
          <input {...register('name')} placeholder="Rajesh Kumar" className={`w-full ${errors.name ? 'border-red-500' : ''}`} />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">License No *</label>
          <input
            {...register('licenseNo')}
            placeholder="MH0120230012345"
            className={`w-full font-mono ${errors.licenseNo ? 'border-red-500' : ''}`}
            readOnly={isEdit}
          />
          {errors.licenseNo && <p className="text-red-400 text-xs mt-1">{errors.licenseNo.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">License Category *</label>
          <select {...register('licenseCategory')} className={`w-full ${errors.licenseCategory ? 'border-red-500' : ''}`}>
            <option value="">Select category</option>
            <option value="LMV">LMV — Light Motor Vehicle</option>
            <option value="HMV">HMV — Heavy Motor Vehicle</option>
            <option value="HPMV">HPMV — Heavy Passenger Motor Vehicle</option>
          </select>
          {errors.licenseCategory && <p className="text-red-400 text-xs mt-1">{errors.licenseCategory.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">License Expiry *</label>
          <input
            {...register('licenseExpiry')}
            type="date"
            className={`w-full ${errors.licenseExpiry ? 'border-red-500' : ''}`}
          />
          {errors.licenseExpiry && <p className="text-red-400 text-xs mt-1">{errors.licenseExpiry.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Contact *</label>
          <input {...register('contact')} placeholder="+91 98765 43210" className={`w-full ${errors.contact ? 'border-red-500' : ''}`} />
          {errors.contact && <p className="text-red-400 text-xs mt-1">{errors.contact.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Safety Score (0–100)</label>
          <input {...register('safetyScore')} type="number" min="0" max="100" placeholder="100" className="w-full" />
        </div>
      </div>

      {isEdit && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
          <select {...register('status')} className="w-full">
            <option value="AVAILABLE">Available</option>
            <option value="ON_TRIP">On Trip</option>
            <option value="OFF_DUTY">Off Duty</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-500 hover:text-slate-100 transition-colors text-sm font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold text-sm transition-colors"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? 'Save Changes' : 'Add Driver'}
        </button>
      </div>
    </form>
  )
}
