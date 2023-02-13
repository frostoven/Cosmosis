This userProfile module has a host of features, but in practice, I've only
needed two functions for general coding. To best use the limited time I have,
for now, I'll document only those two functions; feel free to dig into the code
or raise an issue on
[GitHub](https://github.com/frostoven/Cosmosis/issues/new/choose)
if you need more information.

## Introduction

The game core will not start booting until the user profile is fully loaded.
If part of the profile cannot be loaded, default values for that part will be
loaded instead.

## Reading profile data

There are two ways to read profile data:
1) Get the last known value from cache,
2) Create a callback that waits for a value to be written to cache in case
   the application is still booting.

Option 1 is fine wherever your code is called as a result of any game event,
and is the easiest to code for. Option 2 is only needed if your code is called
before the game has had time to do anything (such as inits in global scope).
Loading from global scope is generally more expensive; try using game events if
possible.

### Available data
See `app/userProfile/defaultsConfigs` for available configuration categories.
Every file in that directory (excluding `_example` and `index.js`) will
generate an equivalent JSON file in the user's operating system profile
directory.

Each file contains sub-categories; for example, `userOptions.js` includes
debug, display, graphics, and misc customisation options. Likewise, `controls.js` maps
out all possible in-game controls.

### 1. Get the last known value from cache

Example:
```javascript
import userProfile from '../userProfile';

// Some valid identifiers:  
// allProfiles, controls, debugTools, gamestate, userOptions.
const { graphics } = userProfile.getCurrentConfig({
  // In this example, userOptions refers to:
  // app/userProfile/defaultsConfigs/userOptions.js
  // There, you will find graphics and other options defined. 
  identifier: 'userOptions'
});

console.log('All graphics preferences:', graphics);
```

The above example code is guaranteed to return a correct value if called as a
result of a game event, such as boot start. Otherwise, expect invalid values.

### 2. Wait via callback

Example:
```javascript
import userProfile from '../userProfile';

// Some valid identifiers:  
// allProfiles, controls, debugTools, gamestate, userOptions.
userProfile.cacheChangeEvent.getOnce(({ userOptions }) => {
  // In this example, userOptions refers to:
  // app/userProfile/defaultsConfigs/userOptions.js
  // There, you will find graphics and other options defined. 
  graphics = userOptions.graphics;
});

console.log('All graphics preferences:', graphics);
```

The above example will wait for cache to be initialised, then return a value
via callback. If the value has already been written, the callback will trigger
immediately.

If you would like to get the value every time it changes (such as when the
user changes settings from the options menu), use `getEveryChange` instead of
`getOnce`. See the
[ChangeTracker class](https://github.com/frostoven/Cosmosis/blob/master/app/emitters/ChangeTracker.js)
for all callback mechanisms.
