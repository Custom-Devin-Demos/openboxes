import React from 'react';

import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import Button from 'components/form-elements/Button';
import { ORDER_URL, STOCK_MOVEMENT_URL } from 'consts/applicationUrls';
import Translate from 'utils/Translate';

const OrderListHeader = ({ history, supportedActivities, isPutawayList }) => (
  <div className="d-flex list-page-header">
    <span className="d-flex align-self-center title">
      {isPutawayList
        ? <Translate id="react.order.putawaysList.label" defaultMessage="List Putaways" />
        : <Translate id="react.order.ordersList.label" defaultMessage="List Purchase orders" />}
    </span>
    <div className="d-flex justify-content-end buttons align-items-center">
      {supportedActivities.includes('PLACE_ORDER')
        && (
        <a href={ORDER_URL.create()}>
          <Button
            defaultLabel="Create purchase order"
            label="react.order.createOrder.label"
          />
        </a>
        )}
      <Button
        defaultLabel="Create Shipment from PO"
        label="react.order.createShipmentFromPo.label"
        onClick={() => history.push({ pathname: STOCK_MOVEMENT_URL.createCombinedShipments(), search: 'direction=INBOUND' })}
      />
    </div>
  </div>
);

const mapStateToProps = (state) => ({
  supportedActivities: state.session.supportedActivities,
});

export default withRouter(connect(mapStateToProps)(OrderListHeader));

OrderListHeader.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
  supportedActivities: PropTypes.arrayOf(PropTypes.string).isRequired,
  isPutawayList: PropTypes.bool.isRequired,
};
