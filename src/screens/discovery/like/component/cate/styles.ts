/*
 * @Author: czy0729
 * @Date: 2023-06-10 23:47:07
 * @Last Modified by: czy0729
 * @Last Modified time: 2023-06-10 23:53:14
 */
import { _ } from '@stores'

export const memoStyles = _.memoStyles(() => ({
  segment: {
    width: _.window.width - _.wind * 2,
    height: _.r(32),
    marginLeft: _.wind,
    marginVertical: _.sm
  }
}))
