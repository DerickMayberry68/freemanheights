import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { XMarkIcon } from '@heroicons/react/24/outline'
import PrayerRequestForm from './PrayerRequestForm'

export default function PrayerRequestModal({ isOpen, onClose }) {
  const [formKey, setFormKey] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleSuccess = () => {
    // Reset form by changing key (forces component remount)
    setFormKey(prev => prev + 1)
    // Auto-close modal after 2 seconds
    setTimeout(() => {
      onClose()
    }, 2000)
  }

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      onClose()
    }, 200) // Wait for animation to complete
  }

  if (!isOpen) return null

  const modalContent = (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-200 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
          isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-primary/10 sticky top-0 bg-white z-10 rounded-t-xl">
          <h3 className="text-lg font-semibold text-secondary-dark">Submit a Prayer Request</h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <PrayerRequestForm key={formKey} onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
