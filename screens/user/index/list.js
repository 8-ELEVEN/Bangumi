/*
 * @Author: czy0729
 * @Date: 2019-05-25 22:57:29
 * @Last Modified by: czy0729
 * @Last Modified time: 2020-04-19 20:30:05
 */
import React from 'react'
import { StyleSheet } from 'react-native'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { Loading, ListView } from '@components'
import { ItemCollections, ItemCollectionsGrid } from '@screens/_'
import { _ } from '@stores'
import { keyExtractor } from '@utils/app'
import { MODEL_COLLECTION_STATUS } from '@constants/model'

export default
@observer
class List extends React.Component {
  static contextTypes = {
    $: PropTypes.object,
    navigation: PropTypes.object
  }

  state = {
    // @issue 列表的滚回顶部scrollToLocation不知道如何正确使用
    // 暂时使用重新渲染的办法解决列表变换置顶问题
    hide: false
  }

  componentWillReceiveProps({ subjectType }) {
    if (subjectType !== this.props.subjectType) {
      this.setState({
        hide: true
      })

      setTimeout(() => {
        this.setState({
          hide: false
        })
      }, 0)
    }
  }

  renderItem = ({ item, index }) => {
    const { $, navigation } = this.context
    const { list } = $.state
    const isDo = $.type === 'do'
    const isOnHold = $.type === 'on_hold'
    const isDropped = $.type === 'dropped'
    const event = {
      id: '我的.跳转'
    }

    if (list) {
      return (
        <ItemCollections
          navigation={navigation}
          index={index}
          isDo={isDo}
          isOnHold={isOnHold}
          isDropped={isDropped}
          event={event}
          {...item}
        />
      )
    }

    const needResetMarginLeft = _.isPad && index % 4 === 0
    return (
      <ItemCollectionsGrid
        style={
          needResetMarginLeft && {
            marginLeft: _.wind + _._wind
          }
        }
        navigation={navigation}
        index={index}
        isOnHold={isOnHold}
        event={event}
        {...item}
      />
    )
  }

  render() {
    const { $ } = this.context
    const { subjectType, title, ...other } = this.props
    const { hide } = this.state
    if (hide) {
      return null
    }

    const userCollections = $.userCollections(
      subjectType,
      MODEL_COLLECTION_STATUS.getValue(title)
    )
    if (!userCollections._loaded) {
      return <Loading />
    }

    const { list } = $.state
    const numColumns = list ? undefined : 4
    return (
      <ListView
        key={`${$.subjectType}${String(numColumns)}`}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.contentContainerStyle}
        data={userCollections}
        numColumns={numColumns}
        renderItem={this.renderItem}
        onHeaderRefresh={$.onHeaderRefresh}
        onFooterRefresh={$.fetchUserCollections}
        {...other}
      />
    )
  }
}

const styles = StyleSheet.create({
  contentContainerStyle: {
    paddingBottom: _.bottom
  }
})
