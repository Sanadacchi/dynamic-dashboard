
const OneSignal = require('react-onesignal').default;
console.log('OneSignal keys:', Object.keys(OneSignal));
if (OneSignal.SlidingPrompt) console.log('SlidingPrompt keys:', Object.keys(OneSignal.SlidingPrompt));
