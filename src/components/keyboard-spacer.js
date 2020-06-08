/* eslint-disable react/no-unused-state */
/*
 * 弹出的键盘占位
 * @Doc https://github.com/Andr3wHur5t/react-native-keyboard-spacer/blob/master/KeyboardSpacer.js
 * @Author: czy0729
 * @Date: 2019-06-13 00:04:53
 * @Last Modified by: czy0729
 * @Last Modified time: 2019-12-08 02:06:25
 */
import React from 'react'
import PropTypes from 'prop-types'
import {
  Keyboard,
  LayoutAnimation,
  View,
  Dimensions,
  Platform
} from 'react-native'

// From: https://medium.com/man-moon/writing-modern-react-native-ui-e317ff956f02
const defaultAnimation = {
  duration: 500,
  create: {
    duration: 300,
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity
  },
  update: {
    type: LayoutAnimation.Types.spring,
    springDamping: 200
  }
}

export default class KeyboardSpacer extends React.Component {
  static propTypes = {
    topSpacing: PropTypes.number,
    onToggle: PropTypes.func
    // style: ViewPropTypes.style
  }

  static defaultProps = {
    topSpacing: 0,
    onToggle: Function.prototype
  }

  constructor(props, context) {
    super(props, context)
    this.state = {
      keyboardSpace: 0,
      isKeyboardOpened: false
    }
    this._listeners = null
    this.updateKeyboardSpace = this.updateKeyboardSpace.bind(this)
    this.resetKeyboardSpace = this.resetKeyboardSpace.bind(this)
  }

  componentDidMount() {
    const updateListener =
      Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow'
    const resetListener =
      Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide'
    this._listeners = [
      Keyboard.addListener(updateListener, this.updateKeyboardSpace),
      Keyboard.addListener(resetListener, this.resetKeyboardSpace)
    ]
  }

  componentWillUnmount() {
    this._listeners.forEach(listener => listener.remove())
  }

  updateKeyboardSpace(event) {
    if (!event.endCoordinates) {
      return
    }

    let animationConfig = defaultAnimation
    if (Platform.OS === 'ios') {
      animationConfig = LayoutAnimation.create(
        event.duration,
        LayoutAnimation.Types[event.easing],
        LayoutAnimation.Properties.opacity
      )
    }
    LayoutAnimation.configureNext(animationConfig)

    // get updated on rotation
    const screenHeight = Dimensions.get('window').height
    // when external physical keyboard is connected
    // event.endCoordinates.height still equals virtual keyboard height
    // however only the keyboard toolbar is showing if there should be one
    const keyboardSpace =
      screenHeight - event.endCoordinates.screenY + this.props.topSpacing

    this.setState(
      {
        keyboardSpace,
        isKeyboardOpened: true
      },
      this.props.onToggle(true, keyboardSpace)
    )
  }

  resetKeyboardSpace(event) {
    let animationConfig = defaultAnimation
    if (Platform.OS === 'ios') {
      animationConfig = LayoutAnimation.create(
        event.duration,
        LayoutAnimation.Types[event.easing],
        LayoutAnimation.Properties.opacity
      )
    }
    LayoutAnimation.configureNext(animationConfig)

    this.setState(
      {
        keyboardSpace: 0,
        isKeyboardOpened: false
      },
      this.props.onToggle(false, 0)
    )
  }

  render() {
    return <View />
  }
}
