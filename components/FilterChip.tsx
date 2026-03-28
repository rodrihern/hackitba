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
        transition-all duration-200 
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
        font-medium text-sm
        ${variant === 'default' ? defaultStyles(isVisuallySelected) : variant === 'badge' ? badgeStyles(isVisuallySelected) : categoryStyles(isVisuallySelected)}
        ${className}
      `}
    >
      <span className="inline-flex items-center gap-1.5">
        {isVisuallySelected && (variant === 'default' || variant === 'category') && (
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
        {label}
      </span>
    </button>
  )
}

function defaultStyles(selected: boolean) {
  return selected
    ? 'px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 active:bg-indigo-800'
    : 'px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100'
}

function categoryStyles(selected: boolean) {
  return selected
    ? 'px-4 py-2.5 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-violet-700 active:from-indigo-800 active:to-violet-800'
    : 'px-4 py-2.5 bg-white text-gray-700 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40 active:bg-indigo-100/40 hover:shadow-sm'
}

function badgeStyles(selected: boolean) {
  return selected
    ? 'px-3 py-2 rounded-lg font-bold ring-2 ring-indigo-600 ring-offset-0 bg-white/80 backdrop-blur-sm'
    : 'px-3 py-2 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all'
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
