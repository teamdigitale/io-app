/**
 * Sets up store, navigation and initial app screen.
 *
 * @flow
 */

'use strict'

import React, { Component } from 'react'
import { AppState } from 'react-native'

import { Provider, connect } from 'react-redux'
import type { MapStateToProps } from 'react-redux'
import { addNavigationHelpers } from 'react-navigation'
import Mixpanel from 'react-native-mixpanel'

import { StyleProvider } from 'native-base'
import getTheme from '../native-base-theme/components'
import material from '../native-base-theme/variables/material'

import configureStore from './store/configureStore'
import { ProfileNavigator, HomeNavigator } from './routes'

import { appStateChange } from './actions'

import configureErrorHandler from './utils/configureErrorHandler'

import config from './config'
import type { NavigationState } from 'react-navigation/src/TypeDefinition'

configureErrorHandler()

Mixpanel.sharedInstanceWithToken(config.mixpanelToken)

const theme = getTheme(material)

type AppNavigationProps = {
  nav: NavigationState,
  dispatch: Dispatch,
  store: Object
}

/**
 * Implements the main app navigator
 */
class AppNavigation extends Component<AppNavigationProps> {
  constructor(props) {
    super(props)

    AppState.addEventListener('change', this.handleAppStateChange)
  }

  handleAppStateChange = nextAppState => {
    this.props.dispatch(appStateChange(nextAppState))
  }

  render() {
    const profile = this.props.store.getState().user.profile
    const Navigator = profile ? ProfileNavigator : HomeNavigator

    return (
      <Navigator
        navigation={addNavigationHelpers({
          dispatch: this.props.dispatch,
          state: this.props.nav
        })}
      />
    )
  }
}

const mapStateToProps: MapStateToProps<*, *, *> = (state: Object) => ({
  nav: state.nav
})

const AppWithNavigationState = connect(mapStateToProps)(AppNavigation)

type RootProps = {}

type RootState = {
  isLoading: boolean,
  store: Object
}

/**
 * Root component of the application
 */
class Root extends Component<RootProps, RootState> {
  constructor() {
    super()

    const store = configureStore(() =>
      this.setState({
        isLoading: false
      })
    )

    this.state = {
      isLoading: true,
      store: store
    }
  }

  render() {
    if (this.state.isLoading) {
      return null
    }

    const { store } = this.state

    return (
      <StyleProvider style={theme}>
        <Provider store={store}>
          <AppWithNavigationState store={store} />
        </Provider>
      </StyleProvider>
    )
  }
}

module.exports = () => Root
