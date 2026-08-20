/* eslint-disable jsx-a11y/label-has-for */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import queryString from 'query-string';

import { SHIPMENT_ADD_TO_SHIPMENT_FORM } from 'api/urls';
import { INVENTORY_ITEM_URL, INVENTORY_URL, SHIPMENT_URL } from 'consts/applicationUrls';
import useTranslate from 'hooks/useTranslate';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const AddToShipment = ({ location }) => {
  const translate = useTranslate();
  const [items, setItems] = useState([]);
  const [pendingShipments, setPendingShipments] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const parsedQuery = queryString.parse(location.search);
    const productIds = [].concat(parsedQuery['product.id'] || []);
    apiClient.get(SHIPMENT_ADD_TO_SHIPMENT_FORM, {
      params: { 'product.id': productIds },
      paramsSerializer: (params) => queryString.stringify(params),
    }).then((response) => {
      setItems(response.data.data.items);
      setPendingShipments(response.data.data.pendingShipments);
      setLoaded(true);
    });
  }, [location.search]);

  if (!loaded) {
    return null;
  }

  // group items by product preserving order, sort each group by expiration date
  const productOrder = [];
  const itemsByProduct = {};
  items.forEach((item, index) => {
    const productId = item.product?.id;
    if (!itemsByProduct[productId]) {
      itemsByProduct[productId] = [];
      productOrder.push(productId);
    }
    itemsByProduct[productId].push({ ...item, listIndex: index });
  });

  let listStatus = 0;
  let rowStatus = 0;

  return (
    <div className="body">
      <div className="dialog">
        <form action={SHIPMENT_URL.addToShipmentPost()} method="post">
          <table className="box">
            <tbody>
              <tr className="prop">
                <td className="name">
                  <label>
                    <Translate id="react.shipment.container.label" defaultMessage="Packing unit" />
                  </label>
                </td>
                <td className="value">
                  <select id="shipmentContainer" name="shipmentContainerKey" defaultValue="null">
                    <option value="null" />
                    {pendingShipments.map((shipment) => (
                      <optgroup
                        key={shipment.id}
                        label={`${shipment.shipmentNumber} - ${shipment.name} to ${shipment.destination}, departing ${shipment.expectedShippingDate}`}
                      >
                        <option value={`${shipment.id}:0`}>
                          {`\u00A0${translate('react.shipment.looseItems.label', 'Loose items (no packing unit)')} \u203A ${shipment.looseItemCount} ${translate('react.default.items.label', 'item(s)')}`}
                        </option>
                        {shipment.containers.map((container) => (
                          <option key={container.id} value={`${shipment.id}:${container.id}`}>
                            {`\u00A0${container.name} \u203A ${container.itemCount} ${translate('react.default.items.label', 'item(s)')}`}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </td>
              </tr>
              <tr className="prop">
                <td className="name">
                  <label>
                    <Translate id="react.default.items.label" defaultMessage="Items" />
                  </label>
                </td>
                <td className="value">
                  <table>
                    <thead>
                      <tr className="prop odd">
                        <th nowrap="nowrap"><Translate id="react.shipment.product.label" defaultMessage="Product" /></th>
                        <th nowrap="nowrap"><Translate id="react.shipment.lotNumber.label" defaultMessage="Lot number" /></th>
                        <th nowrap="nowrap"><Translate id="react.shipment.expires.label" defaultMessage="Expires" /></th>
                        <th className="center"><Translate id="react.shipment.qtyShipping.label" defaultMessage="Qty Shipping" /></th>
                        <th className="center"><Translate id="react.shipment.qtyReceiving.label" defaultMessage="Qty Receiving" /></th>
                        <th className="center"><Translate id="react.shipment.qtyOnHand.label" defaultMessage="Qty On Hand" /></th>
                        <th className="center" style={{ borderLeft: '1px solid lightgrey' }}>
                          <Translate id="react.shipment.qtyToShip.label" defaultMessage="Qty to Ship" />
                        </th>
                      </tr>
                    </thead>
                    {productOrder.map((productId) => {
                      const productItems = [...itemsByProduct[productId]]
                        .sort((a, b) => {
                          const dateA = a.expirationDate ? new Date(a.expirationDate).getTime() : 0;
                          const dateB = b.expirationDate ? new Date(b.expirationDate).getTime() : 0;
                          return dateA - dateB;
                        });
                      return (
                        <tbody key={productId}>
                          {productItems.map((item, j) => {
                            const index = listStatus;
                            listStatus += 1;
                            const rowClass = rowStatus % 2 ? 'even' : 'odd';
                            rowStatus += 1;
                            return (
                              <tr key={item.inventoryItem?.id || index} className={`${rowClass} prop`}>
                                {j === 0
                                  && (
                                  <td rowSpan={productItems.length} className="name" style={{ borderRight: '1px solid lightgrey' }}>
                                    <a
                                      href={INVENTORY_ITEM_URL.showStockCard(productId)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <label>{item.product?.name}</label>
                                    </a>
                                  </td>
                                  )}
                                <td>
                                  {item.lotNumber}
                                  <input type="hidden" name={`items[${index}].inventoryItem.id`} value={item.inventoryItem?.id || ''} />
                                  <input type="hidden" name={`items[${index}].lotNumber`} value={item.lotNumber || ''} />
                                  <input type="hidden" name={`items[${index}].product.id`} value={item.product?.id || ''} />
                                </td>
                                <td nowrap="nowrap">
                                  {item.expirationDate
                                    ? item.expirationDate
                                    : (
                                      <span className="fade">
                                        <Translate id="react.shipment.never.label" defaultMessage="Never" />
                                      </span>
                                    )}
                                </td>
                                <td className="center">
                                  {item.quantityShipping || <span className="fade">0</span>}
                                  <input type="hidden" name={`items[${index}].quantityShipping`} value={item.quantityShipping ?? ''} />
                                </td>
                                <td className="center">
                                  {item.quantityReceiving || <span className="fade">0</span>}
                                  <input type="hidden" name={`items[${index}].quantityReceiving`} value={item.quantityReceiving ?? ''} />
                                </td>
                                <td className="center">
                                  {item.quantityOnHand || <span className="fade">0</span>}
                                  <input type="hidden" name={`items[${index}].quantityOnHand`} value={item.quantityOnHand ?? ''} />
                                </td>
                                <td className="center middle" style={{ borderLeft: '1px solid lightgrey', padding: 0 }}>
                                  {item.quantityOnHand > 0
                                    ? (
                                      <input
                                        type="text"
                                        name={`items[${index}].quantity`}
                                        size="10"
                                        style={{ textAlign: 'center' }}
                                        autoComplete="off"
                                        className="text"
                                      />
                                    )
                                    : 0}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      );
                    })}
                    <tfoot>
                      <tr>
                        <td colSpan="7" style={{ borderTop: '1px solid lightgrey' }}>
                          <div className="center">
                            <button type="submit" className="button icon add">
                              <Translate id="react.shipment.addItems.label" defaultMessage="Add item(s) to shipment" />
                            </button>
                            {' '}
                            <a href={`${INVENTORY_URL.base}/browse`}>
                              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </form>
      </div>
    </div>
  );
};

export default AddToShipment;

AddToShipment.propTypes = {
  location: PropTypes.shape({
    search: PropTypes.string,
  }).isRequired,
};
