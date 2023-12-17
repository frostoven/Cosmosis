import { onDocumentReady } from '../local/windowLoadListener';
import * as ReactDOM from 'react-dom';
import React from 'react';
import Modal from './Modal';

onDocumentReady(() => {
  ReactDOM.render(
    <Modal/>,
    document.getElementById('modalRoot'),
  );
});
