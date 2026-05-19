'use client'

import { useCallback, useState } from 'react'
import { btnSecondary, inputSurface, labelCaps } from '@/components/ui/theme'

export type AppliedProPromo = {
  code: string
  percentOff: number
  discountedEur: number
  originalEur: number
}

type Props = {
  disabled?: boolean
  compact?: boolean
  onApplied: (applied: AppliedProPromo | null) => void
}

export function ProReportPromoBox({ disabled, compact, onApplied }: Props) {
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [appliedTag, setAppliedTag] = useState<string | null>(null)

  const clearAll = useCallback(() => {
    setInput('')
    setMsg(null)
    setAppliedTag(null)
    onApplied(null)
  }, [onApplied])

  const apply = useCallback(async () => {
    setMsg(null)
    const trimmed = input.trim()
    if (!trimmed) {
      clearAll()
      return
    }

    setBusy(true)
    try {
      const res = await fetch('/api/promo/pro-report/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      })

      let data: {
        valid?: boolean
        code?: string
        percentOff?: number
        originalEur?: number
        discountedEur?: number
        message?: string
      }

      try {
        data = (await res.json()) as typeof data
      } catch {
        throw new Error('Could not validate code.')
      }

      if (!data.valid) {
        setAppliedTag(null)
        onApplied(null)
        setMsg(typeof data.message === 'string' ? data.message : 'Invalid code.')
        return
      }

      if (
        typeof data.code === 'string' &&
        typeof data.percentOff === 'number' &&
        typeof data.discountedEur === 'number' &&
        typeof data.originalEur === 'number'
      ) {
        onApplied({
          code: data.code,
          percentOff: data.percentOff,
          discountedEur: data.discountedEur,
          originalEur: data.originalEur,
        })
        setAppliedTag(`${data.code} · −${data.percentOff}%`)
        setMsg(null)
      }
    } catch (e) {
      setAppliedTag(null)
      onApplied(null)
      setMsg(e instanceof Error ? e.message : 'Validation failed.')
    } finally {
      setBusy(false)
    }
  }, [input, clearAll, onApplied])

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex flex-wrap items-end gap-2">
        <label className={`flex-1 ${compact ? 'min-w-[120px]' : 'min-w-[160px]'}`}>
          <span
            className={`mb-1 block ${compact ? 'text-[10px]' : 'text-[11px]'} ${labelCaps}`}
          >
            Promo / referral code
          </span>
          <input
            type="text"
            disabled={disabled || busy}
            value={input}
            onChange={(e) => {
              const v = e.target.value
              setMsg(null)
              setInput(v)
              if (!v.trim()) {
                setAppliedTag(null)
                onApplied(null)
              }
            }}
            placeholder="LAUNCH50"
            className={inputSurface}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
        </label>
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => void apply()}
          className={`${btnSecondary} px-4 py-2 text-xs`}
        >
          {busy ? 'Checking…' : 'Apply'}
        </button>
        {appliedTag ? (
          <button
            type="button"
            disabled={disabled || busy}
            onClick={clearAll}
            className={`${btnSecondary} px-3 py-2 text-xs`}
          >
            Clear
          </button>
        ) : null}
      </div>
      {appliedTag ? <p className="text-[11px] font-medium text-emerald-700">{appliedTag} applied</p> : null}
      {msg ? <p className="text-[11px] leading-relaxed text-amber-800">{msg}</p> : null}
    </div>
  )
}
