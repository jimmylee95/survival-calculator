'use client'

import { useState, useMemo } from 'react'
import {
  type BusinessInput,
  simulateBusinessRunway,
  formatWon,
  formatDays,
  getDangerLevel,
} from '@/utils/calculate'

const ACCENT = '#1A1F5E'

const DANGER_COLORS: Record<string, string> = {
  critical: '#FC8181',
  warning:  '#F6AD55',
  caution:  '#ECC94B',
  safe:     '#68D391',
  infinite: '#63B3ED',
}

interface Props {
  input:       BusinessInput
  currentDays: number
}

export function CostSlider({ input, currentDays }: Props) {
  const [fixedChange, setFixedChange]     = useState(0)   // -30% ~ +30%
  const [revenueChange, setRevenueChange] = useState(0)

  const simulation = useMemo(
    () => simulateBusinessRunway(input, {
      fixedCostChange: fixedChange / 100,
      revenueChange:   revenueChange / 100,
    }),
    [input, fixedChange, revenueChange]
  )

  const daysDiff     = isFinite(simulation.days) && isFinite(currentDays)
    ? Math.floor(simulation.days - currentDays)
    : null
  const simLevel     = getDangerLevel(simulation.days)
  const simColor     = DANGER_COLORS[simLevel]
  const isImproved   = daysDiff !== null && daysDiff > 0
  const isWorsened   = daysDiff !== null && daysDiff < 0

  function handleReset() {
    setFixedChange(0)
    setRevenueChange(0)
  }

  return (
    <div style={{
      background:   '#fff',
      borderRadius: 20,
      overflow:     'hidden',
      boxShadow:    '0 2px 16px rgba(0,0,0,0.06)',
    }}>
      {/* 헤더 */}
      <div style={{
        padding:      '18px 20px 14px',
        borderBottom: '1px solid #F1F5F9',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#1A1F5E', margin: '0 0 2px' }}>
            🎛️ 런웨이 시뮬레이터
          </p>
          <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
            슬라이더를 움직여 생존일 변화를 확인하세요
          </p>
        </div>
        {(fixedChange !== 0 || revenueChange !== 0) && (
          <button
            onClick={handleReset}
            style={{
              fontSize: 11, fontWeight: 700, color: '#94A3B8',
              background: '#F1F5F9', border: 'none', borderRadius: 20,
              padding: '5px 12px', cursor: 'pointer',
            }}
          >
            초기화
          </button>
        )}
      </div>

      {/* 시뮬레이션 결과 미리보기 */}
      <div style={{
        padding: '20px 20px 16px',
        background: isImproved ? '#F0FFF4' : isWorsened ? '#FFF5F5' : '#F8F9FB',
        textAlign: 'center',
        transition: 'background 0.3s',
      }}>
        <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600, margin: '0 0 6px' }}>
          {fixedChange === 0 && revenueChange === 0 ? '현재 런웨이' : '시뮬레이션 결과'}
        </p>
        <p style={{
          fontSize: 44, fontWeight: 900, color: simColor,
          margin: '0 0 4px', lineHeight: 1, letterSpacing: '-1px',
          transition: 'color 0.3s',
        }}>
          {isFinite(simulation.days) ? `${Math.floor(simulation.days)}일` : '∞'}
        </p>
        {daysDiff !== null && daysDiff !== 0 && (
          <p style={{
            fontSize: 14, fontWeight: 800, margin: '8px 0 0',
            color: isImproved ? '#38A169' : '#E53E3E',
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: isImproved ? '#C6F6D520' : '#FED7D720',
            borderRadius: 20, padding: '4px 14px',
          }}>
            {isImproved ? '▲' : '▼'} {Math.abs(daysDiff)}일
            {isImproved ? ' 연장!' : ' 단축'}
          </p>
        )}
        {!isFinite(simulation.days) && (fixedChange !== 0 || revenueChange !== 0) && (
          <p style={{
            fontSize: 14, fontWeight: 800, margin: '8px 0 0',
            color: '#4299E1', display: 'inline-flex', alignItems: 'center', gap: 4,
            background: '#EBF8FF', borderRadius: 20, padding: '4px 14px',
          }}>
            🎉 흑자 전환!
          </p>
        )}
      </div>

      {/* 슬라이더들 */}
      <div style={{ padding: '16px 20px 22px' }}>

        {/* 고정비 슬라이더 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 10,
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#475569', margin: 0 }}>
              📋 고정비
            </p>
            <span style={{
              fontSize: 13, fontWeight: 800,
              color: fixedChange < 0 ? '#38A169' : fixedChange > 0 ? '#E53E3E' : '#94A3B8',
              background: fixedChange < 0 ? '#F0FFF4' : fixedChange > 0 ? '#FFF5F5' : '#F8F9FB',
              borderRadius: 20, padding: '3px 10px',
            }}>
              {fixedChange > 0 ? '+' : ''}{fixedChange}%
              {fixedChange !== 0 && (
                <span style={{ marginLeft: 6, fontSize: 11 }}>
                  ({formatWon(Math.round(input.fixedCost * (1 + fixedChange / 100)))})
                </span>
              )}
            </span>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type="range"
              min={-30} max={30} step={5}
              value={fixedChange}
              onChange={e => setFixedChange(Number(e.target.value))}
              style={{
                width: '100%', height: 8, appearance: 'none',
                background: `linear-gradient(to right, #68D391 0%, #68D391 50%, #FC8181 50%, #FC8181 100%)`,
                borderRadius: 4, outline: 'none', cursor: 'pointer',
              }}
            />
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 10, color: '#94A3B8', marginTop: 4,
            }}>
              <span>-30% 절감</span>
              <span>현재</span>
              <span>+30% 증가</span>
            </div>
          </div>
        </div>

        {/* 매출 슬라이더 */}
        {input.monthlyRevenue > 0 && (
          <div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 10,
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#475569', margin: 0 }}>
                📈 매출
              </p>
              <span style={{
                fontSize: 13, fontWeight: 800,
                color: revenueChange > 0 ? '#38A169' : revenueChange < 0 ? '#E53E3E' : '#94A3B8',
                background: revenueChange > 0 ? '#F0FFF4' : revenueChange < 0 ? '#FFF5F5' : '#F8F9FB',
                borderRadius: 20, padding: '3px 10px',
              }}>
                {revenueChange > 0 ? '+' : ''}{revenueChange}%
                {revenueChange !== 0 && (
                  <span style={{ marginLeft: 6, fontSize: 11 }}>
                    ({formatWon(Math.round(input.monthlyRevenue * (1 + revenueChange / 100)))})
                  </span>
                )}
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="range"
                min={-30} max={30} step={5}
                value={revenueChange}
                onChange={e => setRevenueChange(Number(e.target.value))}
                style={{
                  width: '100%', height: 8, appearance: 'none',
                  background: `linear-gradient(to right, #FC8181 0%, #FC8181 50%, #68D391 50%, #68D391 100%)`,
                  borderRadius: 4, outline: 'none', cursor: 'pointer',
                }}
              />
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 10, color: '#94A3B8', marginTop: 4,
              }}>
                <span>-30% 감소</span>
                <span>현재</span>
                <span>+30% 증가</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 힌트 */}
      {fixedChange === 0 && revenueChange === 0 && (
        <div style={{
          padding: '0 20px 18px',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: 12, color: '#94A3B8', margin: 0,
            background: '#F8F9FB', borderRadius: 12, padding: '10px 14px',
          }}>
            💡 고정비를 5%만 줄여도 생존일이 크게 늘어나요!
          </p>
        </div>
      )}
    </div>
  )
}
