// Dynamic Expo config — switches the app between LIVE and TEST by EAS build profile.
//
//   LIVE  (default — APP_VARIANT unset, i.e. the "production"/"preview" profiles):
//         "Nabbit", com.leadco.marketplace, https://www.nabbitmarketplace.com,
//         live Supabase. Returns app.json UNCHANGED — live builds are unaffected.
//
//   TEST  (APP_VARIANT=test — the "test" profile in eas.json):
//         "Nabbit Test", com.leadco.marketplace.test,
//         https://test.nabbitmarketplace.com, TEST Supabase (irdbeukhavwfmiqbsile).
//         Different bundle id + scheme so it installs SIDE-BY-SIDE with live.
//
// The static values live in app.json; this file only overrides them for TEST.

const IS_TEST = process.env.APP_VARIANT === 'test';

module.exports = ({ config }) => {
  if (!IS_TEST) return config; // LIVE — identical to app.json

  return {
    ...config,
    name: 'Nabbit Test',
    scheme: 'leadcotest', // distinct so it doesn't collide with the live app's deep links
    ios: {
      ...config.ios,
      bundleIdentifier: 'com.leadco.marketplace.test',
    },
    android: {
      ...config.android,
      package: 'com.leadco.marketplace.test',
      // The live google-services.json is tied to com.leadco.marketplace, so drop
      // it for the TEST package (a test Android build would otherwise fail
      // validation). Test builds just won't have FCM push until a test Firebase
      // app is added — fine, we don't build test Android today.
      googleServicesFile: undefined,
    },
    extra: {
      ...config.extra,
      apiBaseUrl: 'https://test.nabbitmarketplace.com',
      supabaseUrl: 'https://irdbeukhavwfmiqbsile.supabase.co',
      // Public anon key for the TEST Supabase project — injected by the "test"
      // EAS profile (eas.json → env.TEST_SUPABASE_ANON_KEY).
      supabaseAnonKey: process.env.TEST_SUPABASE_ANON_KEY,
    },
  };
};
