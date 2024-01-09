/*
 * @Author: czy0729
 * @Date: 2022-03-10 17:27:04
 * @Last Modified by: czy0729
 * @Last Modified time: 2024-01-09 16:38:21
 */
import React, { useEffect } from 'react'
import { useNavigation, useObserver } from '@utils/hooks'
import { STORYBOOK } from '@constants'
import { Track } from '../track'
import HeaderComponent from './header-component'
import Placeholder from './placeholder'
import Popover from './popover'
import { updateHeader } from './utils'
import { IHeader } from './types'

/**
 * 适配 react-navigation@6
 *  - 完全替代 @utils/decorators/withHeader.js
 */
const Header: IHeader = ({
  mode,
  fixed = false,
  title,
  domTitle,
  hm,
  alias,
  headerLeft = null,
  headerRight = null,
  headerTitle = null,
  headerTitleAlign = 'center',
  headerTitleStyle,
  statusBarEventsType,
  onBackPress
}) => {
  const navigation = useNavigation()
  useEffect(() => {
    updateHeader({
      navigation,
      mode,
      fixed,
      title,
      headerLeft,
      headerRight,
      headerTitleAlign,
      headerTitleStyle,
      statusBarEventsType,
      onBackPress
    })
  }, [
    navigation,
    mode,
    fixed,
    title,
    headerLeft,
    headerRight,
    headerTitleAlign,
    headerTitleStyle,
    statusBarEventsType,
    onBackPress
  ])

  return useObserver(() => {
    const passProps = {
      navigation,
      fixed,
      mode,
      title,
      statusBarEventsType,
      headerTitle,
      headerLeft,
      headerRight,
      onBackPress
    }
    return (
      <>
        {mode ? (
          <HeaderComponent {...passProps} />
        ) : STORYBOOK ? (
          <>
            <Placeholder />
            <HeaderComponent {...passProps} fixed />
          </>
        ) : null}
        <Track title={title} domTitle={domTitle} hm={hm} alias={alias} />
      </>
    )
  })
}

Header.Popover = Popover

Header.Placeholder = Placeholder

export { Header }
