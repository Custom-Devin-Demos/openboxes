/* eslint-disable jsx-a11y/label-has-for, jsx-a11y/label-has-associated-control */
import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { SHIPMENT_SUMMARY } from 'api/urls';
import ShipmentSummary from 'components/shipment/ShipmentSummary';
import { CONTEXT_PATH, SHIPMENT_URL } from 'consts/applicationUrls';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const DeleteShipment = ({ match }) => {
  const { shipmentId } = match.params;
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    apiClient.get(SHIPMENT_SUMMARY(shipmentId))
      .then((response) => setSummary(response.data.data));
  }, [shipmentId]);

  return (
    <div className="body">
      <ShipmentSummary summary={summary} />
      <div className="dialog">
        <div className="yui-ga">
          <div className="yui-u first">
            <div id="details" className="box">
              <h2>
                <img
                  src={`${CONTEXT_PATH}/images/icons/silk/delete.png`}
                  alt="Details"
                  style={{ verticalAlign: 'middle' }}
                />
                {' '}
                <label>
                  <Translate id="react.shipment.deleteShipment.label" defaultMessage="Delete Shipment" />
                </label>
              </h2>
              <form action={SHIPMENT_URL.deleteShipment(shipmentId)} method="post">
                <fieldset>
                  <input type="hidden" name="id" value={shipmentId} />
                  <input type="hidden" name="version" value={summary?.version ?? ''} />
                  <table>
                    <tbody>
                      <tr className="prop">
                        <td valign="middle" className="name">
                          <label>
                            <Translate id="react.default.type.label" defaultMessage="Type" />
                          </label>
                        </td>
                        <td valign="middle" className="value" nowrap="nowrap">
                          {summary?.shipmentType?.name}
                        </td>
                      </tr>
                      <tr className="prop">
                        <td valign="top" className="name">
                          <label>
                            <Translate id="react.shipment.name.label" defaultMessage="Name" />
                          </label>
                        </td>
                        <td colSpan="3" valign="top" className="value">
                          {summary?.name}
                        </td>
                      </tr>
                      <tr className="prop">
                        <td className="name" />
                        <td className="value">
                          <Translate
                            id="react.shipment.confirm.deleteShipment.message"
                            defaultMessage="Are you sure you want to delete this shipment?"
                          />
                        </td>
                      </tr>
                      <tr className="prop">
                        <td className="name" />
                        <td className="value left">
                          <div>
                            <button type="submit" className="positive">
                              <img src={`${CONTEXT_PATH}/images/icons/silk/accept.png`} alt="" />
                              {' '}
                              <Translate id="react.default.button.delete.label" defaultMessage="Delete" />
                            </button>
                            {' '}
                            <a href={SHIPMENT_URL.showDetails(shipmentId)}>
                              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </fieldset>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteShipment;

DeleteShipment.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      shipmentId: PropTypes.string,
    }),
  }).isRequired,
};
