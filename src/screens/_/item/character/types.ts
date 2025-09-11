/*
 * @Author: czy0729
 * @Date: 2022-06-17 00:10:37
 * @Last Modified by: czy0729
 * @Last Modified time: 2025-08-14 21:39:35
 */
import { EventType, Id, ImageSource } from '@types'

export type Actors = {
  id: string
  cover: string
  name: string
  nameCn: string
}[]

export type Props = {
  event?: EventType
  index?: number
  type?: 'character' | 'person'
  id?: Id
  cover?: ImageSource | string
  name?: string
  nameCn?: string
  replies?: string
  info?: string
  actors?: Actors
  positions?: string[]
  positionDetails?: string[]

  /** @deprecated */
  position?: string
  children?: any
}
