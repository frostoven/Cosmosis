import Modal from './modal/Modal';

declare global {
  interface Window {
    $modal: Modal;
  }
}
