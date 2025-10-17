/*
 * @Author: czy0729
 * @Date: 2024-08-25 00:59:00
 * @Last Modified by: czy0729
 * @Last Modified time: 2025-10-11 05:46:05
 */
import React from 'react'
import { Flex, Link, Text } from '@components'
import { _ } from '@stores'
import { useObserver } from '@utils/hooks'
import { Tag } from '../../../base'
import { styles } from './styles'
import { Props } from './types'

function Content({
  type,
  cn,
  jp,
  replies,
  info = '',
  position,
  positionDetails,
  linkProps
}: Props) {
  return useObserver(() => {
    const infos = String(info)
      .split('/')
      .map(item => item.trim())
      .filter(Boolean)

    return (
      <Link {...linkProps} style={styles.touch}>
        <Flex wrap='wrap'>
          <Text size={15} numberOfLines={2} bold>
            {cn}{' '}
          </Text>
          {!!jp && jp !== cn && (
            <Text type='sub' size={11} lineHeight={15} bold>
              {jp}{' '}
            </Text>
          )}
          {!!replies && (
            <Text type='main' size={11} lineHeight={15} bold>
              {replies.replace(/\(|\)/g, '')}
            </Text>
          )}
        </Flex>

        <Flex style={_.mt.xs} wrap='wrap'>
          {position.map((item, index) => (
            <Flex key={item} style={styles.position}>
              <Tag type={type === 'character' ? 'main' : 'primary'} value={item} />
              {!!positionDetails[index] && (
                <Text style={_.ml.xs} size={10} bold>
                  {positionDetails[index]}
                </Text>
              )}
            </Flex>
          ))}
        </Flex>

        {!!infos.length && (
          <Flex style={_.mt.sm} wrap='wrap'>
            {infos.map((item, index) => (
              <>
                {!!index && (
                  <Text key={`split-${index}`} size={11} bold>
                    {' '}
                    /{' '}
                  </Text>
                )}
                <Text key={index} size={11} bold>
                  {item}
                </Text>
              </>
            ))}
          </Flex>
        )}
      </Link>
    )
  })
}

export default Content
