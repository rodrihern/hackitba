'use client'

import React from 'react'

interface FilterChipProps {
  label: React.ReactNode
  selected: boolean
  visualSelected?: boolean
  onChange: () => void
  variant?: 'default' | 'badge' | 'category'
  className?: string
}

export function FilterChip({ label, selected, visualSelected, onChange, variant = 'default', className = '' }: FilterChipProps) {
  const isVisuallySelected = visualSelected !== undefined ? visualSelected : selected
  
  return (
    <button
      onClick={onChange}
      role="checkbox"
      aria-checked={selected}
      className={`
        inline-flex items-center justify-center whitespace-nowrap
        transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-1
        font-medium text-sm
        ${variant === 'default' ? defaultStyles(isVisuallySelected) : variant === 'badge' ? badgeStyles(isVisuallySelected) : categoryStyles(isVisuallySelected)}
        ${className}
      `}
    >
      <span className="inline-flex items-center">{label}</span>
    </button>
  )
}

function defaultStyles(selected: boolean) {
  return selected
    ? 'px-4 py-2 rounded-xl border-2 border-transparent bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300/60 hover:bg-indigo-700 active:bg-indigo-800'
    : 'px-4 py-2 rounded-xl border-2 border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-100 hover:border-gray-300 active:bg-gray-100'
}

function categoryStyles(selected: boolean) {
  return selected
    ? 'px-4 py-2.5 rounded-full border-2 border-transparent bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md ring-2 ring-violet-300/60 hover:from-indigo-700 hover:to-violet-700 active:from-indigo-800 active:to-violet-800'
    : 'px-4 py-2.5 rounded-full border-2 border-gray-200 bg-white text-gray-700 shadow-sm hover:border-indigo-300 hover:bg-indigo-50/40 active:bg-indigo-100/40'
}

function badgeStyles(selected: boolean) {
  return selected
    ? 'px-3 py-2 rounded-xl border-2 border-transparent font-bold bg-white/80 backdrop-blur-sm ring-2 ring-indigo-600 hover:bg-white'
    : 'px-3 py-2 rounded-xl border-2 border-gray-200 font-bold bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
}

interface FilterGroupProps {
  title: string
  children: React.ReactNode
}

export function FilterGroup({ title, children }: FilterGroupProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest opacity-60">
          {title}
        </h3>
      </div>
      <div>
        {children}
      </div>
    </div>
  )
}
