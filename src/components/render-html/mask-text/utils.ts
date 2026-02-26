/*
 * @Author: czy0729
 * @Date: 2026-02-26 21:45:43
 * @Last Modified by: czy0729
 * @Last Modified time: 2026-02-26 21:53:32
 */
import React from 'react'

import type { ReactNode } from '@types'

export function extractText(children: ReactNode): string {
  try {
    const rawText = _extract(children) || ''
    const visualLength = calculateVisualLength(rawText)
    const finalLength = Math.max(visualLength, 2)
    return '　'.repeat(finalLength)
  } catch {
    return '　　'
  }
}

function _extract(children: ReactNode): string {
  if (children == null || typeof children === 'boolean') return ''

  if (typeof children === 'string' || typeof children === 'number') {
    return String(children)
  }

  if (Array.isArray(children)) {
    return children.map(_extract).join('')
  }

  if (React.isValidElement(children)) {
    return _extract(children.props?.children)
  }

  return ''
}

function calculateVisualLength(text: string): number {
  let units = 0

  for (const char of text) {
    if (isCJK(char)) {
      units += 1
    } else {
      units += 0.5
    }
  }

  return Math.ceil(units)
}

// 判断是否 CJK
function isCJK(char: string): boolean {
  const code = char.codePointAt(0)!
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3400 && code <= 0x4dbf) ||
    (code >= 0x20000 && code <= 0x2a6df)
  )
}
