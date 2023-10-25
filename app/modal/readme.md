# Info

Not to be confused with the menu system, the modal system is an early-load
system with its own React root node. Supports both mouse and keyboard out of
the box.

_Dev note: When the modal system is busy, no other control systems should
process input. This can be checked via `$modal.allowExternalListeners`._

# Examples

## Alert

Can be used as a simple replacement for `window.alert()` , or as a more advanced dialog
builder.

#### Simple alert:
```javascript
$modal.alert('Your message here.');
```

#### Callback on user accept:
```javascript
// Placing a callback as a last option will notify you when the user selects
// the built-in OK button.
$modal.alert('Your message here.', () => {
  console.log('The user has selected "OK".');
});
```

#### Alert with custom header:
```javascript
$modal.alert({
    header: 'I Am The Header',
    body: 'Your message here.',
});
```

#### Alert with custom text on its button:
```javascript
$modal.alert({
  header: 'Info',
  body: 'The Earth can fit eight times Saturn\'s hexigon storm.',
  actions: [ 
    { name: 'Damn, ok..', onSelect: () => $modal.deactivateModal() },
  ]
});
```

#### Alerts can be used as generic dialog builders:
_Note that `$modal.confirm()` would be better suited than this next example as it'd be
more concise._
```javascript
$modal.alert({
  header: 'Question',
  body: 'Left or right?',
  actions: [
    { 
      name: 'Left', 
      onSelect: () => console.log('left') || $modal.deactivateModal() 
    },
    {
      name: 'Right',
      onSelect: () => console.log('right') || $modal.deactivateModal()
    },
  ]
});
```

## Confirm

Can be used as a simple replacement for `window.confirm()` , or as a more advanced dialog
builder.

#### Simple confirmation window:
```javascript
$modal.confirm('Are you want to proceed?', (yesOrNo) => {
  // true if 'Yes', false if 'No'. 
  console.log(yesOrNo);
});
```

#### Confirm with custom header:
```javascript
$modal.confirm({
  header: 'I Am The Header',
  body: 'Are you want to proceed?',
}, (yesOrNo) => {
  console.log(yesOrNo);
});
```

#### Confirm with custom buttons:
```javascript
$modal.confirm({
  body: 'Left or right?',
  actions: [ 
    { name: 'Left, to Dark Woods', onSelect: () => $modal.deactivateModal() },
    { name: 'Right, to Werewolf Mountain', onSelect: () => $modal.deactivateModal() },
  ]
});
```

## Prompt

Can be used as a simple replacement for `window.prompt()` , or as a more advanced dialog
builder.

```javascript
$modal.prompt('Please enter your call sign:', (value) => {
  if (value === null) {
    console.log('[ user cancelled input ]');
  }
  else {
      console.log('User entered:', value);
  }
});
```

As with all other modals, headers and buttons can be customised:
```javascript
$modal.prompt({
  header: 'I Am The Header',
  body: 'Please enter your ship\'s name:',
  actions: [ 
    { name: 'Randomize', onSelect: () => $modal.deactivateModal() },
    { name: 'Accept', onSelect: () => $modal.deactivateModal() },
    { name: 'Cancel', onSelect: () => $modal.deactivateModal() },
  ]
});
```

<!--
#### title
```javascript
$modal
```
-->
