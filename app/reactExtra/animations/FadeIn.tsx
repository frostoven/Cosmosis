import React from 'react';
import { useSpring, animated } from 'react-spring';

const FadeIn = ({
  className = undefined,
  children,
  style = {},
  duration = 75,
  onClick = undefined,
}) => {
  const props = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: {
      duration,
    },
  });

  return (
    <animated.div className={className} onClick={onClick} style={{
      ...props,
      ...style,
    }}>
      {children}
    </animated.div>
  );
};

export {
  FadeIn,
};
