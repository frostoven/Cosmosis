import React from 'react';
import { useSpring, animated } from 'react-spring';

const MoveDown = ({
  className = undefined,
  children,
  style = {},
  distance = '-1%',
  duration = 75,
  onClick = undefined,
}) => {
  const props = useSpring({
    from: { transform: `translateY(${distance})` },
    to: { transform: 'translateY(0)' },
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
  MoveDown,
};
