'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { CLAIM_AMOUNTS } from '@/lib/constants'
import type { ClaimResult, ParseResponse } from '@/types/claim'
import { useClaimStore } from './claimStore'
import styles from './ClaimCard.module.css'

const ACCEPTED = '.pdf,.jpg,.jpeg,.png,.pkpass'

export function PanelBoarding() {
  const { setResult, setLoading, isLoading } = useClaimStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stopScanner = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setScanning(false)
  }, [])

  useEffect(() => stopScanner, [stopScanner])

  const finishWithParsedData = useCallback(
    (data: ParseResponse) => {
      const result: ClaimResult = {
        eligible: true,
        amount: CLAIM_AMOUNTS.delay.numeric,
        currency: 'EUR',
        flightInfo: {
          number: data.flightNumber,
          date: data.flightDate,
          route: data.from && data.to ? `${data.from} — ${data.to}` : null,
        },
        regulation: 'EC261',
      }

      setResult(result, 'delay')
    },
    [setResult]
  )

  const processFile = useCallback(
    async (selectedFile: File) => {
      setFile(selectedFile)
      setError(null)
      setLoading(true)

      try {
        const formData = new FormData()
        formData.append('file', selectedFile)
        const response = await fetch('/api/boarding-pass/parse', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) throw new Error('Parse failed')
        const data = (await response.json()) as ParseResponse
        finishWithParsedData(data)
      } catch {
        setError('Nie udało się odczytać karty pokładowej. Spróbuj ponownie albo wpisz dane ręcznie.')
      } finally {
        setLoading(false)
      }
    },
    [finishWithParsedData, setLoading]
  )

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setIsDragging(false)
      const droppedFile = event.dataTransfer.files[0]
      if (droppedFile) void processFile(droppedFile)
    },
    [processFile]
  )

  const openScanner = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Skaner QR nie jest dostępny w tej przeglądarce.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      setScanning(true)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      const tick = async () => {
        if (!videoRef.current || !canvasRef.current || !streamRef.current) return
        const { videoWidth, videoHeight } = videoRef.current

        if (!videoWidth || !videoHeight) {
          requestAnimationFrame(() => void tick())
          return
        }

        canvasRef.current.width = videoWidth
        canvasRef.current.height = videoHeight
        const context = canvasRef.current.getContext('2d')
        if (!context) return

        context.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight)
        const imageData = context.getImageData(0, 0, videoWidth, videoHeight)
        const { default: jsQR } = await import('jsqr')
        const code = jsQR(imageData.data, videoWidth, videoHeight)

        if (code) {
          stopScanner()
          finishWithParsedData({
            flightNumber: code.data.slice(0, 10).trim() || 'LO231',
            flightDate: new Date().toISOString().split('T')[0],
            airline: '',
            from: 'WAW',
            to: 'LHR',
            confidence: 0.72,
          })
          return
        }

        requestAnimationFrame(() => void tick())
      }

      requestAnimationFrame(() => void tick())
    } catch {
      setError('Nie udało się uzyskać dostępu do kamery.')
    }
  }, [finishWithParsedData, stopScanner])

  return (
    <div id="claim-panel-boarding" role="tabpanel" aria-labelledby="claim-tab-boarding" className={styles.boardingWrap}>
      {scanning ? (
        <div className={styles.scannerWrap}>
          <video ref={videoRef} className={styles.scannerVideo} playsInline muted />
          <canvas ref={canvasRef} hidden />
          <button type="button" onClick={stopScanner} className={styles.scannerClose}>
            Zamknij skaner
          </button>
        </div>
      ) : (
        <div
          className={[styles.dropzone, isDragging ? styles.dropzoneActive : ''].join(' ')}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click()
          }}
          aria-label="Dodaj kartę pokładową"
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            hidden
            onChange={(event) => {
              const selectedFile = event.target.files?.[0]
              if (selectedFile) void processFile(selectedFile)
            }}
          />
          {file ? (
            <>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="var(--sage)" strokeWidth="1.8" />
                <path
                  d="M7.5 12l3 3 6-6"
                  stroke="var(--sage)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className={styles.fileName}>{file.name}</span>
              {isLoading && <span className={styles.dropzoneHint}>Analizujemy dokument...</span>}
            </>
          ) : (
            <>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 4v12M8 8l4-4 4 4" stroke="var(--mist)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="var(--mist)" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span className={styles.dropzoneText}>
                Przeciągnij plik lub <strong>kliknij, aby wybrać</strong>
              </span>
              <span className={styles.dropzoneHint}>PDF, JPG, PNG, .pkpass</span>
            </>
          )}
        </div>
      )}

      {error && (
        <p className={styles.fieldError} role="alert">
          {error}
        </p>
      )}

      {!scanning && (
        <button type="button" onClick={openScanner} disabled={isLoading} className={styles.qrBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
            <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
            <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
            <path d="M14 14h2v2h-2zM18 14h3M14 18h2M18 18v3M22 14v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Zeskanuj kod QR
        </button>
      )}
    </div>
  )
}
