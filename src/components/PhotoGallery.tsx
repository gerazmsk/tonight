import { useState } from 'react'
import { Plus, Star, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { ProfilePhoto } from '../types'

const MAX_PHOTOS = 5

interface PhotoGalleryProps {
  userId: string
  photos: ProfilePhoto[]
  editing: boolean
  onPhotosChange: (photos: ProfilePhoto[]) => void
}

export function PhotoGallery({ userId, photos, editing, onPhotosChange }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [uploading, setUploading] = useState(false)

  const sorted = [...photos].sort((a, b) => a.sort_order - b.sort_order)
  const heroPhoto = sorted[selectedIndex]?.photo_url ?? sorted[0]?.photo_url

  const uploadPhoto = async (file: File) => {
    if (photos.length >= MAX_PHOTOS) return
    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('profile-photos').getPublicUrl(path)

    const { data: inserted } = await supabase
      .from('profile_photos')
      .insert({
        user_id: userId,
        photo_url: publicUrl,
        sort_order: photos.length,
        is_primary: photos.length === 0,
      })
      .select()
      .single()

    if (inserted) {
      onPhotosChange([...photos, inserted as ProfilePhoto])
      setSelectedIndex(photos.length)
    }
    setUploading(false)
  }

  const deletePhoto = async (photoId: string) => {
    await supabase.from('profile_photos').delete().eq('id', photoId)
    const updated = photos.filter((p) => p.id !== photoId)
    if (updated.length > 0 && !updated.some((p) => p.is_primary)) {
      await supabase.from('profile_photos').update({ is_primary: true }).eq('id', updated[0].id)
      updated[0] = { ...updated[0], is_primary: true }
    }
    onPhotosChange(updated)
    setSelectedIndex(Math.min(selectedIndex, Math.max(0, updated.length - 1)))
  }

  const setPrimary = async (photoId: string) => {
    await supabase.from('profile_photos').update({ is_primary: false }).eq('user_id', userId)
    await supabase.from('profile_photos').update({ is_primary: true }).eq('id', photoId)
    onPhotosChange(
      photos.map((p) => ({ ...p, is_primary: p.id === photoId }))
    )
  }

  return (
    <div className="w-full">
      <div className="relative mx-auto aspect-[3/4] max-h-80 w-full overflow-hidden rounded-2xl bg-tonight-border">
        {heroPhoto ? (
          <img src={heroPhoto} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-tonight-muted">No photos yet</div>
        )}
        {sorted[selectedIndex]?.is_primary && (
          <span className="absolute left-3 top-3 rounded-full bg-tonight-accent px-2.5 py-1 text-xs font-medium">
            Main photo
          </span>
        )}
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {sorted.map((photo, i) => (
          <div key={photo.id} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={`h-16 w-16 overflow-hidden rounded-xl border-2 transition-colors ${
                selectedIndex === i ? 'border-tonight-accent' : 'border-transparent'
              }`}
            >
              <img src={photo.photo_url} alt="" className="h-full w-full object-cover" />
            </button>
            {editing && (
              <div className="absolute -right-1 -top-1 flex gap-0.5">
                {!photo.is_primary && (
                  <button
                    type="button"
                    onClick={() => setPrimary(photo.id)}
                    className="rounded-full bg-tonight-card p-1 text-tonight-accent shadow"
                    title="Set as main"
                  >
                    <Star size={12} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deletePhoto(photo.id)}
                  className="rounded-full bg-red-600 p-1 text-white shadow"
                  title="Remove"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        ))}

        {editing && photos.length < MAX_PHOTOS && (
          <label className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-dashed border-tonight-border text-tonight-muted hover:border-tonight-accent hover:text-tonight-accent">
            {uploading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-tonight-accent border-t-transparent" />
            ) : (
              <Plus size={20} />
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadPhoto(file)
                e.target.value = ''
              }}
            />
          </label>
        )}
      </div>

      {editing && (
        <p className="mt-2 text-center text-xs text-tonight-muted">
          Up to {MAX_PHOTOS} photos · Tap <Star size={10} className="inline" /> to set main
        </p>
      )}
    </div>
  )
}
