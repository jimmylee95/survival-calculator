'use client'

import { useState, useMemo } from 'react'
import {
  type FreelancerInput,
  simulateFreelancerRunway,
  formatWon,
  formatDays,
  getEscapeLevel,
} from '@/utils/calculate'

const DANGER_COLORS: Record<string, string> = {
  critical: '#FC8181',
  warning:  '#F6AD55',
  caution:  '#ECC94B',
  safe:     '#68D391',
  infinite: '#63B3ED',
}

interface Props {
  input:       FreelancerInput
  currentDays: number
}

export function FreelancerSlider({ input, currentDays }: Props) {
  const [expenseChange, setExpenseChange] = useState(0)
  const [sideIncomeAdd, setSideIncomeAdd] = useState(0)

  const simulation = useMemo(
    () => simulateFreelancerRunway(input, {
      expenseChange: expenseChange / 100,
      sideIncomeAdd,
    }),
    [input, expenseChange, sideIncomeAdd]
  )

  // 직장인: 날짜가 줄어드는 게 좋음 (탈출이 빨라지니까)
  const daysDiff   = isFinite(simulation.days) && isFinite(currentDays)
    ? Math.floor(currentDays - simulation.days)  // 반대! 줄어든 만큼이 개선
    : null
  const simLevel   = getEscapeLevel(simulation.days)
  const simColor   = DANGER_COLORS[simLevel]
  const isImproved = daysDiff !== null && daysDiff > 0   // 탈출이 앞당겨짐
  const isWorsened = daysDiff !== null && daysDiff < 0   // 탈출이 늦어짐

  function handleReset() {
    setExpenseChange(0)
    setSideIncomeAdd(0)
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 20,
      overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
    }}>
      {/* 헤더 */}
      <div style={{
        padding: '18px 20px 14px', borderBottom: '1px solid #F1F5F9',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#1A1F5E', margin: '0 0 2px' }}>
            만약에 계산기
          </p>
          <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
            슬라이더를 움직여 탈출 시기를 앞당겨 보세요
          </p>
        </div>
        {(expenseChange !== 0 || sideIncomeAdd !== 0) && (
          <button onClick={handleReset}
            style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', background: '#F1F5F9', border: 'none', borderRadius: 20, padding: '5px 12px', cursor: 'pointer' }}>
            초기화
          </button>
        )}
      </div>

      {/* 시뮬레이션 결과 */}
      <div style={{
        padding: '20px 20px 16px',
        background: isImproved ? '#F0FFF4' : isWorsened ? '#FFF5F5' : '#F8F9FB',
        textAlign: 'center', transition: 'background 0.3s',
      }}>
        <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600, margin: '0 0 6px' }}>
          {expenseChange === 0 && sideIncomeAdd === 0 ? '현재 탈출까지' : '시뮬레이션 결과'}
        </p>
        <p style={{
          fontSize: 44, fontWeight: 900, color: simColor,
          margin: '0 0 4px', lineHeight: 1, letterSpacing: '-1px',
          transition: 'color 0.3s',
        }}>
          {simulation.days === 0 ? '지금 바로!' :
           isFinite(simulation.days) ? formatDays(simulation.days) : '탈출 불가'}
        </p>
        {daysDiff !== null && daysDiff !== 0 && (
          <p style={{
            fontSize: 14, fontWeight: 800, margin: '8px 0 0',
            color: isImproved ? '#38A169' : '#E53E3E',
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: isImproved ? '#C6F6D520' : '#FED7D720',
            borderRadius: 20, padding: '4px 14px',
          }}>
            {isImproved ? '🚀' : '😥'} {Math.abs(daysDiff)}일
            {isImproved ? ' 앞당겨짐!' : ' 늦어짐'}
          </p>
        )}
        {simulation.days === 0 && (expenseChange !== 0 || sideIncomeAdd !== 0) && (
          <p style={{
            fontSize: 14, fontWeight: 800, margin: '8px 0 0',
            color: '#4299E1', display: 'inline-flex', alignItems: 'center', gap: 4,
            background: '#EBF8FF', borderRadius: 20, padding: '4px 14px',
          }}>
            🎉 이미 목표 달성!
          </p>
        )}
      </div>

      {/* 슬라이더들 */}
      <div style={{ padding: '16px 20px 22px' }}>

        {/* 생활비 슬라이더 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#475569', margin: 0 }}>🏠 생활비</p>
            <span style={{
              fontSize: 13, fontWeight: 800,
              color: expenseChange < 0 ? '#38A169' : expenseChange > 0 ? '#E53E3E' : '#94A3B8',
              background: expenseChange < 0 ? '#F0FFF4' : expenseChange > 0 ? '#FFF5F5' : '#F8F9FB',
              borderRadius: 20, padding: '3px 10px',
            }}>
              {expenseChange > 0 ? '+' : ''}{expenseChange}%
              {expenseChange !== 0 && (
                <span style={{ marginLeft: 6, fontSize: 11 }}>
                  ({formatWon(Math.round(input.monthlyExpense * (1 + expenseChange / 100)))})
                </span>
              )}
            </span>
          </div>
          <input type="range" min={-30} max={30} step={5} value={expenseChange}
            onChange={e => setExpenseChange(Number(e.target.value))}
            style={{ width: '100%', height: 8, appearance: 'none', background: 'linear-gradient(to right, #68D391 0%, #68D391 50%, #FC8181 50%, #FC8181 100%)', borderRadius: 4, outline: 'none', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94A3B8', marginTop: 4 }}>
            <span>-30% 절약</span><span>현재</span><span>+30% 증가</span>
          </div>
        </div>

        {/* 부업 수입 슬라이더 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#475569', margin: 0 }}>💡 부업 수입 추가</p>
            <span style={{
              fontSize: 13, fontWeight: 800,
              color: sideIncomeAdd > 0 ? '#38A169' : '#94A3B8',
              background: sideIncomeAdd > 0 ? '#F0FFF4' : '#F8F9FB',
              borderRadius: 20, padding: '3px 10px',
            }}>
              +{formatWon(sideIncomeAdd)}
            </span>
          </div>
          <input type="range" min={0} max={3_000_000} step={100_000} value={sideIncomeAdd}
            onChange={e => setSideIncomeAdd(Number(e.target.value))}
            style={{ width: '100%', height: 8, appearance: 'none', background: 'linear-gradient(to right, #E2E8F0 0%, #68D391 100%)', borderRadius: 4, outline: 'none', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94A3B8', marginTop: 4 }}>
            <span>+0원</span><span>+150만원</span><span>+300만원</span>
          </div>
        </div>
      </div>

      {/* 힌트 */}
      {expenseChange === 0 && sideIncomeAdd === 0 && (
        <div style={{ padding: '0 20px 18px', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, background: '#F8F9FB', borderRadius: 12, padding: '10px 14px' }}>
            💡 생활비를 줄이거나 부업을 시작하면 탈출이 빨라져요!
          </p>
        </div>
      )}
    </div>
  )
}
