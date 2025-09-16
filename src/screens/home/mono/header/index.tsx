/*
 * @Author: czy0729
 * @Date: 2022-03-15 02:13:43
 * @Last Modified by: czy0729
 * @Last Modified time: 2025-09-16 16:37:44
 */
import React from 'react'
import { Flex, Header as HeaderComp } from '@components'
import { useStore } from '@stores'
import { useObserver } from '@utils/hooks'
import Extra from '../component/extra'
import HeaderTitle from '../component/header-title'
import { Ctx } from '../types'
import Menu from './menu'
import { COMPONENT } from './ds'
import { styles } from './styles'
import { Props } from './types'

function Header({ fixed }: Props) {
  const { $ } = useStore<Ctx>(COMPONENT)

  return useObserver(() => (
    <HeaderComp
      mode='transition'
      statusBarEventsType='Topic'
      fixed={fixed}
      title='人物'
      domTitle={$.jp || $.cn}
      hm={[$.url, 'Mono']}
      headerTitle={<HeaderTitle />}
      headerRight={() => (
        <Flex style={styles.headerRight}>
          <Extra />
          <Menu />
        </Flex>
      )}
    />
  ))
}

export default Header
