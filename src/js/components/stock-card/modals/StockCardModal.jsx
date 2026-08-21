import React from 'react';

import PropTypes from 'prop-types';
import Modal from 'react-modal';

const StockCardModal = ({ title, onClose, children }) => (
  <Modal
    isOpen
    onRequestClose={onClose}
    className="stock-card-modal"
    overlayClassName="stock-card-modal-overlay"
    ariaHideApp={false}
  >
    <div className="stock-card-modal-header d-flex justify-content-between align-items-center">
      <h5 className="m-0">{title}</h5>
      <button type="button" className="close" onClick={onClose}>&times;</button>
    </div>
    <div className="stock-card-modal-body">
      {children}
    </div>
  </Modal>
);

export default StockCardModal;

StockCardModal.propTypes = {
  title: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};
