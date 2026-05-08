'use client'

import { useState, useRef } from 'react'
import { formatWon } from '@/utils/calculate'

interface Preset {
  label: string
  value: number
}

interface Props {
  value:        number
  onChange:     (v: number) => void
  placeholder?: string
  presets?:     Preset[]
  accent?:      string
  disabled?:    boolean
}

export function NumberInput({
  value,
  onChange,
  placeholder = '금액 입력',
  presets,
  accent = '#1A1F5E',
  disabled,
}: Props) {
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 화면에 표시할 문자열: 포커스 중이면 원시 숫자(편집 편의), 아니면 콤마 포맷
  const displayValue = value > 0 ? value.toLocaleString('ko-KR') : ''

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    onChange(raw ? parseInt(raw, 10) : 0)
  }

  return (
    <div>
      {/* 메인 입력 */}
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          display:      'flex',
          alignItems:   'center',
          borderRadius: 14,
          border:       `2px solid ${focused ? accent : '#E2E8F0'}`,
          background:   disabled ? '#F8FAFC' : '#fff',
          padding:      '0 16px',
          gap:          8,
          transition:   'border-color 0.15s',
          cursor:       disabled ? 'not-allowed' : 'text',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            flex:        1,
            height:      56,
            fontSize:    24,
            fontWeight:  800,
            color:       disabled ? '#94A3B8' : '#1A1F5E',
            background:  'transparent',
            border:      'none',
            outline:     'none',
            letterSpacing: '-0.5px',
          }}
        />
        <span style={{ fontSize: 15, fontWeight: 600, color: '#94A3B8', flexShrink: 0 }}>원</span>
      </div>

      {/* 만원 단위 헬퍼 */}
      {value > 0 && (
        <p style={{
          fontSize:  12,
          color:     accent,
          fontWeight: 600,
          marginTop: 6,
          marginLeft: 4,
        }}>
          = {formatWon(value)}
        </p>
      )}

      {/* 빠른 선택 */}
      {presets && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {presets.map(p => {
            const isSelected = value === p.value
            return (
              <button
                key={p.label}
                onClick={() => onChange(p.value)}
                style={{
                  padding:      '8px 14px',
                  borderRadius: 20,
                  fontSize:     13,
                  fontWeight:   700,
                  border:       `1.5px solid ${isSelected ? accent : '#E2E8F0'}`,
                  background:   isSelected ? accent : '#fff',
                  color:        isSelected ? '#fff' : '#475569',
                  cursor:       'pointer',
                  transition:   'all 0.12s',
                }}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
