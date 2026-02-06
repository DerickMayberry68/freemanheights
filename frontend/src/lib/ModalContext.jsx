import { createContext, useContext, useState, useCallback } from 'react'
import { ErrorModal, ConfirmModal } from '../components/ui/Modal'

const ModalContext = createContext(null)

export function ModalProvider({ children }) {
  const [errorModal, setErrorModal] = useState({ open: false, title: '', message: '' })
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    onConfirm: null,
    variant: 'primary',
  })

  const showError = useCallback((title = 'Error', message) => {
    setErrorModal({ open: true, title, message: message || title })
  }, [])

  const showConfirm = useCallback(({
    title = 'Confirm',
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    variant = 'primary',
  }) => {
    setConfirmModal({
      open: true,
      title,
      message: message || 'Are you sure?',
      confirmLabel,
      cancelLabel,
      onConfirm: onConfirm || (() => {}),
      variant,
    })
  }, [])

  const value = { showError, showConfirm }

  return (
    <ModalContext.Provider value={value}>
      {children}
      <ErrorModal
        open={errorModal.open}
        onClose={() => setErrorModal((s) => ({ ...s, open: false }))}
        title={errorModal.title}
        message={errorModal.message}
      />
      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal((s) => ({ ...s, open: false }))}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        cancelLabel={confirmModal.cancelLabel}
        onConfirm={confirmModal.onConfirm}
        variant={confirmModal.variant}
      />
    </ModalContext.Provider>
  )
}

export function useModal() {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used within ModalProvider')
  return ctx
}
