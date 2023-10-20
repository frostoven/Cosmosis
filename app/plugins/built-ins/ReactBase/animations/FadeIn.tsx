import React from 'react';
import { useSpring, animated } from 'react-spring';

const FadeIn = ({children, style = {}}) => {
  const props = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: {
      duration: 50,
    }
  });

  return (
    <animated.div style={{
      ...props,
      ...style,
      display: 'inline',
    }}>
      {children}
    </animated.div>
  );
};

export {
  FadeIn,
}
