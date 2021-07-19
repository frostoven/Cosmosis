## Introduction

_This is a braindump of how the UI is currently built. Feel free to chime in and
suggest alternative methods of design._

Due to the nature of how this application works, the React setup isn't exactly
standard. This is because:
* Input is emitted from controllers, unless it's a mouse click.
* Input control can be stolen by other controllers.
* We use event emitters as the initial way to set state.

## Adding a new menu

1) Copy from a template. `Menu/.examples/SimpleMenu.js` and `Menu/Options.js`
are pretty easy starting points.
2) Import your code in `Menu/index.js`.
3) Add your component to the `render()` function at the bottom of
   `Menu/index.js`. Remember to include the standard props like the other
   components do.

Avoid using Modal as a starting example as it's an edge case (needs special
lifecycle and control listeners) and does things in its own way.

## Snags and teething issues

At it's core, we follow a `root node -> node -> presentational` structure. This
however is not true for input; each component listens for its own emitted
signals.

The rationale behind this is as follows. Imagine a traditional application.
Ideally, we'd want one of the following scenarios:
1) Each section's root component has state. Each of its children and their children
   have no state at all, and are instead purely presentational. Or,
2) No components have state at all; instead we use a flux architecture and
   communicate changes via dispatch.
   
In both those situations, we have something in common: all presentational
components are sort of dummy components that just show the information they're
presented. Except that this isn't exactly true; each such component has rich
amounts of functionality related to input. We however don't think about that in
traditional design because the browser does all that work for us. In the case of \
our game however, the browser
*cannot* do that work for us because most of our input is from a dynamic
context and allows contextual input.

Thus, the caveat is that we have presentational components that may still
manage some state if input is involved. Keep that in mind while working with
components.
