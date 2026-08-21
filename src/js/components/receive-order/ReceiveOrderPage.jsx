import React, { useEffect, useState } from 'react';

import moment from 'moment';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import receiveOrderApi from 'api/services/ReceiveOrderApi';
import Button from 'components/form-elements/Button';
import DateField from 'components/form-elements/v2/DateField';
import SelectField from 'components/form-elements/v2/SelectField';
import TextInput from 'components/form-elements/v2/TextInput';
import ProductSelect from 'components/product-select/ProductSelect';
import { ORDER_URL } from 'consts/applicationUrls';
import useTranslate from 'hooks/useTranslate';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const STEPS = ['enterShipmentDetails', 'processOrderItems', 'confirmOrderReceipt'];

const DISPLAY_DATE_FORMAT = 'MMM DD, YYYY';
const API_DATE_FORMAT = 'MM/DD/YYYY';

const toApiDate = (value) =>
  (value ? moment(value, DISPLAY_DATE_FORMAT).format(API_DATE_FORMAT) : null);

const ReceiveOrderPage = ({ location }) => {
  useTranslation('receiveOrder', 'default');
  const translate = useTranslate();

  const queryParams = new URLSearchParams(location.search);
  const orderId = queryParams.get('id');
  const skipTo = queryParams.get('skipTo');

  const [step, setStep] = useState(STEPS.includes(skipTo) ? skipTo : 'enterShipmentDetails');
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [shipmentTypes, setShipmentTypes] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [details, setDetails] = useState({
    shipmentType: null,
    recipient: null,
    shippedOn: null,
    deliveredOn: null,
  });
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (!orderId) {
      return;
    }
    receiveOrderApi.getReceiveOrder(orderId).then((response) => {
      const { data } = response.data;
      setOrder(data.order);
      setShipmentTypes(data.shipmentTypes.map((shipmentType) => ({
        id: shipmentType.id,
        value: shipmentType.id,
        label: shipmentType.name,
      })));
      setRecipients(data.recipients.map((recipient) => ({
        id: recipient.id,
        value: recipient.id,
        label: recipient.name,
      })));
      setItems(data.orderItems.map((item, index) => ({
        ...item,
        key: `item-${index}`,
        quantityReceived: '',
        product: item.productId ? {
          id: item.productId,
          value: item.productId,
          label: `${item.productCode} - ${item.productName}`,
          name: item.productName,
          productCode: item.productCode,
        } : null,
        lotNumber: '',
        expirationDate: null,
      })));
    });
  }, [orderId]);

  const detailsPayload = () => ({
    shipmentTypeId: details.shipmentType?.id || null,
    recipientId: details.recipient?.id || null,
    shippedOn: toApiDate(details.shippedOn),
    deliveredOn: toApiDate(details.deliveredOn),
  });

  const itemsPayload = () => ({
    orderItems: items.map((item) => ({
      orderItemId: item.orderItemId,
      primary: item.primary,
      type: item.type,
      description: item.description,
      quantityOrdered: item.quantityOrdered,
      quantityReceived: item.quantityReceived || null,
      productId: item.product?.id || null,
      lotNumber: item.lotNumber || null,
      expirationDate: toApiDate(item.expirationDate),
    })),
  });

  const onApiError = (error) => {
    setErrors(error?.response?.data?.errorMessages || []);
  };

  const goToStep = (nextStep) => {
    setErrors([]);
    setStep(nextStep);
  };

  const onDetailsNext = () => {
    receiveOrderApi.validateShipmentDetails(orderId, detailsPayload())
      .then(() => goToStep('processOrderItems'))
      .catch(onApiError);
  };

  const onItemsNext = () => {
    receiveOrderApi.validateOrderItems(orderId, itemsPayload())
      .then(() => goToStep('confirmOrderReceipt'))
      .catch(onApiError);
  };

  const onSubmit = () => {
    receiveOrderApi.submit(orderId, { ...detailsPayload(), ...itemsPayload() })
      .then((response) => {
        window.location = ORDER_URL.show(response.data.data.orderId);
      })
      .catch(onApiError);
  };

  const setItemValue = (key, field) => (value) => {
    setItems((prevItems) => prevItems.map((item) => (
      item.key === key ? { ...item, [field]: value } : item
    )));
  };

  const splitItem = (key) => {
    setItems((prevItems) => {
      const index = prevItems.findIndex((item) => item.key === key);
      const source = prevItems[index];
      const newItem = {
        ...source,
        key: `item-split-${Date.now()}-${index}`,
        primary: false,
        type: '',
        description: '',
        quantityOrdered: null,
        quantityReceived: '',
        lotNumber: '',
        expirationDate: null,
        split: true,
      };
      const newItems = [...prevItems];
      newItems.splice(index + 1, 0, newItem);
      return newItems;
    });
  };

  const deleteItem = (key) => {
    setItems((prevItems) => prevItems.filter((item) => item.key !== key));
  };

  const receivedItems = items.filter((item) => Number(item.quantityReceived) > 0);

  if (!orderId) {
    return (
      <PageWrapper>
        <div className="p-3">
          <Translate id="react.receiveOrder.noOrder.message" defaultMessage="You can access the Receive Order feature through the details page for an order." />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="d-flex flex-column p-3">
        {order && (
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <small className="font-weight-bold">{order.orderNumber}</small>
              {' '}
              <a href={ORDER_URL.show(order.id)}>{order.name}</a>
            </div>
            <div>{order.status}</div>
          </div>
        )}
        {errors.length > 0 && (
          <div className="alert alert-danger" role="alert">
            <ul className="mb-0">
              {errors.map((error) => <li key={error}>{error}</li>)}
            </ul>
          </div>
        )}
        {step === 'enterShipmentDetails' && (
          <div className="card p-3">
            <h2>
              <Translate id="react.receiveOrder.enterShipmentDetails.label" defaultMessage="Enter shipment details" />
            </h2>
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  title={{ id: 'react.receiveOrder.origin.label', defaultMessage: 'Order from' }}
                  value={order?.origin || ''}
                  disabled
                  onChange={() => {}}
                />
                <SelectField
                  title={{ id: 'react.receiveOrder.shipmentType.label', defaultMessage: 'Shipment type' }}
                  options={shipmentTypes}
                  defaultValue={details.shipmentType}
                  onChange={(value) => setDetails((prev) => ({ ...prev, shipmentType: value }))}
                />
                <TextInput
                  title={{ id: 'react.receiveOrder.destination.label', defaultMessage: 'Destination' }}
                  value={order?.destination || ''}
                  disabled
                  onChange={() => {}}
                />
                <SelectField
                  title={{ id: 'react.receiveOrder.recipient.label', defaultMessage: 'Recipient' }}
                  options={recipients}
                  defaultValue={details.recipient}
                  onChange={(value) => setDetails((prev) => ({ ...prev, recipient: value }))}
                />
                <TextInput
                  title={{ id: 'react.receiveOrder.dateOrdered.label', defaultMessage: 'Date ordered' }}
                  value={order?.dateOrdered || ''}
                  disabled
                  onChange={() => {}}
                />
                <DateField
                  title={{ id: 'react.receiveOrder.shippedOn.label', defaultMessage: 'Shipped on' }}
                  value={details.shippedOn}
                  onChange={(value) => setDetails((prev) => ({ ...prev, shippedOn: value }))}
                />
                <DateField
                  title={{ id: 'react.receiveOrder.deliveredOn.label', defaultMessage: 'Delivered on' }}
                  value={details.deliveredOn}
                  onChange={(value) => setDetails((prev) => ({ ...prev, deliveredOn: value }))}
                />
              </div>
            </div>
            <div className="d-flex mt-3">
              <Button
                type="button"
                label="react.default.button.next.label"
                defaultLabel="Next"
                onClick={onDetailsNext}
              />
            </div>
          </div>
        )}
        {step === 'processOrderItems' && (
          <div className="card p-3">
            <h2>
              <Translate id="react.receiveOrder.receiveOrderItems.label" defaultMessage="Receive order items" />
            </h2>
            {items.length ? (
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th colSpan="6" className="text-center">
                      {translate('react.receiveOrder.itemsOrdered.label', 'Items ordered')}
                    </th>
                    <th colSpan="5" className="text-center" style={{ borderLeft: '1px solid lightgrey' }}>
                      {translate('react.receiveOrder.itemsReceived.label', 'Items received')}
                    </th>
                  </tr>
                  <tr>
                    <th>{translate('react.receiveOrder.type.label', 'Type')}</th>
                    <th>{translate('react.receiveOrder.productCode.label', 'Code')}</th>
                    <th>{translate('react.receiveOrder.productName.label', 'Name')}</th>
                    <th>{translate('react.receiveOrder.uom.label', 'UOM')}</th>
                    <th className="text-center">{translate('react.receiveOrder.ordered.label', 'Ordered')}</th>
                    <th className="text-center">{translate('react.receiveOrder.remaining.label', 'Remaining')}</th>
                    <th className="text-center" style={{ borderLeft: '1px solid lightgrey' }}>
                      {translate('react.receiveOrder.received.label', 'Received')}
                    </th>
                    <th>{translate('react.receiveOrder.product.label', 'Product')}</th>
                    <th>{translate('react.receiveOrder.lotNumber.label', 'Lot number')}</th>
                    <th>{translate('react.receiveOrder.expires.label', 'Expires')}</th>
                    <th aria-label="actions" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.key}>
                      <td>{item.primary ? item.type : ''}</td>
                      <td>{item.primary ? item.productCode : ''}</td>
                      <td>{item.primary ? item.productName : ''}</td>
                      <td>{item.primary ? item.unitOfMeasure : ''}</td>
                      <td className="text-center">{item.primary ? item.quantityOrdered : ''}</td>
                      <td className="text-center">
                        {item.primary ? item.quantityOrdered - item.quantityFulfilled : ''}
                      </td>
                      {!item.completelyFulfilled ? (
                        <>
                          <td className="text-center" style={{ borderLeft: '1px solid lightgrey', minWidth: '80px' }}>
                            <input
                              type="text"
                              className="form-control form-control-sm text-center"
                              value={item.quantityReceived}
                              onChange={(event) => setItemValue(item.key, 'quantityReceived')(event.target.value)}
                            />
                          </td>
                          <td style={{ minWidth: '220px' }}>
                            <ProductSelect
                              value={item.product}
                              onChange={setItemValue(item.key, 'product')}
                            />
                          </td>
                          <td style={{ minWidth: '120px' }}>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={item.lotNumber}
                              onChange={(event) => setItemValue(item.key, 'lotNumber')(event.target.value)}
                            />
                          </td>
                          <td style={{ minWidth: '160px' }}>
                            <DateField
                              value={item.expirationDate}
                              onChange={setItemValue(item.key, 'expirationDate')}
                              hideErrorMessageWrapper
                            />
                          </td>
                          <td>
                            {item.split ? (
                              <Button
                                type="button"
                                variant="transparent"
                                label="react.receiveOrder.deleteItem.label"
                                defaultLabel="Delete item"
                                onClick={() => deleteItem(item.key)}
                              />
                            ) : (
                              <Button
                                type="button"
                                variant="transparent"
                                label="react.receiveOrder.splitItem.label"
                                defaultLabel="Split item"
                                onClick={() => splitItem(item.key)}
                              />
                            )}
                          </td>
                        </>
                      ) : (
                        <td colSpan="5" className="text-center text-muted" style={{ borderLeft: '1px solid lightgrey' }}>
                          <Translate id="react.receiveOrder.orderItemHasBeenReceived.message" defaultMessage="This order item has already been received" />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <span className="text-muted">
                <Translate id="react.receiveOrder.noItems.label" defaultMessage="No items" />
              </span>
            )}
            <div className="d-flex mt-3" style={{ gap: '8px' }}>
              <Button
                type="button"
                variant="secondary"
                label="react.default.button.back.label"
                defaultLabel="Back"
                onClick={() => goToStep('enterShipmentDetails')}
              />
              <Button
                type="button"
                label="react.default.button.next.label"
                defaultLabel="Next"
                onClick={onItemsNext}
              />
            </div>
          </div>
        )}
        {step === 'confirmOrderReceipt' && (
          <div className="card p-3">
            <table className="table table-sm w-50">
              <tbody>
                <tr>
                  <td><Translate id="react.receiveOrder.summary.label" defaultMessage="Summary" /></td>
                  <td>
                    <Translate
                      id="react.receiveOrder.youAreAboutToCreateANewShipment.message"
                      defaultMessage="You are about to create a new shipment"
                    />
                  </td>
                </tr>
                <tr>
                  <td><Translate id="react.receiveOrder.orderNumber.label" defaultMessage="Order Number" /></td>
                  <td>{order?.orderNumber || <span className="text-muted">New Order</span>}</td>
                </tr>
                <tr>
                  <td><Translate id="react.receiveOrder.origin.label" defaultMessage="Order from" /></td>
                  <td>{order?.origin}</td>
                </tr>
                <tr>
                  <td><Translate id="react.receiveOrder.destination.label" defaultMessage="Destination" /></td>
                  <td>{order?.destination}</td>
                </tr>
                <tr>
                  <td><Translate id="react.receiveOrder.shipmentType.label" defaultMessage="Shipment type" /></td>
                  <td>{details.shipmentType?.label}</td>
                </tr>
                <tr>
                  <td><Translate id="react.receiveOrder.shippedOn.label" defaultMessage="Shipped on" /></td>
                  <td>{details.shippedOn}</td>
                </tr>
                <tr>
                  <td><Translate id="react.receiveOrder.deliveredOn.label" defaultMessage="Delivered on" /></td>
                  <td>{details.deliveredOn}</td>
                </tr>
              </tbody>
            </table>
            {receivedItems.length ? (
              <div>
                <h2>
                  <Translate id="react.receiveOrder.itemsReceived.label" defaultMessage="Items received" />
                </h2>
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>{translate('react.receiveOrder.productCode.label', 'Code')}</th>
                      <th>{translate('react.receiveOrder.productName.label', 'Name')}</th>
                      <th>{translate('react.receiveOrder.uom.label', 'UOM')}</th>
                      <th>{translate('react.receiveOrder.lotNumber.label', 'Lot number')}</th>
                      <th>{translate('react.receiveOrder.expirationDate.label', 'Expiration date')}</th>
                      <th className="text-center">{translate('react.receiveOrder.ordered.label', 'Ordered')}</th>
                      <th className="text-center">{translate('react.receiveOrder.received.label', 'Received')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receivedItems.map((item) => (
                      <tr key={item.key}>
                        <td>{item.product?.productCode}</td>
                        <td>{item.product?.name}</td>
                        <td>{item.unitOfMeasure}</td>
                        <td>{item.lotNumber}</td>
                        <td>{item.expirationDate}</td>
                        <td className="text-center">{item.quantityOrdered}</td>
                        <td className="text-center">{item.quantityReceived}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <span className="text-muted">
                <Translate id="react.receiveOrder.noItems.label" defaultMessage="No items" />
              </span>
            )}
            <div className="d-flex mt-3" style={{ gap: '8px' }}>
              <Button
                type="button"
                variant="secondary"
                label="react.default.button.back.label"
                defaultLabel="Back"
                onClick={() => goToStep('processOrderItems')}
              />
              <Button
                type="button"
                label="react.default.button.finish.label"
                defaultLabel="Finish"
                onClick={onSubmit}
              />
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default withRouter(ReceiveOrderPage);

ReceiveOrderPage.propTypes = {
  location: PropTypes.shape({
    search: PropTypes.string,
  }).isRequired,
};
