import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { toast } from 'react-toastify'
import { useAuth } from '../../lib/AuthContext'
import { VideoCameraIcon, StopIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

const BUCKET = 'recordings'

export default function RecordLivestream() {
  const { user } = useAuth()
  const videoRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const recordingStartRef = useRef(0)

  const [stream, setStream] = useState(null)
  const [recording, setRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [livestreamUrl, setLivestreamUrl] = useState('')
  const [livestreamUrlSaving, setLivestreamUrlSaving] = useState(false)
  const [recordings, setRecordings] = useState([])
  const [loadingRecordings, setLoadingRecordings] = useState(true)
  const [error, setError] = useState(null)

  // Load existing recordings
  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error: e } = await supabase
        .from('livestream_recordings')
        .select('id, title, file_url, duration_seconds, created_at')
        .order('created_at', { ascending: false })
      if (!cancelled) {
        setRecordings(data || [])
        setLoadingRecordings(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Load current livestream URL (shown on /livestream while you broadcast)
  useEffect(() => {
    let cancelled = false
    supabase.from('site_settings').select('value').eq('key', 'livestream_url').maybeSingle().then(({ data }) => {
      if (!cancelled && data?.value != null) setLivestreamUrl(data.value)
    })
    return () => { cancelled = true }
  }, [])

  const startRecording = async () => {
    setError(null)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setStream(mediaStream)
      if (videoRef.current) videoRef.current.srcObject = mediaStream

      const recorder = new MediaRecorder(mediaStream, { mimeType: 'video/webm;codecs=vp9,opus' })
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const durationSec = Math.round((Date.now() - recordingStartRef.current) / 1000)
        setRecordedBlob({ blob, durationSeconds: durationSec })
        mediaStream.getTracks().forEach((t) => t.stop())
        setStream(null)
        if (videoRef.current) {
          videoRef.current.srcObject = null
          videoRef.current.src = URL.createObjectURL(blob)
        }
      }
      mediaRecorderRef.current = recorder
      recordingStartRef.current = Date.now()
      recorder.start(1000)
      setRecording(true)
    } catch (err) {
      setError(err.message || 'Could not access camera or microphone.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  const discardRecording = () => {
    if (recordedBlob && videoRef.current?.src) URL.revokeObjectURL(videoRef.current.src)
    setRecordedBlob(null)
    setTitle('')
    setDescription('')
    setSaveError(null)
  }

  const saveLivestreamUrl = async () => {
    setLivestreamUrlSaving(true)
    const { error } = await supabase.from('site_settings').upsert({ key: 'livestream_url', value: livestreamUrl.trim() }, { onConflict: 'key' })
    setLivestreamUrlSaving(false)
    if (error) toast.error(error.message)
    else toast.success('Livestream URL saved. It will show on the Livestream page.')
  }

  const blob = recordedBlob?.blob ?? recordedBlob
  const durationSeconds = typeof recordedBlob === 'object' && recordedBlob?.durationSeconds != null
    ? recordedBlob.durationSeconds
    : 0

  const saveRecording = async () => {
    if (!blob || !user?.id) return
    const trimmedTitle = title.trim()
    const trimmedDesc = description.trim()
    if (!trimmedTitle) {
      setSaveError('Name is required.')
      return
    }
    if (!trimmedDesc) {
      setSaveError('Description is required.')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const ext = 'webm'
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, {
          contentType: 'video/webm',
          upsert: false,
        })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
      const fileUrl = urlData?.publicUrl ?? ''

      const { data: inserted, error: insertError } = await supabase
        .from('livestream_recordings')
        .insert({
          title: trimmedTitle,
          storage_path: path,
          file_url: fileUrl,
          duration_seconds: durationSeconds || null,
          created_by: user.id,
        })
        .select('id, title, file_url, duration_seconds, created_at')
        .single()
      if (insertError) throw insertError
      if (inserted) setRecordings((prev) => [inserted, ...prev])

      const today = new Date().toISOString().split('T')[0]
      const { error: sermonError } = await supabase.from('sermons').insert({
        title: trimmedTitle,
        description: trimmedDesc,
        speaker: 'Livestream',
        sermon_date: today,
        video_url: fileUrl,
        is_featured: false,
      })
      if (sermonError) {
        console.error('Sermon insert failed:', sermonError)
        toast.error('Recording saved but could not add to sermons list.')
      }

      toast.success('Recording saved and added to Sermons.')
      discardRecording()
    } catch (err) {
      setSaveError(err.message || 'Failed to save recording.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-secondary-dark">Record Livestream</h2>
      <p className="text-secondary-light">
        Record with your camera and microphone. Set the livestream URL below so the Livestream page shows your broadcast (e.g. YouTube Live) while you record. When you save, the recording is added to the Sermons list.
      </p>

      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h3 className="font-semibold text-secondary-dark mb-2">Current livestream URL</h3>
        <p className="text-sm text-secondary-light mb-3">
          While you broadcast (e.g. via YouTube Live), paste the stream URL here. It will play on the <a href="/livestream" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Livestream page</a> so viewers can watch live.
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={livestreamUrl}
            onChange={(e) => setLivestreamUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=... or your stream URL"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={saveLivestreamUrl}
            disabled={livestreamUrlSaving}
            className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {livestreamUrlSaving ? 'Saving…' : 'Save URL'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
            <div className="mt-4 flex gap-3">
              {!recording && !recordedBlob && (
                <button
                  type="button"
                  onClick={startRecording}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:opacity-90"
                >
                  <VideoCameraIcon className="h-5 w-5" />
                  Start recording
                </button>
              )}
              {recording && (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700"
                >
                  <StopIcon className="h-5 w-5" />
                  Stop recording
                </button>
              )}
            </div>
          </div>

          {blob && (
            <div className="md:w-80 space-y-4">
              <p className="text-sm font-medium text-secondary-dark">Save recording (required for Sermons)</p>
              <label className="block">
                <span className="text-sm text-secondary-light">Name *</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sunday Sermon"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-sm text-secondary-light">Description *</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Brief description of this recording"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              {saveError && (
                <p className="text-sm text-red-600">{saveError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveRecording}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  <ArrowUpTrayIcon className="h-5 w-5" />
                  {saving ? 'Saving…' : 'Save to database'}
                </button>
                <button
                  type="button"
                  onClick={discardRecording}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-secondary-dark hover:bg-gray-50 disabled:opacity-50"
                >
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-semibold text-secondary-dark mb-4">Saved recordings</h3>
        {loadingRecordings ? (
          <p className="text-secondary-light">Loading…</p>
        ) : recordings.length === 0 ? (
          <p className="text-secondary-light">No recordings yet. Record and save one above.</p>
        ) : (
          <ul className="space-y-3">
            {recordings.map((r) => (
              <li key={r.id ?? r.file_url} className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
                <div>
                  <span className="font-medium text-secondary-dark">{r.title || 'Untitled'}</span>
                  <span className="text-sm text-secondary-light ml-2">
                    {r.created_at && format(new Date(r.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                <a
                  href={r.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-medium text-sm hover:underline"
                >
                  Play
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
