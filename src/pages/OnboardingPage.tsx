import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, MapPinOff, Eye } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { isAdult } from '../lib/utils'
import type { Gender, InterestedIn } from '../types'

export function OnboardingPage() {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [fullName, setFullName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState<Gender>('male')
  const [interestedIn, setInterestedIn] = useState<InterestedIn>('everyone')
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([])
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('Miami')

  const uploadPhotos = async (userId: string) => {
    const uploaded: { url: string; order: number }[] = []

    for (let i = 0; i < photos.length; i++) {
      const { file } = photos[i]
      const ext = file.name.split('.').pop()
      const path = `${userId}/${Date.now()}-${i}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(path)

      uploaded.push({ url: publicUrl, order: i })
    }

    if (uploaded.length > 0) {
      await supabase.from('profile_photos').insert(
        uploaded.map((p, i) => ({
          user_id: userId,
          photo_url: p.url,
          sort_order: i,
          is_primary: i === 0,
        }))
      )
    }
  }

  const handleNext = async () => {
    setError('')

    if (step === 1) {
      if (!fullName.trim()) return setError('Name is required')
      if (!dateOfBirth) return setError('Date of birth is required')
      if (!isAdult(dateOfBirth)) return setError('You must be 18 or older')
      setStep(2)
      return
    }

    if (step === 2) {
      if (photos.length === 0) return setError('Add at least one photo')
      setStep(3)
      return
    }

    if (step === 3) {
      if (!city.trim()) return setError('City is required')
      setStep(4)
      return
    }

    if (step === 4) {
      if (!user) return
      setLoading(true)

      try {
        const visibilityMode = gender === 'female' ? 'likes_only' : 'likes_only'

        await supabase.from('profiles').update({
          full_name: fullName.trim(),
          date_of_birth: dateOfBirth,
          gender,
          interested_in: interestedIn,
          bio: bio.trim() || null,
          city: city.trim(),
          visibility_mode: visibilityMode,
          profile_completed: true,
        }).eq('id', user.id)

        await uploadPhotos(user.id)
        await refreshProfile()
        navigate('/discover')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const remaining = 5 - photos.length
    const toAdd = files.slice(0, remaining).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setPhotos((prev) => [...prev, ...toAdd])
  }

  return (
    <div className="min-h-screen bg-tonight-bg px-5 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-tonight-accent' : 'bg-tonight-border'}`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Basic info</h1>
            <input
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-tonight-border bg-tonight-card px-4 py-3"
            />
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full rounded-xl border border-tonight-border bg-tonight-card px-4 py-3"
            />
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              className="w-full rounded-xl border border-tonight-border bg-tonight-card px-4 py-3"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non_binary">Non-binary</option>
              <option value="other">Other</option>
            </select>
            <select
              value={interestedIn}
              onChange={(e) => setInterestedIn(e.target.value as InterestedIn)}
              className="w-full rounded-xl border border-tonight-border bg-tonight-card px-4 py-3"
            >
              <option value="male">Men</option>
              <option value="female">Women</option>
              <option value="everyone">Everyone</option>
            </select>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="mb-2 text-2xl font-bold">Add photos</h1>
            <p className="mb-4 text-sm text-tonight-muted">At least 1, up to 5 photos</p>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, i) => (
                <div key={i} className="aspect-square overflow-hidden rounded-xl bg-tonight-card">
                  <img src={p.preview} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
              {photos.length < 5 && (
                <label className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border border-dashed border-tonight-border text-tonight-muted hover:border-tonight-accent">
                  +
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                </label>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Bio & city</h1>
            <textarea
              placeholder="Tell people about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-tonight-border bg-tonight-card px-4 py-3 resize-none"
            />
            <input
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-tonight-border bg-tonight-card px-4 py-3"
            />
          </div>
        )}

        {step === 4 && (
          <div>
            <h1 className="mb-4 text-2xl font-bold">Safety & visibility</h1>
            <div className="space-y-3">
              <SafetyItem icon={<MapPinOff size={18} />} text="Your location is never shared unless you turn on Tonight Mode." />
              <SafetyItem icon={<Eye size={18} />} text="For women, live visibility is private by default and only shown to people you choose." />
              <SafetyItem icon={<Shield size={18} />} text="Your exact location is never displayed to other users." />
            </div>
            {gender === 'female' && (
              <p className="mt-4 rounded-xl border border-tonight-accent/30 bg-tonight-accent/10 p-4 text-sm">
                Only people you choose can see you in Tonight Mode.
              </p>
            )}
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <button
          onClick={handleNext}
          disabled={loading}
          className="mt-8 w-full rounded-xl bg-tonight-accent py-3.5 font-semibold hover:bg-tonight-accent-hover disabled:opacity-50"
        >
          {loading ? 'Saving...' : step === 4 ? 'Start discovering' : 'Continue'}
        </button>
      </div>
    </div>
  )
}

function SafetyItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-tonight-border bg-tonight-card p-4 text-sm">
      <span className="text-tonight-accent shrink-0">{icon}</span>
      <span className="text-tonight-muted">{text}</span>
    </div>
  )
}
