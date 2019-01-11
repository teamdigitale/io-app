[![Codacy Badge](https://api.codacy.com/project/badge/Grade/4bfe698a793a4270b9bac004515225a3)](https://www.codacy.com/app/cloudify/italia-app?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=teamdigitale/italia-app&amp;utm_campaign=Badge_Grade)

[![dependencies](https://david-dm.org/teamdigitale/italia-app/status.svg)](https://david-dm.org/teamdigitale/italia-app)

[![CircleCI](https://circleci.com/gh/teamdigitale/italia-app.svg?style=svg)](https://circleci.com/gh/teamdigitale/italia-app)

[![codecov](https://codecov.io/gh/teamdigitale/italia-app/branch/master/graph/badge.svg)](https://codecov.io/gh/teamdigitale/italia-app)

[![Maintainability](https://api.codeclimate.com/v1/badges/d813b789c3a2085bd8f4/maintainability)](https://codeclimate.com/github/teamdigitale/italia-app/maintainability)

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fteamdigitale%2Fitalia-app.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fteamdigitale%2Fitalia-app?ref=badge_shield)

# The mobile app of the Digital Citizenship project

## FAQ

### What is the Digital Citizenship project?

Digital Citizenship aims at bringing citizens to the center of the Italian public administrations services.

The project comprises two main components:

* a platform made of elements that enable the development of citizen-centric digital services;
* an interface for citizens to manage their data and their digital citizen profiles.

### What is the Digital Citizenship mobile app?

The Digital Citizenship mobile app is a native mobile application for iOS and Android with a dual purpose:

* To be an interface for citizens to manage their data and their digital citizen profile;
* To act as _reference implementation_ of the integrations with the Digital Citizenship platform.

### Who develops the app?

The development of the app is carried out by several contributors:

* the [Digital Transformation Team](https://teamdigitale.governo.it/)
* the [Agency for Digital Italy](http://www.agid.gov.it/)
* volunteers who support the project.

### Can I use the app?

The app is being tested with a restricted group of users and stakeholders so for now, the app is not available in the app stores.

However, if you are a developer you can build the app on your computer and install it manually on your device. You will need a [SPID account](https://www.agid.gov.it/en/platforms/spid) to login to the app.

### When will the app be available?

When the app will achieve the appropriate level of quality and usefulness, it will be made available to all citizens on the Apple and Google app stores.

### How can I help you?

[Reporting bugs](https://github.com/teamdigitale/italia-app/issues), bug fixes, [translations](https://github.com/teamdigitale/italia-app/tree/master/locales) and generally any improvement is welcome! [Send us a Pull Request](https://github.com/teamdigitale/italia-app/pulls)!

If you have some time to spare and wish to get involved on a regular basis, [contact us](mailto:federico@teamdigitale.governo.it).

## Main technologies used

* [TypeScript](https://www.typescriptlang.org/)
* [Redux](http://redux.js.org/)
* [Redux Saga](https://redux-saga.js.org/)
* [React Native](https://facebook.github.io/react-native)
* [Native Base](http://nativebase.io)

## Architecture

### SPID Authentication

The application relies on a [backend](https://github.com/teamdigitale/ItaliaApp-backend) for the authentication through SPID (the Public System for Digital Identity) and for interacting with the other components and APIs that are part of the [digital citizenship project](https://github.com/teamdigitale/digital-citizenship).

The backend implements a SAML2 Service Provider that deals with user authentication with the SPID Identity Providers (IdP).

The authentication between the application and the backend takes place via a session token, generated by the backend at the time of the authentication with the SPID IdP.

Once the backend communicates the session token to the application, it is used for all subsequent calls that the application makes to the API exposed by the backend.

The authentication flow is as follows:

1. The user selects the IdP;
1. The app opens a webview on the SAML SP authentication endpoint implemented in the backend, which specifies: the entity ID of the IdP selected by the user and, as returns URL, the URL of the endpoint that generates a new session token.
1. The SAML SP logic takes over the authentication process by redirecting the user to the chosen IdP.
1. After the authentication, a redirect is made from the IdP to the backend endpoint that deals with the generation of a new session token.
1. The endpoint that generates a new token receives the SPID attributes via the HTTP header; then, it generates a new random session token and returns to the webview an HTTP redirect to an URL well-known containing the session token.
1. The app, which monitors the webview, intercepts this URL before the HTTP request is made, extracts the session token and ends the authentication flow by closing the webview.
1. Next, the session token is used by the app to make calls to the backend API.

## How to contribute

### Pre-requisites

#### nodenv

On macOS and Linux we recommend the use of [nodenv](https://github.com/nodenv/nodenv) for managing multiple versions of NodeJS.

The node version used in this project is stored in [.node-version](.node-version).

If you already have nodenv installed and configured on your system, the correct version node will be set when you access the app directory.

#### yarn

For the management of javascript dependencies we use [Yarn](https://yarnpkg.com/lang/en/).

#### rbenv

On macOS and Linux, for managing multiple versions of Ruby (needed for _Fastlane_ and _CocoaPods_), we recommend the use of [rbenv](https://github.com/rbenv/rbenv).

The Ruby version used in this project is stored in [.ruby-version](.ruby-version).

If you already have rbenv installed and configured on your system, the correct Ruby version will be set, when you access the app directory.

Some dependencies (eg CocoaPods) are installed via [bundler](https://bundler.io/).

#### React Native

Follow the tutorial [Building Projects with Native Code](https://facebook.github.io/react-native/docs/getting-started.html) for your operating system.

If you have a macOS system, you can follow both the tutorial for iOS and for Android. If you have a Linux or Windows system, you need only to install the development environment for Android.

### Building and launching on the simulator

#### Dependencies

First we install the libraries used by the project:

```
$ bundle install
$ yarn install
$ cd ios
$ pod install
```

#### Generating API definitions and translations

The second step is to generate the definitions from the openapi specs and from the YAML translations:

```
$ yarn generate:all
```

#### App build configuration

Finally, we copy the sample configuration for the app.

```
$ cp .env.example .env
```

Here is a still NOT complete table of the environment variables you can set:

| NAME                           | DEFAULT |                                                                                                 |
|--------------------------------|---------|-------------------------------------------------------------------------------------------------|
| DEBUG_BIOMETRIC_IDENTIFICATION | NO      | If set to "YES" an Alert is rendered with the exact result code of the biometric identification. |

_Note: The sample configuration sets the app to interface with our test environment, on which we work continuously; therefore, it may occur that some features are not always available or are fully working._

#### Installation on the simulator

On Android (the device simulator must be [launched manually](https://medium.com/@deepak.gulati/running-react-native-app-on-the-android-emulator-11bf309443eb)):

```
$ react-native run-android
```

On iOS (the simulator will be launched automatically):

```
$ react-native run-ios
```

_Note: the app uses CocoaPods, the project to run is therefore `ItaliaApp.xcworkspace` instead of `ItaliaApp.xcodeproj` (`run-ios` will automatically detect it)._

### Build (release)

For the release of the app on the stores we use [Fastlane](https://fastlane.tools/).

#### iOS

The beta distribution is done with [TestFlight](https://developer.apple.com/testflight/).

To release a new beta:

```
$ cd ios
$ bundle exec fastlane testflight_beta
```

#### Android

To release a new alpha:

```
$ bundle exec fastlane alpha
```

_Note: the alpha releases on Android are automatically carried by the `alpha-release-android` job on [circleci](https://circleci.com/gh/teamdigitale/italia-app) on each by merge to the master branch._

### Installation on physical devices (development)

#### iOS

For this step you’ll need to have a proper iOS development certificate on your dev machine that is also installed on your physical device.

```
react-native run-ios --configuration Release --device 'YOUR_DEVICE_NAME'
```

### Development with Backend App and Local Test IDP

To develop the application on your machine using the Backend App and an IDP test, you need to follow some additional steps as described below.

#### Installazione di App Backend e IDP di test

Follow the documentation of the repository [italia-backend](https://github.com/teamdigitale/italia-backend).

#### WebView, HTTPS and self-signed certificates

At the moment, react-native does not allow to open WebView on HTTPS url with a self-signed certificate. However, the test IDP uses HTTPS and a self-signed certificate. To avoid this problem, it is possible to locally install a Proxy that acts as a proxy-pass to the Backend App and the IDP.

##### Installation of mitmproxy

[Mitmproxy](https://mitmproxy.org/) is a simple proxy to use and is also suitable for our purpose. For installation, follow the documentation page on the [official website](https://docs.mitmproxy.org/stable/overview-installation/).

The script `scripts/mitmproxy_metro_bundler.py` allows the proxy to intercept requests to the Simulator and, only in case of specific ports, to proxy the localhost. Start the proxy with the following command:

```
SIMULATOR_HOST_IP=XXXXX mitmweb --listen-port 9060 --web-port 9061 --ssl-insecure -s scripts/mitmproxy_metro_bundler.py
```

Add in place of `XXXXX`:

* `10.0.2.2` (Standard Android Emulator)
* `10.0.3.2` (Genymotion Android Emulator)

##### Installing the mitmproxy certificate within the emulator Android

Install certificate mitmproxy within the emulator following the official  [guide](https://docs.mitmproxy.org/stable/concepts-certificates/).

#### Set the proxy for the connection in the Android emulator

In the connection configuration enter:

* Proxy IP: `10.0.2.2` (or `10.0.3.2` if you use Genymotion)
* Proxy port: `9060`

### Update the app icons

Follow [this tutorial](https://blog.bam.tech/developper-news/change-your-react-native-app-icons-in-a-single-command-line).

### Internationalization

For multi-language support the application uses:

* [react-native-i18n](https://github.com/AlexanderZaytsev/react-native-i18n) for the integration of translations with user preferences
* YAML files in the directory `locales`
* A YAML-to-typescript conversion script (`generate:locales`).

To add a new language you must:

1. Create a new directory under [locales](locales) using the language code as the name (e.g. `es` for Spanish, `de` for German, etc...).
1. Copy the content from the base language (`en`).
1. Proceed with the translation by editing the YAML and Markdown files.
1. Run the Typescript code generation script (`npm run generate:locales`).
1. Edit the file [ts/i18n.ts](ts/i18n.ts) by adding the new language in the variable `I18n.translations`.

### Error handling

The application uses a custom handler to intercept and notify javascript errors caused by unhandled exceptions. The custom handler code is visible in the file `ts/utils/configureErrorHandler.ts`

### Connection monitoring

The application uses the library [react-native-offline](https://github.com/rauliyohmc/react-native-offline) to monitor the connection status. In case of no connection, a bar is displayed that notifies the user.

The connection status is kept inside the Redux store in the variable `state.network.isConnected`, you can use this data to disable some functions during the absence of the connection.

### Deep linking

The application is able to manage _deep links_. The URL scheme is: `ioit://`. The link format is `ioit://<route-name>`.

### Fonts

The application uses the font _Titillium Web_. Fonts are handled differently than Android and iOS. To use the font, `TitilliumWeb-SemiBoldItalic` example, you must apply the following properties for Android:

```css
{
  fontFamily: 'TitilliumWeb-SemiBoldItalic'
}
```

while in iOS the code to be applied is:

```css
{
  fontFamily: 'Titillium Web',
  fontWeight: '600',
  fontStyle: 'italic'
}
```

To manage fonts and variants more easily, we have created utility functions within the file [ts/theme/fonts.ts](ts/theme/fonts.ts).

### Io-Icon-Font

The application uses a custom font-icon from the name 'io-icon-font'. Thanks to the library [react-native-vector-icons](https://github.com/oblador/react-native-vector-icons) which is included in the project, it is possible to create new IconSets. In particular, among the various methods shown in the [appropriate section](https://github.com/oblador/react-native-vector-icons#custom-fonts) of the documentation, we decided to use the one that allows to export the font through IcoMoon. When exporting from [IcoMoon](https://icomoon.io/), you should use the configuration shown in the following picture.

![IcoMoon Export Settings][icomoon-export-settings]

To update the icon-font to a new version, it is necessary to extract and correctly position the following two files from the archive '.zip' generated by IcoMoon:

* `selection.json` contained in the archive root, to be placed in [ts/theme/font-icons/io-icon-font/](ts/theme/font-icons/io-icon-font).
* `io-icon-font.ttf` contained in the directory fonts archive, to be placed in [assets/fonts/io-icon-font/](assets/fonts/io-icon-font).

Once the two files have been copied, it is necessary to update the link of the asset by running:

```
$ react-native link
```

This last command deals in particular with copying the asset within a specific folder of the Android sub-project.

### Theming

The application uses [native-base](https://nativebase.io/) and its components for the graphical interface. In particular, we  decided to use as a basis the theme material provided by the library. Although native-base allows to customize part of the theme through the use of variables, it was nevertheless necessary to implement ad-hoc functions that allow to go to modify the theme of the individual components.

#### Extending Native Base default theme

In the [ts/theme](ts/theme) directory there are some files that allow you to manage the theme in a more flexible way than what native-base permits natively.

##### Variables

To define new variables to use in the components theme, you need to edit the file [ts/theme/variables.ts](ts/theme/variables.ts). This file deals with importing the basic variables defined by the `material` theme of native-base and allows to overwrite / define the value of new variables.

##### Components Theme

The native-base library defines the theme of each individual component in a separate `.ts` file that is named after the specific component. For example, the theme file related to the component `Button` is named `Button.ts`. To redefine the theme of the native-base components, it is necessary to create / modify the files in the [ts/theme/components](ts/theme/components) directory. Every file in this directory must export an object that defines the components theme. Take the file `Content.ts` as an example:

```javascript
import { type Theme } from '../types'
import variables from '../variables'

export default (): Theme => {
  const theme = {
    padding: variables.contentPadding,
    backgroundColor: variables.contentBackground
  }

  return theme
}
```

In this file, you can see how two attributes are redefined (`padding` and `backgroundColor`) using the values ​​in the relative variables. The returned object will be used in the file [ts/theme/index.ts](ts/theme/index.ts) to associate it with a specific component type (in this case `NativeBase.Component`).

A more complex example allows you to use the advanced features of the native-base theming layer.

```javascript
import { type Theme } from '../types'
import variables from '../variables'

export default (): Theme => {
  const theme = {
    '.spacer': {
      '.large': {
        height: variables.spacerLargeHeight
      },

      height: variables.spacerHeight
    },

    '.footer': {
      paddingTop: variables.footerPaddingTop,
      paddingLeft: variables.footerPaddingLeft,
      paddingBottom: variables.footerPaddingBottom,
      paddingRight: variables.footerPaddingRight,
      backgroundColor: variables.footerBackground,
      borderTopWidth: variables.footerShadowWidth,
      borderColor: variables.footerShadowColor
    }
  }

  return theme
}
```

Within the theme file of a single component, it is possible to define specific attributes that will be used only if this specific component has a specific property. By defining in the theme object something like:

```javascript
'.footer': {
  paddingTop: variables.footerPaddingTop
}
```

If necessary, you can use the component by associating the `footer` property in the following way `<Component footer />` and automatically the theming system will apply to the component the defined attributes (`paddingTop: variables.footerPaddingTop`).

Another advanced function allows to define the theme of the child components starting from the parent component. Let's take as an example the following code fragment of a generic component:

```javascript
...
render() {
  return(
    <Content>
      <Button>
        <Text>My button</Text>
      </Button>
    </Content>
  )
}
...
```

The native-base library allows you to define the appearance of the child component `Text` present in the parent `Button`. For example, to define the size of the text in all the buttons in the application, simply enter the following code in the file `ts/theme/components/Button.ts`:

```javascript
import variables from '../variables'

export default (): Theme => {
  const theme = {
    'NativeBase.Text': {
      fontSize: variables.btnTextFontSize
    }
  }

  return theme
}
```

You can go even further and combine the two features seen previously:

```javascript
import variables from '../variables'

export default (): Theme => {
  const theme = {
    '.small': {
      'NativeBase.Text': {
        fontSize: variables.btnTextFontSize
      }
    }
  }

  return theme
}
```

In this case, what is defined within the attribute `NativeBase.Text` will be used only if the button has associated a property with a name `small`.

### Custom UI components

#### TextWithIcon

A simple wrapper in which you can insert an icon and a text that will be rendered side by side.

Example of use:

```javascript
<TextWithIcon danger>
  <IconFont name="io-back" />
  <Text>{I18n.t('onboarding.pin.confirmInvalid')}</Text>
</TextWithIcon>
```

To change the wrapper, icon or text theme, edit the `ts/theme/components/TextWithIcon.ts` file.

### End to end test with Detox (experimental)

For integration tests on simulators we use [Detox](https://github.com/wix/detox).

End to end tests are found in [ts/__e2e__/](ts/__e2e__/).

To compile the app in preparation for the test:

```
$ detox build
```

(optional) Launch the iOS simulator (with [ios-sim](https://www.npmjs.com/package/ios-sim) for convenience):

```
$ ios-sim start --devicetypeid "iPhone-6, 10.2"
```

In case you do not launch the simulator, Detox will launch one in the background.

Launch of the tests:

```
$ detox test
```

[icomoon-export-settings]: docs/icomoon-font-export.png "IcoMoon Export Settings"
