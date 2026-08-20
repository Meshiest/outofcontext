import 'i18next';
import type { en } from '../i18n/resources';

// Bind i18next's key/interpolation typing to the `en` source locale so `t()` autocompletes keys
// and a misspelled key is a compile error instead of a runtime "[missing key]".
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: typeof en;
  }
}
