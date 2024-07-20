/*
 * @Author: czy0729
 * @Date: 2024-07-19 21:46:50
 * @Last Modified by: czy0729
 * @Last Modified time: 2024-07-19 22:03:27
 */
import { SubjectId } from '@types'
import { getTimestamp } from '../../index'
import { SORT } from '../anime'
import { NSFW_COLLECTED, NSFW_FIRST, NSFW_SORT, NSFW_YEAR } from './ds'
import { Finger, Item, Query, SearchResult } from './types'

export { NSFW_COLLECTED, NSFW_FIRST, NSFW_SORT, NSFW_YEAR }

const SEARCH_CACHE: Record<Finger, SearchResult> = {}
let nsfw: Item[] = []
let loaded: boolean = false

function getData() {
  return nsfw
}

/** 初始化番剧数据 */
export async function init() {
  if (loaded) return

  nsfw = require('@assets/json/thirdParty/nsfw.min.json')
  loaded = true
}

/** 根据 index 选一项 */
export function pick(index: number): Item {
  init()
  return getData()[index]
}

/** 根据条目 id 查询一项 */
export function findNSFW(id: SubjectId): Item {
  init()
  return getData().find(item => item.i == id)
}

/** 只返回下标数组对象 */
export function search(query: Query): SearchResult {
  init()

  // 查询指纹
  const finger = JSON.stringify(query || {})
  const { first, year, sort } = query || {}
  if (sort !== '随机' && SEARCH_CACHE[finger]) return SEARCH_CACHE[finger]

  let _list = []
  let yearReg: RegExp
  if (year) {
    yearReg = new RegExp(year === '2000以前' ? '^(2000|1\\d{3})' : `^(${year})`)
  }

  const data = getData()
  data.forEach((item, index) => {
    let match = true

    if (match && first) match = first === item.f
    if (match && year) match = yearReg.test(item.d)
    if (match) _list.push(index)
  })

  switch (sort) {
    case '上映时间':
      _list = _list.sort((a, b) => SORT.begin(data[a], data[b], 'd'))
      break

    case '名称':
      _list = _list.sort((a, b) => SORT.name(data[a], data[b], 'f'))
      break

    case '排名':
      _list = _list.sort((a, b) => SORT.rating(data[a], data[b], 's', 'f'))
      break

    case '评分人数':
      _list = _list.sort((a, b) => SORT.total(data[a], data[b], 'c'))
      break

    case '随机':
      _list = _list.sort(() => SORT.random())
      break

    default:
      break
  }

  const result: SearchResult = {
    list: _list,
    pagination: {
      page: 1,
      pageTotal: 1
    },
    _finger: finger,
    _loaded: getTimestamp()
  }
  SEARCH_CACHE[finger] = result

  return result
}
