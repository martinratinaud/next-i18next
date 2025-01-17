import { defaultConfig } from './defaultConfig';
import { InternalConfig, UserConfig } from '../types';
import { FallbackLng } from 'i18next';

const deepMergeObjects = ['backend', 'detection'] as (keyof Pick<UserConfig, 'backend' | 'detection'>)[];

export const createConfig = (userConfig: UserConfig): InternalConfig => {
  if (typeof userConfig?.lng !== 'string') {
    throw new Error('config.lng was not passed into createConfig');
  }

  //
  // Initial merge of default and user-provided config
  //
  const { i18n: userI18n, ...userConfigStripped } = userConfig;
  const { i18n: defaultI18n, ...defaultConfigStripped } = defaultConfig;
  const combinedConfig = {
    ...defaultConfigStripped,
    ...userConfigStripped,
    ...defaultI18n,
    ...userI18n,
  };

  const { defaultNS, lng, locales, localeExtension, localePath, localeStructure } = combinedConfig;

  /**
   * Skips translation file resolution while in cimode
   * https://github.com/isaachinman/next-i18next/pull/851#discussion_r503113620
   */
  if (lng === 'cimode') {
    return combinedConfig as InternalConfig;
  }

  if (typeof combinedConfig.fallbackLng === 'undefined') {
    combinedConfig.fallbackLng = combinedConfig.defaultLocale;
  }
  const hasCustomBackend = userConfig?.use?.some((b) => b.type === 'backend');
  if (!process.browser && typeof window === 'undefined') {
    combinedConfig.preload = locales;

    if (!hasCustomBackend) {
      const fs = require('fs');
      const path = require('path');
      const serverLocalePath = localePath;

      //
      // Validate defaultNS
      // https://github.com/isaachinman/next-i18next/issues/358
      //
      if (typeof defaultNS === 'string' && typeof lng !== 'undefined') {
        const prefix = userConfig?.interpolation?.prefix ?? '{{';
        const suffix = userConfig?.interpolation?.suffix ?? '}}';
        const defaultLocaleStructure = localeStructure.replace(`${prefix}lng${suffix}`, lng).replace(`${prefix}ns${suffix}`, defaultNS);
        const defaultFile = `/${defaultLocaleStructure}.${localeExtension}`;
        const defaultNSPath = path.join(localePath, defaultFile);
        const defaultNSExists = fs.existsSync(defaultNSPath);
        if (!defaultNSExists && process.env.NODE_ENV !== 'production') {
          throw new Error(`Default namespace not found at ${defaultNSPath}`);
        }
      }

      //
      // Set server side backend
      //
      combinedConfig.backend = {
        addPath: path.resolve(process.cwd(), `${serverLocalePath}/${localeStructure}.missing.${localeExtension}`),
        loadPath: path.resolve(process.cwd(), `${serverLocalePath}/${localeStructure}.${localeExtension}`),
      };
      console.log(''); //eslint-disable-line
      console.log('╔════START════════combinedConfig════════════════════════════════════════════'); //eslint-disable-line
      console.log(combinedConfig); //eslint-disable-line
      console.log('process.cwd()', process.cwd()); //eslint-disable-line
      console.log('serverLocalePath', serverLocalePath); //eslint-disable-line
      console.log('localeStructure', localeStructure); //eslint-disable-line
      console.log('localeExtension', localeExtension); //eslint-disable-line
      console.log('╚════END══════════════════════════════════════════════════════'); //eslint-disable-line

      //
      // Set server side preload (namespaces)
      //
      if (!combinedConfig.ns && typeof lng !== 'undefined') {
        const unique = (list: string[]) => Array.from(new Set<string>(list));
        const getNamespaces = (locales: string[]): string[] => {
          console.log(''); //eslint-disable-line
          console.log('╔════START═══getNamespaces═════════════════════════════════════════════════'); //eslint-disable-line
          console.log(locales); //eslint-disable-line
          console.log('process.cwd()', process.cwd()); //eslint-disable-line
          console.log('╚════END══════════════════════════════════════════════════════'); //eslint-disable-line

          const getLocaleNamespaces = (p: string) => {
            console.log('getLocaleNamespaces', p);

            return fs.readdirSync(p).map((file: string) => file.replace(`.${localeExtension}`, ''));
          };

          const namespacesByLocale = locales.map((locale) => getLocaleNamespaces(path.resolve(process.cwd(), `${serverLocalePath}/${locale}`)));

          const allNamespaces = [];
          for (const localNamespaces of namespacesByLocale) {
            allNamespaces.push(...localNamespaces);
          }

          return unique(allNamespaces);
        };

        const getAllLocales = (lng: string, fallbackLng: false | FallbackLng): string[] => {
          console.log(''); //eslint-disable-line
          console.log('╔════START══getAllLocales══════════════════════════════════════════════════'); //eslint-disable-line
          console.log('lng', lng); //eslint-disable-line
          console.log('fallbackLng', fallbackLng); //eslint-disable-line
          console.log('╚════END══════════════════════════════════════════════════════'); //eslint-disable-line

          if (typeof fallbackLng === 'string') {
            return unique([lng, fallbackLng]);
          }

          if (Array.isArray(fallbackLng)) {
            return unique([lng, ...fallbackLng]);
          }

          if (typeof fallbackLng === 'object') {
            const flattenedFallbacks = Object.values(fallbackLng).reduce((all, fallbackLngs) => [...all, ...fallbackLngs], []);
            return unique([lng, ...flattenedFallbacks]);
          }
          return [lng];
        };

        combinedConfig.ns = getNamespaces(getAllLocales(lng, combinedConfig.fallbackLng));
      }
    }
  } else {
    let clientLocalePath = localePath;

    //
    // Remove public prefix from client site config
    //
    if (localePath.match(/^\.?\/public\//)) {
      clientLocalePath = localePath.replace(/^\.?\/public/, '');
    }

    //
    // Set client side backend, if there is no custom backend
    //
    if (!hasCustomBackend) {
      combinedConfig.backend = {
        addPath: `${clientLocalePath}/${localeStructure}.missing.${localeExtension}`,
        loadPath: `${clientLocalePath}/${localeStructure}.${localeExtension}`,
      };
    }

    if (typeof combinedConfig.ns !== 'string' && !Array.isArray(combinedConfig.ns)) {
      combinedConfig.ns = [defaultNS];
    }
  }

  //
  // Deep merge with overwrite - goes last
  //
  deepMergeObjects.forEach((obj) => {
    if (userConfig[obj]) {
      combinedConfig[obj] = {
        ...combinedConfig[obj],
        ...userConfig[obj],
      };
    }
  });

  return combinedConfig as InternalConfig;
};
