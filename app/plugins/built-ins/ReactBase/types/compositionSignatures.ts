import React from 'react';
import InputBridge from './InputBridge';

interface RegisterMenuSignature {
  getInputBridge: () => InputBridge,
  getComponent: () => typeof React.Component,
  // If true, your menu will be closed if its mode control is deactivated.
  // Default is true.
  autoClose?: Boolean,
  onActivate?: Function,
}


interface RegisteredMenu extends RegisterMenuSignature {
  isVisible: boolean,
}

export {
  RegisterMenuSignature,
  RegisteredMenu,
};
