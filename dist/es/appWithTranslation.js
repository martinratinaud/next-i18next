function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

import React, { useMemo } from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { I18nextProvider } from 'react-i18next';
import { createConfig } from './config/createConfig';
import createClient from './createClient';
export { Trans, useTranslation, withTranslation } from 'react-i18next';
export let globalI18n = null;
export const appWithTranslation = (WrappedComponent, configOverride = null) => {
  const AppWithTranslation = props => {
    const {
      _nextI18Next
    } = props.pageProps;
    let locale = null; // Memoize the instance and only re-initialize when either:
    // 1. The route changes (non-shallowly)
    // 2. Router locale changes

    const i18n = useMemo(() => {
      var _userConfig;

      if (!_nextI18Next) return null;
      let {
        userConfig
      } = _nextI18Next;
      const {
        initialI18nStore,
        initialLocale
      } = _nextI18Next;
      locale = initialLocale;

      if (userConfig === null && configOverride === null) {
        throw new Error('appWithTranslation was called without a next-i18next config');
      }

      if (configOverride !== null) {
        userConfig = configOverride;
      }

      if (!((_userConfig = userConfig) !== null && _userConfig !== void 0 && _userConfig.i18n)) {
        throw new Error('appWithTranslation was called without config.i18n');
      }

      const instance = createClient({ ...createConfig({ ...userConfig,
          lng: locale
        }),
        lng: locale,
        resources: initialI18nStore
      }).i18n;
      globalI18n = instance;
      return instance;
    }, [_nextI18Next, locale]);
    return i18n !== null ? /*#__PURE__*/React.createElement(I18nextProvider, {
      i18n: i18n
    }, /*#__PURE__*/React.createElement(WrappedComponent, _extends({
      key: locale
    }, props))) : /*#__PURE__*/React.createElement(WrappedComponent, _extends({
      key: locale
    }, props));
  };

  return hoistNonReactStatics(AppWithTranslation, WrappedComponent);
};