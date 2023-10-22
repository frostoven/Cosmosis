import React from 'react';
import { useSpring, animated } from 'react-spring';

const FadeInDown = ({children, style = {}}) => {
  const props = useSpring({
    from: { opacity: 0, transform: 'translateY(-1%)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: {
      duration: 75,
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
  FadeInDown,
}
