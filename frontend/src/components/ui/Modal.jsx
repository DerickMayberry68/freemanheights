import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

export function ErrorModal({ open, onClose, title = 'Error', message }) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto max-w-sm rounded-xl bg-white p-6 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold text-secondary-dark">{title}</DialogTitle>
              <p className="mt-2 text-sm text-secondary-light">{message}</p>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg bg-secondary-dark px-4 py-2 text-sm font-medium text-white hover:bg-secondary-light"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

export function ConfirmModal({
  open,
  onClose,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'primary', // 'primary' | 'danger'
}) {
  const handleConfirm = () => {
    onConfirm?.()
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto max-w-sm rounded-xl bg-white p-6 shadow-xl">
          <div className="flex items-start gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${variant === 'danger' ? 'bg-red-100' : 'bg-primary/20'}`}>
              <InformationCircleIcon className={`h-6 w-6 ${variant === 'danger' ? 'text-red-600' : 'text-primary'}`} />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold text-secondary-dark">{title}</DialogTitle>
              <p className="mt-2 text-sm text-secondary-light">{message}</p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-secondary-dark hover:bg-gray-50"
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:opacity-90'}`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
