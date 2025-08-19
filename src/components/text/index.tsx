/*
 * @Author: czy0729
 * @Date: 2022-05-01 11:46:08
 * @Last Modified by: czy0729
 * @Last Modified time: 2025-08-19 20:46:36
 */
import React from 'react'
import { Text as RNText } from 'react-native'
import { useObserver } from 'mobx-react'
import PropTypes from 'prop-types'
import { systemStore } from '@stores'
import { r } from '@utils/dev'
import { WEB } from '@constants'
import { formatS2T, formatSpacing, getTextStyle, setComponentsDefaultProps } from './utils'
import { COMPONENT } from './ds'
import { Context, Props as TextProps, TextType } from './types'

export { setComponentsDefaultProps, getTextStyle, TextType, TextProps }

/** 统一封装文字 */
function TextComp(
  {
    forwardRef,
    style,
    overrideStyle,
    type,
    size,
    lineHeight,
    lineHeightIncrease,
    align,
    bold,
    underline,
    shadow,
    shrink,
    selectable = WEB,
    noWrap,
    s2t = true,
    spacing = true,
    children,
    ...other
  }: TextProps,
  { lineHeightIncrease: contextLineHeightIncrease }: Context = {}
) {
  r(COMPONENT)

  return useObserver(() => {
    let content = children
    if (s2t && systemStore.setting.s2t) content = formatS2T(content)
    if (spacing && systemStore.setting.spacing) content = formatSpacing(content)

    return (
      <RNText
        ref={forwardRef}
        style={getTextStyle({
          style,
          overrideStyle,
          type,
          size,
          lineHeight,
          lineHeightIncrease: contextLineHeightIncrease || lineHeightIncrease,
          align,
          bold,
          underline,
          shadow,
          shrink,
          noWrap
        })}
        allowFontScaling={false}
        selectable={selectable}
        numberOfLines={0}
        {...other}
        suppressHighlighting
        lineBreakStrategyIOS='push-out'
        textBreakStrategy='simple'
        android_hyphenationFrequency='none'
        dataDetectorType='none'
      >
        {content}
      </RNText>
    )
  })
}

TextComp.contextTypes = {
  lineHeightIncrease: PropTypes.number
}

export const Text = TextComp
