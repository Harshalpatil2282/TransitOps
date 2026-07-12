'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Vehicle } from '@/lib/types'
import { apiPost, apiPatch } from '@/lib/api'

const schema = z.object({
  regNo: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required'),
  type: z.enum(['VAN', 'TRUCK', 'BUS', 'BIKE']),
  maxLoadKg: z.coerce.number().positive('Must be positive'),
  acquisitionCost: z.coerce.number().positive('Must be positive'),
  odometer: z.coerce.number().min(0, 'Must be 0 or more').default(0),
  region: z.string().optional(),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']).optional(),
})
type FormData = {
  regNo: string
  name: string
  type: 'VAN' | 'TRUCK' | 'BUS' | 'BIKE'
  maxLoadKg: number
  acquisitionCost: number
  odometer: number
  region?: string
  status?: 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED'
}

interface VehicleFormProps {
  vehicle?: Vehicle
  onSuccess: (vehicle: Vehicle) => void
  onClose: () => void
}

export function VehicleForm({ vehicle, onSuccess, onClose }: VehicleFormProps) {
  const isEdit = !!vehicle
  const { register, handleSubmit, setError, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: vehicle ? {
      regNo: vehicle.regNo,
      name: vehicle.name,
      type: vehicle.type,
      maxLoadKg: vehicle.maxLoadKg,
      acquisitionCost: vehicle.acquisitionCost,
      odometer: vehicle.odometer,
      region: vehicle.region || '',
      status: vehicle.status,
    } : { odometer: 0 },
  })

  const onSubmit = async (data: FormData) => {
    const payload = { ...data, regNo: data.regNo.trim().toUpperCase() }
    const { data: result, error, status } = isEdit
      ? await apiPatch<Vehicle>(`/vehicles/${vehicle!.id}`, payload)
      : await apiPost<Vehicle>('/vehicles', payload)

    if (error) {
      if (status === 409) {
        setError('regNo', { message: 'Registration number already exists' })
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
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Reg No *</label>
          <input
            {...register('regNo')}
            placeholder="MH-12-AB-1234"
            className={`w-full uppercase ${errors.regNo ? 'border-red-500' : ''}`}
            readOnly={isEdit}
          />
          {errors.regNo && <p className="text-red-400 text-xs mt-1">{errors.regNo.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Vehicle Name *</label>
          <input {...register('name')} placeholder="Tata Ace" className={`w-full ${errors.name ? 'border-red-500' : ''}`} />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Type *</label>
          <select {...register('type')} className={`w-full ${errors.type ? 'border-red-500' : ''}`}>
            <option value="VAN">Van</option>
            <option value="TRUCK">Truck</option>
            <option value="BUS">Bus</option>
            <option value="BIKE">Bike</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Max Load (kg) *</label>
          <input {...register('maxLoadKg')} type="number" min="1" placeholder="1000" className={`w-full ${errors.maxLoadKg ? 'border-red-500' : ''}`} />
          {errors.maxLoadKg && <p className="text-red-400 text-xs mt-1">{errors.maxLoadKg.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Acq. Cost (₹) *</label>
          <input {...register('acquisitionCost')} type="number" min="1" placeholder="500000" className={`w-full ${errors.acquisitionCost ? 'border-red-500' : ''}`} />
          {errors.acquisitionCost && <p className="text-red-400 text-xs mt-1">{errors.acquisitionCost.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Odometer (km)</label>
          <input {...register('odometer')} type="number" min="0" placeholder="0" className="w-full" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Region</label>
          <input {...register('region')} placeholder="Mumbai" className="w-full" />
        </div>
        {isEdit && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
            <select {...register('status')} className="w-full">
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="IN_SHOP">In Shop</option>
              <option value="RETIRED">Retired</option>
            </select>
          </div>
        )}
      </div>

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
          {isEdit ? 'Save Changes' : 'Add Vehicle'}
        </button>
      </div>
    </form>
  )
}
