/*
 * @Author: czy0729
 * @Date: 2022-03-11 23:02:42
 * @Last Modified by: czy0729
 * @Last Modified time: 2025-10-22 10:33:33
 */
import React from 'react'
import { View } from 'react-native'
import { Flex, Header as HeaderComp, HeaderV2Popover, Image, Text, UserStatus } from '@components'
import { _, useStore } from '@stores'
import { getCoverLarge, getSPAParams, open } from '@utils'
import { t } from '@utils/fetch'
import { useObserver } from '@utils/hooks'
import { HOST, TEXT_MENU_BROWSER, TEXT_MENU_SPA, URL_SPA } from '@constants'
import IconFavor from '../component/icon-favor'
import { COMPONENT, DATA, TEXT_COPY } from './ds'
import { styles } from './styles'

import type { Ctx } from '../types'
import type { Props } from './types'

function Header({ fixed }: Props) {
  const { $, navigation } = useStore<Ctx>(COMPONENT)

  return useObserver(() => {
    const { avatar, userId } = $.detail

    return (
      <HeaderComp
        mode='float'
        fixed={fixed}
        alias='目录详情'
        hm={$.hm}
        headerTitle={
          <Flex style={styles.container}>
            {!!avatar && (
              <View style={_.mr.sm}>
                <UserStatus userId={userId} mini>
                  <Image
                    src={getCoverLarge(avatar)}
                    size={28}
                    radius={_.radiusXs}
                    placeholder={false}
                  />
                </UserStatus>
              </View>
            )}
            <Flex.Item>
              <Text numberOfLines={1}>{$.detail.title}</Text>
            </Flex.Item>
          </Flex>
        }
        headerRight={() => (
          <Flex>
            <IconFavor $={$} />
            <HeaderV2Popover
              data={DATA}
              onSelect={title => {
                if (title === TEXT_COPY) {
                  $.onCopy(navigation)
                } else if (title === TEXT_MENU_BROWSER) {
                  open(`${HOST}/index/${$.catalogId}`)
                } else if (title === TEXT_MENU_SPA) {
                  open(
                    `${URL_SPA}/${getSPAParams('CatalogDetail', {
                      catalogId: $.catalogId
                    })}`
                  )
                }

                t('目录详情.右上角菜单', {
                  key: title
                })
              }}
            />
          </Flex>
        )}
      />
    )
  })
}

export default Header
