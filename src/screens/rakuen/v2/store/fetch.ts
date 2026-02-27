/*
 * @Author: czy0729
 * @Date: 2024-05-16 19:56:57
 * @Last Modified by: czy0729
 * @Last Modified time: 2026-02-27 21:18:03
 */
import { rakuenStore } from '@stores'
import Computed from './computed'

export default class Fetch extends Computed {
  fetchRakuen = async () => {
    const type = this.type(this.state.page)
    return type === 'hot'
      ? rakuenStore.fetchRakuenHot()
      : rakuenStore.fetchRakuen(this.state.scope, type)
  }

  /** 下拉刷新 */
  onHeaderRefresh = () => {
    return this.fetchRakuen()
  }
}
