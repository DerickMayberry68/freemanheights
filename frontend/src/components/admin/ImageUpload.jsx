import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { PhotoIcon, XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'

/**
 * Reusable image upload component that uploads to Supabase Storage
 * @param {string} currentImageUrl - Current image URL (if exists)
 * @param {function} onImageChange - Callback when image is uploaded/changed, receives the new URL
 * @param {string} folder - Folder path in the bucket (e.g., 'ministries', 'staff', 'events')
 * @param {string} label - Label for the upload section
 */
export default function ImageUpload({
  currentImageUrl = '',
  onImageChange,
  folder = 'uploads',
  label = 'Image'
}) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, WebP, or GIF)')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10485760) {
      toast.error('Image must be smaller than 10MB')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result)
    }
    reader.readAsDataURL(file)

    // Upload to Supabase Storage
    await uploadImage(file)
  }

  const uploadImage = async (file) => {
    setUploading(true)
    setUploadProgress(0)

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('church-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('church-images')
        .getPublicUrl(data.path)

      // Update parent component
      onImageChange(publicUrl)
      toast.success('Image uploaded successfully!')
      setUploadProgress(100)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload image')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setPreview(null)
    onImageChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const displayImage = preview || currentImageUrl

  return (
    <div>
      <label className="block text-sm font-medium text-secondary-dark mb-2">
        {label}
      </label>

      <div className="flex items-start gap-4">
        {/* Image Preview */}
        {displayImage && (
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-300 flex-shrink-0">
            <img
              src={displayImage}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {!uploading && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                title="Remove image"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Upload Area */}
        <div className="flex-1">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
              id={`image-upload-${folder}`}
            />
            <label
              htmlFor={`image-upload-${folder}`}
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              {uploading ? (
                <>
                  <ArrowUpTrayIcon className="h-8 w-8 text-primary animate-pulse" />
                  <p className="text-sm text-secondary-dark font-medium">
                    Uploading... {uploadProgress}%
                  </p>
                </>
              ) : (
                <>
                  <PhotoIcon className="h-8 w-8 text-gray-400" />
                  <p className="text-sm text-secondary-dark font-medium">
                    Click to upload image
                  </p>
                  <p className="text-xs text-secondary-light">
                    JPEG, PNG, WebP, or GIF (max 10MB)
                  </p>
                </>
              )}
            </label>
          </div>

          {/* Manual URL Input (optional) */}
          <div className="mt-2">
            <input
              type="text"
              value={currentImageUrl}
              onChange={(e) => onImageChange(e.target.value)}
              placeholder="Or paste image URL..."
              disabled={uploading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
