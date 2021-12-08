import _slicedToArray from "@babel/runtime/helpers/slicedToArray";
import _defineProperty from "@babel/runtime/helpers/defineProperty";
var __jsx = React.createElement;

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

import React from 'react';
import fs from 'fs';
import { screen, render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import createClient from './createClient';
import { appWithTranslation } from './appWithTranslation';
jest.mock('fs', function () {
  return {
    existsSync: jest.fn(),
    readdirSync: jest.fn()
  };
});

var DummyI18nextProvider = function DummyI18nextProvider(_ref) {
  var children = _ref.children;
  return __jsx(React.Fragment, null, children);
};

jest.mock('react-i18next', function () {
  return {
    I18nextProvider: jest.fn(),
    __esmodule: true
  };
});
jest.mock('./createClient', function () {
  return jest.fn();
});
var DummyApp = appWithTranslation(function () {
  return __jsx("div", null, "Hello world");
});

var createProps = function createProps() {
  var locale = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'en';
  var router = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return {
    pageProps: {
      _nextI18Next: {
        initialLocale: locale,
        userConfig: {
          i18n: {
            defaultLocale: 'en',
            locales: ['en', 'de']
          }
        }
      }
    },
    router: _objectSpread({
      locale: locale,
      route: '/'
    }, router)
  };
};

var defaultRenderProps = createProps();

var renderComponent = function renderComponent() {
  var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultRenderProps;
  return render(__jsx(DummyApp, props));
};

describe('appWithTranslation', function () {
  beforeEach(function () {
    fs.existsSync.mockReturnValue(true);
    fs.readdirSync.mockReturnValue([]);
    I18nextProvider.mockImplementation(DummyI18nextProvider);
    var actualCreateClient = jest.requireActual('./createClient');
    createClient.mockImplementation(actualCreateClient);
  });
  afterEach(jest.resetAllMocks);
  it('returns children', function () {
    renderComponent();
    expect(screen.getByText('Hello world')).toBeTruthy();
  });
  it('respects configOverride', function () {
    var DummyAppConfigOverride = appWithTranslation(function () {
      return __jsx("div", null, "Hello world");
    }, {
      configOverride: 'custom-value',
      i18n: {
        defaultLocale: 'en',
        locales: ['en', 'de']
      }
    });

    var customProps = _objectSpread(_objectSpread({}, createProps()), {}, {
      pageProps: {
        _nextI18Next: {
          initialLocale: 'en'
        }
      }
    });

    render(__jsx(DummyAppConfigOverride, customProps));

    var _mock$calls = _slicedToArray(I18nextProvider.mock.calls, 1),
        args = _mock$calls[0];

    expect(screen.getByText('Hello world')).toBeTruthy();
    expect(args[0].i18n.options.configOverride).toBe('custom-value');
  });
  it('throws an error if userConfig and configOverride are both missing', function () {
    var DummyAppConfigOverride = appWithTranslation(function () {
      return __jsx("div", null, "Hello world");
    });

    var customProps = _objectSpread(_objectSpread({}, createProps()), {}, {
      pageProps: {
        _nextI18Next: {
          initialLocale: 'en',
          userConfig: null
        }
      }
    });

    expect(function () {
      return render(__jsx(DummyAppConfigOverride, customProps));
    }).toThrow('appWithTranslation was called without a next-i18next config');
  });
  it('returns an I18nextProvider', function () {
    renderComponent();
    expect(I18nextProvider).toHaveBeenCalledTimes(1);

    var _mock$calls2 = _slicedToArray(I18nextProvider.mock.calls, 1),
        args = _mock$calls2[0];

    expect(I18nextProvider).toHaveBeenCalledTimes(1);
    expect(args).toHaveLength(2);
    expect(args[0].children).toBeTruthy();
    expect(args[0].i18n.addResource).toBeTruthy();
    expect(args[0].i18n.language).toEqual('en');
    expect(args[0].i18n.isInitialized).toEqual(true);
    expect(fs.existsSync).toHaveBeenCalledTimes(0);
    expect(fs.readdirSync).toHaveBeenCalledTimes(0);
  });
  it('does not re-call createClient on re-renders unless locale or props have changed', function () {
    var _renderComponent = renderComponent(),
        rerender = _renderComponent.rerender;

    expect(createClient).toHaveBeenCalledTimes(1);
    rerender(__jsx(DummyApp, defaultRenderProps));
    expect(createClient).toHaveBeenCalledTimes(1);
    var newProps = createProps();
    rerender(__jsx(DummyApp, newProps));
    expect(createClient).toHaveBeenCalledTimes(2);
    var deProps = createProps('de');
    rerender(__jsx(DummyApp, deProps));
    expect(createClient).toHaveBeenCalledTimes(3);
    rerender(__jsx(DummyApp, deProps));
    expect(createClient).toHaveBeenCalledTimes(3);
  });
});