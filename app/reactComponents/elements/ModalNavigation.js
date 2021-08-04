import React from 'react';
import MenuNavigation from './MenuNavigation';

export default function ModalNavigation(props) {
  return (
    <MenuNavigation {...props} identifier='modal'/>
  );
}

ModalNavigation.propTypes = MenuNavigation.propTypes;
ModalNavigation.defaultProps = MenuNavigation.defaultProps;
