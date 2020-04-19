/*
 * @Author: czy0729
 * @Date: 2020-01-03 11:23:42
 * @Last Modified by: czy0729
 * @Last Modified time: 2020-04-19 14:51:41
 */
import React from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { Shadow, Flex, Text, Touchable } from '@components'
import { Cover } from '@screens/_'
import { t } from '@utils/fetch'
import { _ } from '@stores'

const width = _.window.width - _.wind * 2
const height = width * (_.isPad ? 0.32 : 0.42)

function Item(
  { id, name, title, info, last, book, anime, music, game, real },
  { $, navigation }
) {
  if (!book && !anime && !music && !game && !real) {
    return null
  }

  const styles = memoStyles()
  const { list, collect = '-' } = $.catalogDetail(id)
  const text = []
  if (name) text.push(name)
  if (last) text.push(last)
  if (collect) text.push(`${collect}收藏`)
  return (
    <Shadow style={styles.shadow} initHeight={154}>
      <Touchable
        onPress={() => {
          t('目录.跳转', {
            to: 'CatalogDetail',
            catalogId: id
          })

          navigation.push('CatalogDetail', {
            catalogId: id
          })
        }}
      >
        <Flex style={styles.item} direction='column' justify='center'>
          <Text type='title' bold size={15} align='center' numberOfLines={1}>
            {title}
          </Text>
          <Text style={_.mt.xs} size={12} align='center' numberOfLines={1}>
            {info}
          </Text>
          <Flex style={[styles.images, _.mt.sm]}>
            {list
              .filter((item, index) => index < (_.isPad ? 4 : 3))
              .map(item => (
                <Cover
                  key={item.id}
                  style={styles.image}
                  size={56}
                  radius={4}
                  src={item.image}
                />
              ))}
            {list.length ? (
              <Text style={_.ml.xs} type='sub' size={13} bold>
                +{list.length}
              </Text>
            ) : (
              <Text type='sub' size={12}>
                ...
              </Text>
            )}
          </Flex>
          {!!text.length && (
            <Text style={_.mt.sm} size={12}>
              {text.join(' / ')}
            </Text>
          )}
        </Flex>
      </Touchable>
    </Shadow>
  )
}

Item.contextTypes = {
  $: PropTypes.object,
  navigation: PropTypes.object
}

export default observer(Item)

const memoStyles = _.memoStyles(_ => ({
  shadow: {
    marginTop: _.space,
    marginLeft: _.wind
  },
  item: {
    width,
    height,
    paddingHorizontal: _.lg,
    backgroundColor: _.colorPlain,
    borderColor: _.colorBorder,
    borderWidth: _.hairlineWidth,
    borderRadius: _.radiusXs,
    overflow: 'hidden'
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height
  },
  images: {
    height: 56
  },
  image: {
    marginHorizontal: _.xs
  }
}))
