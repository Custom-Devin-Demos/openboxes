/* eslint-disable jsx-a11y/label-has-for, jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import createShipmentApi from 'api/services/CreateShipmentApi';
import SelectField from 'components/form-elements/v2/SelectField';
import { CONTEXT_PATH, SHIPMENT_URL } from 'consts/applicationUrls';
import apiClient from 'utils/apiClient';
import { debouncePeopleFetch } from 'utils/option-utils';
import Translate from 'utils/Translate';

const STEPS = [
  { key: 'Details', labelId: 'react.createShipment.enterShipmentDetails.label', defaultLabel: 'Enter shipment details' },
  { key: 'Tracking', labelId: 'react.createShipment.enterTrackingDetails.label', defaultLabel: 'Enter tracking details' },
  { key: 'Packing', labelId: 'react.createShipment.enterContainerDetails.label', defaultLabel: 'Enter packing details' },
  { key: 'Picking', labelId: 'react.createShipment.pickShipmentItems.label', defaultLabel: 'Pick shipment items' },
  { key: 'Sending', labelId: 'react.createShipment.sendShipment.label', defaultLabel: 'Send shipment' },
];

const EVENT_TO_STEP = {
  enterShipmentDetails: 'Details',
  enterTrackingDetails: 'Tracking',
  enterContainerDetails: 'Packing',
  pickShipmentItems: 'Picking',
  sendShipment: 'Sending',
};

// MM/DD/YYYY <-> YYYY-MM-DD (native date input)
const toInputDate = (value) => {
  if (!value) return '';
  const [month, day, year] = value.split('/');
  return `${year}-${month}-${day}`;
};

const toApiDate = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split('-');
  return `${month}/${day}/${year}`;
};

const toApiDateTime = (value) => {
  if (!value) return null;
  // value from datetime-local: YYYY-MM-DDTHH:mm
  const [date, time] = value.split('T');
  const [year, month, day] = date.split('-');
  return `${month}/${day}/${year} ${time}`;
};

const toOption = (id, label) => (id ? { id, value: id, label } : null);

const mapOptions = (list) => (list ? list.map((it) => toOption(it.id, it.name)) : []);

const stepButtonClass = (key, step, index, stepIndex) => {
  if (key === step) return 'btn-primary';
  return index < stepIndex ? 'btn-outline-success' : 'btn-outline-secondary';
};

const CreateShipmentPage = ({ location, match }) => {
  const queryParams = new URLSearchParams(location.search);
  const initialShipmentId = match.params.shipmentId || queryParams.get('id') || null;
  const skipTo = queryParams.get('skipTo');
  const eventStep = EVENT_TO_STEP[queryParams.get('_eventId')];
  const initialStep = STEPS.some(({ key }) => key === skipTo) ? skipTo : (eventStep || 'Details');

  const [shipmentId, setShipmentId] = useState(initialShipmentId);
  const [step, setStep] = useState(initialShipmentId ? initialStep : 'Details');
  const [data, setData] = useState(null);
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState(null);

  // Details form state
  const [details, setDetails] = useState({
    name: '',
    shipmentType: null,
    origin: null,
    destination: null,
    expectedShippingDate: '',
    expectedDeliveryDate: '',
  });

  // Tracking form state
  const [tracking, setTracking] = useState({
    carrier: null,
    shipper: null,
    trackingNumber: '',
    recipient: null,
    referenceNumbers: {},
    statedValue: '',
    totalValue: '',
    additionalInformation: '',
  });

  // Packing form state
  const [containerType, setContainerType] = useState(null);
  const [containerText, setContainerText] = useState('');
  const [selectedContainerIds, setSelectedContainerIds] = useState([]);
  const [addItem, setAddItem] = useState({ container: null, inventoryItem: null, quantity: '' });

  // Picking state
  const [pickingItemId, setPickingItemId] = useState(null);
  const [binLocations, setBinLocations] = useState([]);
  const [pick, setPick] = useState({ selection: '', quantity: '', splitQuantity: '' });

  // Sending state
  const [send, setSend] = useState({
    actualShippingDate: '',
    comments: '',
    emailRecipientIds: [],
    debitStockOnSend: true,
  });

  const applyData = (nextData) => {
    setData(nextData);
    const { shipment } = nextData;
    setDetails({
      name: shipment.name || '',
      shipmentType: toOption(shipment.shipmentTypeId, shipment.shipmentTypeName),
      origin: toOption(shipment.originId, shipment.originName),
      destination: toOption(shipment.destinationId, shipment.destinationName),
      expectedShippingDate: toInputDate(shipment.expectedShippingDate),
      expectedDeliveryDate: toInputDate(shipment.expectedDeliveryDate),
    });
    setTracking({
      carrier: toOption(shipment.carrierId, shipment.carrierName),
      shipper: toOption(
        shipment.shipperId,
        nextData.options.shippers.find((it) => it.id === shipment.shipperId)?.name,
      ),
      trackingNumber: shipment.trackingNumber || '',
      recipient: shipment.recipientId
        ? { id: shipment.recipientId, value: shipment.recipientId, label: shipment.recipientName }
        : null,
      referenceNumbers: { ...shipment.referenceNumbers },
      statedValue: shipment.statedValue != null ? String(shipment.statedValue) : '',
      totalValue: shipment.totalValue != null ? String(shipment.totalValue) : '',
      additionalInformation: shipment.additionalInformation || '',
    });
    setSend((prev) => ({
      ...prev,
      emailRecipientIds: nextData.emailRecipients.map((recipient) => recipient.id),
    }));
    if (shipment.id) {
      setShipmentId(shipment.id);
    }
  };

  useEffect(() => {
    createShipmentApi.read(shipmentId)
      .then((response) => applyData(response.data.data))
      .catch((error) => setErrors(error?.response?.data?.errorMessages || []));
    // eslint-disable-next-line
  }, []);

  const onApiError = (error) => {
    setMessage(null);
    setErrors(error?.response?.data?.errorMessages || []);
  };

  const onSuccess = (response, nextStep) => {
    setErrors([]);
    setMessage(null);
    applyData(response.data.data);
    if (nextStep) {
      setStep(nextStep);
    }
  };

  const goToStep = (nextStep) => {
    setErrors([]);
    setMessage(null);
    setStep(nextStep);
  };

  const loadPersons = debouncePeopleFetch(500, 2);

  const detailsPayload = () => ({
    name: details.name || null,
    shipmentTypeId: details.shipmentType?.id || null,
    originId: details.origin?.id || null,
    destinationId: details.destination?.id || null,
    expectedShippingDate: toApiDate(details.expectedShippingDate),
    expectedDeliveryDate: toApiDate(details.expectedDeliveryDate),
  });

  const trackingPayload = () => ({
    carrierId: tracking.carrier?.id || null,
    shipperId: tracking.shipper?.id || null,
    trackingNumber: tracking.trackingNumber || null,
    recipientId: tracking.recipient?.id || null,
    referenceNumbers: tracking.referenceNumbers,
    statedValue: tracking.statedValue || null,
    totalValue: tracking.totalValue || null,
    additionalInformation: tracking.additionalInformation || null,
  });

  const exitToShipment = () => {
    if (shipmentId) {
      window.location.href = SHIPMENT_URL.showDetails(shipmentId);
    } else {
      window.location.href = SHIPMENT_URL.list();
    }
  };

  const onDetailsNext = (nextStep, exit = false) => {
    createShipmentApi.saveDetails(shipmentId, detailsPayload())
      .then((response) => {
        if (exit) {
          window.location.href = SHIPMENT_URL.showDetails(response.data.data.shipment.id);
        } else {
          onSuccess(response, nextStep);
        }
      })
      .catch(onApiError);
  };

  const onTrackingNext = (nextStep, exit = false) => {
    createShipmentApi.saveTracking(shipmentId, trackingPayload())
      .then((response) => {
        if (exit) {
          exitToShipment();
        } else {
          onSuccess(response, nextStep);
        }
      })
      .catch(onApiError);
  };

  const onAddContainers = () => {
    createShipmentApi.addContainers(shipmentId, {
      containerTypeId: containerType?.id || null,
      containerText,
    })
      .then((response) => {
        setContainerText('');
        onSuccess(response);
        setMessage('Created containers');
      })
      .catch(onApiError);
  };

  const onDeleteContainers = (deleteItems) => {
    createShipmentApi.deleteContainers(shipmentId, {
      containerIds: selectedContainerIds,
      deleteItems,
    })
      .then((response) => {
        setSelectedContainerIds([]);
        onSuccess(response);
        setMessage(deleteItems ? 'Delete selected containers and items' : 'Delete selected containers');
      })
      .catch(onApiError);
  };

  const onDeleteAllContainers = () => {
    createShipmentApi.deleteAllContainers(shipmentId)
      .then((response) => {
        setSelectedContainerIds([]);
        onSuccess(response);
        setMessage('Successfully deleted all containers and items');
      })
      .catch(onApiError);
  };

  const loadInventoryItems = (input, callback) => {
    if (!input || input.length < 2) {
      callback([]);
      return;
    }
    apiClient.get('/json/findInventoryItems', { params: { term: input } })
      .then((response) => {
        callback((response.data || [])
          .filter((item) => item.id && item.id !== 'null')
          .map((item) => ({
            id: item.id,
            value: item.id,
            label: item.label || item.value,
          })));
      })
      .catch(() => callback([]));
  };

  const onAddItem = () => {
    createShipmentApi.addItem(shipmentId, {
      containerId: addItem.container?.id || null,
      inventoryItemId: addItem.inventoryItem?.id || null,
      quantity: addItem.quantity,
    })
      .then((response) => {
        setAddItem({ container: null, inventoryItem: null, quantity: '' });
        onSuccess(response);
        setMessage('Added shipment item');
      })
      .catch(onApiError);
  };

  const onDeleteItem = (itemId) => {
    createShipmentApi.deleteItem(shipmentId, { itemId })
      .then((response) => onSuccess(response))
      .catch(onApiError);
  };

  const onStartPicking = (itemId) => {
    setPickingItemId(itemId);
    setPick({ selection: '', quantity: '', splitQuantity: '' });
    setBinLocations([]);
    createShipmentApi.getBinLocations(shipmentId, itemId)
      .then((response) => setBinLocations(response.data.data || []))
      .catch(onApiError);
  };

  const onPickItem = () => {
    const item = data.shipmentItems.find((it) => it.id === pickingItemId);
    createShipmentApi.pickItem(shipmentId, {
      itemId: pickingItemId,
      selection: pick.selection,
      quantity: pick.quantity || item?.quantity,
    })
      .then((response) => {
        setPickingItemId(null);
        onSuccess(response);
        setMessage('Successfully picked shipment item.');
      })
      .catch(onApiError);
  };

  const onSplitItem = () => {
    createShipmentApi.splitItem(shipmentId, {
      itemId: pickingItemId,
      selection: pick.selection,
      splitQuantity: pick.splitQuantity,
    })
      .then((response) => {
        setPickingItemId(null);
        onSuccess(response);
        setMessage('Successfully split shipment item.');
      })
      .catch(onApiError);
  };

  const onValidatePicklist = (nextStep) => {
    createShipmentApi.validatePicklist(shipmentId)
      .then((response) => {
        setErrors([]);
        setMessage(response.data.data.message);
        if (nextStep) {
          setStep(nextStep);
        }
      })
      .catch(onApiError);
  };

  const onClearPicklist = () => {
    createShipmentApi.clearPicklist(shipmentId)
      .then((response) => {
        onSuccess(response);
        setMessage(`Successfully cleared picklist for shipment ${data?.shipment?.shipmentNumber}`);
      })
      .catch(onApiError);
  };

  const onToggleEmailRecipient = (id) => {
    setSend((prev) => ({
      ...prev,
      emailRecipientIds: prev.emailRecipientIds.includes(id)
        ? prev.emailRecipientIds.filter((it) => it !== id)
        : [...prev.emailRecipientIds, id],
    }));
  };

  const onSendShipment = () => {
    createShipmentApi.send(shipmentId, {
      actualShippingDate: toApiDateTime(send.actualShippingDate),
      comments: send.comments || null,
      emailRecipientIds: send.emailRecipientIds,
      debitStockOnSend: send.debitStockOnSend,
    })
      .then((response) => {
        window.location.href = SHIPMENT_URL.showDetails(response.data.data.shipmentId);
      })
      .catch(onApiError);
  };

  const shipment = data?.shipment;
  const workflow = data?.workflow;
  const stepIndex = STEPS.findIndex(({ key }) => key === step);

  const unpackedItems = data?.shipmentItems?.filter((item) => !item.containerId) || [];

  const renderWizardSteps = () => (
    <div className="d-flex align-items-center justify-content-between mb-3">
      <ul className="nav nav-pills" aria-label="wizard-steps">
        {STEPS.map(({ key, labelId, defaultLabel }, index) => (
          <li className="nav-item" key={key}>
            <button
              type="button"
              className={`btn btn-sm mr-1 ${stepButtonClass(key, step, index, stepIndex)}`}
              disabled={!shipmentId}
              onClick={() => goToStep(key)}
            >
              {index + 1}
              {'. '}
              <Translate id={labelId} defaultMessage={defaultLabel} />
            </button>
          </li>
        ))}
      </ul>
      {step === 'Picking' && shipmentId && (
        <a
          className="btn btn-outline-secondary btn-sm"
          target="_blank"
          rel="noopener noreferrer"
          href={`${CONTEXT_PATH}/report/printPickListReport?shipment.id=${shipmentId}`}
        >
          <Translate id="react.createShipment.printPicklist.label" defaultMessage="Print Pick List" />
        </a>
      )}
    </div>
  );

  const renderSummary = () => (
    <div className="mb-3" aria-label="shipment-summary">
      <div>
        {shipment?.id ? (
          <>
            <small className="font-weight-bold">{shipment.shipmentNumber}</small>
            {' '}
            <a href={SHIPMENT_URL.showDetails(shipment.id)}>{shipment.name}</a>
          </>
        ) : (
          <span className="font-weight-bold">
            <Translate id="react.createShipment.newShipment.label" defaultMessage="New Shipment" />
          </span>
        )}
      </div>
      {shipment?.id && (
        <div className="text-muted">
          {shipment.shipmentTypeName && (
            <span className="mr-3">
              <Translate id="react.createShipment.shipmentType.label" defaultMessage="Shipment type" />
              {': '}
              {shipment.shipmentTypeName}
            </span>
          )}
          {shipment.originName && (
            <span className="mr-3">
              <Translate id="react.createShipment.origin.label" defaultMessage="Origin" />
              {': '}
              {shipment.originName}
            </span>
          )}
          {shipment.destinationName && (
            <span className="mr-3">
              <Translate id="react.createShipment.destination.label" defaultMessage="Destination" />
              {': '}
              {shipment.destinationName}
            </span>
          )}
          {shipment.expectedShippingDate && !shipment.hasShipped && (
            <span className="mr-3">
              <Translate id="react.createShipment.expectedShippingDate.label" defaultMessage="Expected shipping date" />
              {': '}
              {shipment.expectedShippingDate}
            </span>
          )}
        </div>
      )}
    </div>
  );

  const renderDetailsStep = () => (
    <div className="card p-3">
      <h2>
        <Translate id="react.createShipment.enterShipmentDetails.label" defaultMessage="Enter shipment details" />
      </h2>
      <div className="row">
        <div className="col-md-6">
          <label className="font-weight-bold">
            <Translate id="react.createShipment.name.label" defaultMessage="Shipment name" />
          </label>
          <input
            type="text"
            name="name"
            className="form-control form-control-sm mb-2"
            value={details.name}
            onChange={(e) => setDetails((prev) => ({ ...prev, name: e.target.value }))}
          />
          <SelectField
            title={{ id: 'react.createShipment.shipmentType.label', defaultMessage: 'Shipment type' }}
            options={mapOptions(data?.options?.shipmentTypes)}
            defaultValue={details.shipmentType}
            onChange={(value) => setDetails((prev) => ({ ...prev, shipmentType: value }))}
          />
          <SelectField
            title={{ id: 'react.createShipment.origin.label', defaultMessage: 'Origin' }}
            options={mapOptions(data?.options?.origins)}
            defaultValue={details.origin}
            onChange={(value) => setDetails((prev) => ({ ...prev, origin: value }))}
          />
          <SelectField
            title={{ id: 'react.createShipment.destination.label', defaultMessage: 'Destination' }}
            options={mapOptions(data?.options?.destinations)}
            defaultValue={details.destination}
            onChange={(value) => setDetails((prev) => ({ ...prev, destination: value }))}
          />
          <label className="font-weight-bold">
            <Translate id="react.createShipment.expectedShippingDate.label" defaultMessage="Expected shipping date" />
          </label>
          <input
            type="date"
            name="expectedShippingDate"
            className="form-control form-control-sm mb-2"
            value={details.expectedShippingDate}
            onChange={(e) => setDetails((prev) => (
              { ...prev, expectedShippingDate: e.target.value }))}
          />
          <label className="font-weight-bold">
            <Translate id="react.createShipment.expectedDeliveryDate.label" defaultMessage="Expected delivery date" />
          </label>
          <input
            type="date"
            name="expectedDeliveryDate"
            className="form-control form-control-sm mb-2"
            value={details.expectedDeliveryDate}
            onChange={(e) => setDetails((prev) => (
              { ...prev, expectedDeliveryDate: e.target.value }))}
          />
        </div>
      </div>
      <div className="mt-3">
        <button type="button" className="btn btn-primary btn-sm mr-1" onClick={() => onDetailsNext('Tracking')}>
          <Translate id="react.createShipment.next.label" defaultMessage="Next" />
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm mr-1" onClick={() => onDetailsNext(null, true)}>
          <Translate id="react.createShipment.saveAndExit.label" defaultMessage="Save and exit" />
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={exitToShipment}>
          <Translate id="react.createShipment.cancel.label" defaultMessage="Cancel" />
        </button>
      </div>
    </div>
  );

  const renderTrackingStep = () => (
    <div className="card p-3">
      <h2>
        <Translate id="react.createShipment.enterTrackingDetails.label" defaultMessage="Enter tracking details" />
      </h2>
      <div className="row">
        <div className="col-md-6">
          {!workflow?.excluded?.carrier && (
            <SelectField
              title={{ id: 'react.createShipment.carrier.label', defaultMessage: 'Traveler / Carrier' }}
              async
              loadOptions={loadPersons}
              defaultValue={tracking.carrier}
              onChange={(value) => setTracking((prev) => ({ ...prev, carrier: value }))}
            />
          )}
          {!workflow?.excluded?.shipper && (
            <>
              <SelectField
                title={{ id: 'react.createShipment.shipper.label', defaultMessage: 'Shipper' }}
                options={mapOptions(data?.options?.shippers)}
                defaultValue={tracking.shipper}
                onChange={(value) => setTracking((prev) => ({ ...prev, shipper: value }))}
              />
              <label className="font-weight-bold">
                <Translate id="react.createShipment.trackingNumber.label" defaultMessage="Tracking number" />
              </label>
              <input
                type="text"
                name="trackingNumber"
                className="form-control form-control-sm mb-2"
                value={tracking.trackingNumber}
                onChange={(e) => setTracking((prev) => (
                  { ...prev, trackingNumber: e.target.value }))}
              />
            </>
          )}
          {!workflow?.excluded?.recipient && (
            <SelectField
              title={{ id: 'react.createShipment.recipient.label', defaultMessage: 'Recipient' }}
              async
              loadOptions={loadPersons}
              defaultValue={tracking.recipient}
              onChange={(value) => setTracking((prev) => ({ ...prev, recipient: value }))}
            />
          )}
          {workflow?.referenceNumberTypes?.map((type) => (
            <div key={type.id}>
              <label className="font-weight-bold">{type.name}</label>
              <input
                type="text"
                name={`referenceNumber-${type.id}`}
                className="form-control form-control-sm mb-2"
                value={tracking.referenceNumbers[type.id] || ''}
                onChange={(e) => setTracking((prev) => ({
                  ...prev,
                  referenceNumbers: { ...prev.referenceNumbers, [type.id]: e.target.value },
                }))}
              />
            </div>
          ))}
          {!workflow?.excluded?.statedValue && (
            <>
              <label className="font-weight-bold">
                <Translate id="react.createShipment.statedValue.label" defaultMessage="Stated value" />
              </label>
              <input
                type="number"
                name="statedValue"
                className="form-control form-control-sm mb-2"
                value={tracking.statedValue}
                onChange={(e) => setTracking((prev) => ({ ...prev, statedValue: e.target.value }))}
              />
            </>
          )}
          {!workflow?.excluded?.totalValue && (
            <>
              <label className="font-weight-bold">
                <Translate id="react.createShipment.totalValue.label" defaultMessage="Total value" />
              </label>
              <input
                type="number"
                name="totalValue"
                className="form-control form-control-sm mb-2"
                value={tracking.totalValue}
                onChange={(e) => setTracking((prev) => ({ ...prev, totalValue: e.target.value }))}
              />
            </>
          )}
          {!workflow?.excluded?.additionalInformation && (
            <>
              <label className="font-weight-bold">
                <Translate id="react.createShipment.additionalInformation.label" defaultMessage="Additional information" />
              </label>
              <textarea
                name="additionalInformation"
                className="form-control form-control-sm mb-2"
                rows="3"
                value={tracking.additionalInformation}
                onChange={(e) => setTracking((prev) => (
                  { ...prev, additionalInformation: e.target.value }))}
              />
            </>
          )}
        </div>
      </div>
      <div className="mt-3">
        <button type="button" className="btn btn-outline-secondary btn-sm mr-1" onClick={() => goToStep('Details')}>
          <Translate id="react.createShipment.back.label" defaultMessage="Back" />
        </button>
        <button type="button" className="btn btn-primary btn-sm mr-1" onClick={() => onTrackingNext('Packing')}>
          <Translate id="react.createShipment.next.label" defaultMessage="Next" />
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm mr-1" onClick={() => onTrackingNext(null, true)}>
          <Translate id="react.createShipment.saveAndExit.label" defaultMessage="Save and exit" />
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={exitToShipment}>
          <Translate id="react.createShipment.cancel.label" defaultMessage="Cancel" />
        </button>
      </div>
    </div>
  );

  const onToggleContainer = (id) => {
    setSelectedContainerIds((prev) => (
      prev.includes(id) ? prev.filter((it) => it !== id) : [...prev, id]
    ));
  };

  const renderPackingStep = () => (
    <div className="card p-3">
      <h2>
        <Translate id="react.createShipment.enterContainerDetails.label" defaultMessage="Enter packing details" />
      </h2>
      <div className="row">
        <div className="col-md-5">
          <h3>
            <Translate id="react.createShipment.containers.label" defaultMessage="Containers" />
          </h3>
          <table className="table table-sm" aria-label="containers">
            <thead>
              <tr>
                <th />
                <th><Translate id="react.createShipment.container.label" defaultMessage="Container" /></th>
                <th><Translate id="react.createShipment.containerType.label" defaultMessage="Type" /></th>
              </tr>
            </thead>
            <tbody>
              {data?.containers?.length ? data.containers.map((container) => (
                <tr key={container.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedContainerIds.includes(container.id)}
                      onChange={() => onToggleContainer(container.id)}
                    />
                  </td>
                  <td>{container.name}</td>
                  <td>{container.containerTypeName}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="3">
                    <Translate id="react.createShipment.noContainers.label" defaultMessage="No containers" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="d-flex flex-wrap mb-3">
            <button type="button" className="btn btn-outline-danger btn-sm mr-1 mb-1" onClick={() => onDeleteContainers(false)}>
              <Translate id="react.createShipment.deleteContainers.label" defaultMessage="Delete selected containers" />
            </button>
            <button type="button" className="btn btn-outline-danger btn-sm mr-1 mb-1" onClick={() => onDeleteContainers(true)}>
              <Translate id="react.createShipment.deleteContainersAndItems.label" defaultMessage="Delete selected containers and items" />
            </button>
            <button type="button" className="btn btn-outline-danger btn-sm mb-1" onClick={onDeleteAllContainers}>
              <Translate id="react.createShipment.deleteAllContainersAndItems.label" defaultMessage="Delete all containers and items" />
            </button>
          </div>
          <h3>
            <Translate id="react.createShipment.addContainers.label" defaultMessage="Add containers" />
          </h3>
          <SelectField
            title={{ id: 'react.createShipment.containerType.label', defaultMessage: 'Type' }}
            options={mapOptions(workflow?.containerTypes)}
            defaultValue={containerType}
            onChange={setContainerType}
          />
          <label className="font-weight-bold">
            <Translate id="react.createShipment.containerNames.label" defaultMessage="Container names (one per line)" />
          </label>
          <textarea
            name="containerText"
            className="form-control form-control-sm mb-2"
            rows="3"
            value={containerText}
            onChange={(e) => setContainerText(e.target.value)}
          />
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={onAddContainers}>
            <Translate id="react.createShipment.addContainers.label" defaultMessage="Add containers" />
          </button>
        </div>
        <div className="col-md-7">
          <h3>
            <Translate id="react.createShipment.shipmentItems.label" defaultMessage="Shipment items" />
          </h3>
          <table className="table table-sm" aria-label="shipment-items">
            <thead>
              <tr>
                <th><Translate id="react.createShipment.container.label" defaultMessage="Container" /></th>
                <th><Translate id="react.createShipment.product.label" defaultMessage="Product" /></th>
                <th><Translate id="react.createShipment.lotNumber.label" defaultMessage="Lot number" /></th>
                <th><Translate id="react.createShipment.quantity.label" defaultMessage="Quantity" /></th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data?.shipmentItems?.length ? data.shipmentItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.containerName || (
                      <Translate id="react.createShipment.unpacked.label" defaultMessage="Unpacked" />
                    )}
                  </td>
                  <td>
                    {item.productCode}
                    {' '}
                    {item.productName}
                  </td>
                  <td>{item.lotNumber}</td>
                  <td>
                    {item.quantity}
                    {' '}
                    {item.unitOfMeasure}
                  </td>
                  <td>
                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => onDeleteItem(item.id)}>
                      <Translate id="react.createShipment.delete.label" defaultMessage="Delete" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5">
                    <Translate id="react.createShipment.noShipmentItems.label" defaultMessage="No shipment items" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <h3>
            <Translate id="react.createShipment.addShipmentItem.label" defaultMessage="Add shipment item" />
          </h3>
          <SelectField
            title={{ id: 'react.createShipment.container.label', defaultMessage: 'Container' }}
            options={mapOptions(data?.containers)}
            defaultValue={addItem.container}
            onChange={(value) => setAddItem((prev) => ({ ...prev, container: value }))}
          />
          <SelectField
            title={{ id: 'react.createShipment.inventoryItem.label', defaultMessage: 'Inventory item' }}
            async
            loadOptions={loadInventoryItems}
            defaultValue={addItem.inventoryItem}
            onChange={(value) => setAddItem((prev) => ({ ...prev, inventoryItem: value }))}
          />
          <label className="font-weight-bold">
            <Translate id="react.createShipment.quantity.label" defaultMessage="Quantity" />
          </label>
          <input
            type="number"
            name="addItemQuantity"
            className="form-control form-control-sm mb-2"
            value={addItem.quantity}
            onChange={(e) => setAddItem((prev) => ({ ...prev, quantity: e.target.value }))}
          />
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={onAddItem}>
            <Translate id="react.createShipment.addItem.label" defaultMessage="Add item" />
          </button>
        </div>
      </div>
      <div className="mt-3">
        <button type="button" className="btn btn-outline-secondary btn-sm mr-1" onClick={() => goToStep('Tracking')}>
          <Translate id="react.createShipment.back.label" defaultMessage="Back" />
        </button>
        <button type="button" className="btn btn-primary btn-sm mr-1" onClick={() => goToStep('Picking')}>
          <Translate id="react.createShipment.next.label" defaultMessage="Next" />
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm mr-1" onClick={exitToShipment}>
          <Translate id="react.createShipment.saveAndExit.label" defaultMessage="Save and exit" />
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={exitToShipment}>
          <Translate id="react.createShipment.cancel.label" defaultMessage="Cancel" />
        </button>
      </div>
    </div>
  );

  const renderPickingStep = () => (
    <div className="card p-3">
      <h2>
        <Translate id="react.createShipment.pickShipmentItems.label" defaultMessage="Pick shipment items" />
      </h2>
      <div className="mb-2">
        <button type="button" className="btn btn-outline-danger btn-sm mr-1" onClick={onClearPicklist}>
          <Translate id="react.createShipment.clearPicklist.label" defaultMessage="Clear picklist" />
        </button>
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => onValidatePicklist(null)}>
          <Translate id="react.createShipment.validatePicklist.label" defaultMessage="Validate picklist" />
        </button>
      </div>
      <table className="table table-sm" aria-label="picklist-items">
        <thead>
          <tr>
            <th><Translate id="react.createShipment.container.label" defaultMessage="Container" /></th>
            <th><Translate id="react.createShipment.product.label" defaultMessage="Product" /></th>
            <th><Translate id="react.createShipment.lotNumber.label" defaultMessage="Lot number" /></th>
            <th><Translate id="react.createShipment.expirationDate.label" defaultMessage="Expiration date" /></th>
            <th><Translate id="react.createShipment.binLocation.label" defaultMessage="Bin location" /></th>
            <th><Translate id="react.createShipment.quantity.label" defaultMessage="Quantity" /></th>
            <th><Translate id="react.createShipment.uom.label" defaultMessage="UOM" /></th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data?.shipmentItems?.length ? data.shipmentItems.map((item) => (
            <React.Fragment key={item.id}>
              <tr>
                <td>{item.containerName}</td>
                <td>
                  {item.productCode}
                  {' '}
                  {item.productName}
                </td>
                <td>{item.lotNumber}</td>
                <td>{item.expirationDate}</td>
                <td>{item.binLocationName}</td>
                <td>{item.quantity}</td>
                <td>{item.unitOfMeasure}</td>
                <td>
                  <button type="button" className="btn btn-outline-primary btn-sm mr-1" onClick={() => onStartPicking(item.id)}>
                    <Translate id="react.createShipment.pick.label" defaultMessage="Pick" />
                  </button>
                  <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => onDeleteItem(item.id)}>
                    <Translate id="react.createShipment.delete.label" defaultMessage="Delete" />
                  </button>
                </td>
              </tr>
              {pickingItemId === item.id && (
                <tr>
                  <td colSpan="8">
                    <div className="card p-2">
                      <label className="font-weight-bold">
                        <Translate id="react.createShipment.binLocation.label" defaultMessage="Bin location" />
                      </label>
                      <select
                        name="binLocationSelection"
                        className="form-control form-control-sm mb-2"
                        value={pick.selection}
                        onChange={(e) => setPick((prev) => (
                          { ...prev, selection: e.target.value }))}
                      >
                        <option value="">--</option>
                        {binLocations.map((bin) => (
                          <option
                            key={`${bin.binLocationId}:${bin.inventoryItemId}`}
                            value={`${bin.binLocationId || 'null'}:${bin.inventoryItemId}`}
                          >
                            {bin.binLocationName}
                            {' - '}
                            {bin.lotNumber || ''}
                            {' - '}
                            {bin.quantity}
                          </option>
                        ))}
                      </select>
                      <div className="d-flex align-items-end">
                        <div className="mr-2">
                          <label className="font-weight-bold">
                            <Translate id="react.createShipment.quantity.label" defaultMessage="Quantity" />
                          </label>
                          <input
                            type="number"
                            name="pickQuantity"
                            className="form-control form-control-sm"
                            value={pick.quantity}
                            onChange={(e) => setPick((prev) => (
                              { ...prev, quantity: e.target.value }))}
                          />
                        </div>
                        <button type="button" className="btn btn-primary btn-sm mr-2" onClick={onPickItem}>
                          <Translate id="react.createShipment.pick.label" defaultMessage="Pick" />
                        </button>
                        <div className="mr-2">
                          <label className="font-weight-bold">
                            <Translate id="react.createShipment.splitQuantity.label" defaultMessage="Split quantity" />
                          </label>
                          <input
                            type="number"
                            name="splitQuantity"
                            className="form-control form-control-sm"
                            value={pick.splitQuantity}
                            onChange={(e) => setPick((prev) => (
                              { ...prev, splitQuantity: e.target.value }))}
                          />
                        </div>
                        <button type="button" className="btn btn-outline-primary btn-sm mr-2" onClick={onSplitItem}>
                          <Translate id="react.createShipment.split.label" defaultMessage="Split" />
                        </button>
                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setPickingItemId(null)}>
                          <Translate id="react.createShipment.cancel.label" defaultMessage="Cancel" />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          )) : (
            <tr>
              <td colSpan="8">
                <Translate id="react.createShipment.noShipmentItems.label" defaultMessage="No shipment items" />
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="mt-3">
        <button type="button" className="btn btn-outline-secondary btn-sm mr-1" onClick={() => goToStep('Packing')}>
          <Translate id="react.createShipment.back.label" defaultMessage="Back" />
        </button>
        <button type="button" className="btn btn-primary btn-sm mr-1" onClick={() => onValidatePicklist('Sending')}>
          <Translate id="react.createShipment.next.label" defaultMessage="Next" />
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm mr-1" onClick={exitToShipment}>
          <Translate id="react.createShipment.saveAndExit.label" defaultMessage="Save and exit" />
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={exitToShipment}>
          <Translate id="react.createShipment.cancel.label" defaultMessage="Cancel" />
        </button>
      </div>
    </div>
  );

  const renderSendingStep = () => (
    <div className="card p-3">
      <h2>
        <Translate id="react.createShipment.sendShipment.label" defaultMessage="Send shipment" />
      </h2>
      <div className="row">
        <div className="col-md-6">
          <label className="font-weight-bold">
            <Translate id="react.createShipment.expectedShippingDate.label" defaultMessage="Expected shipping date" />
          </label>
          <div className="mb-2">{shipment?.expectedShippingDate}</div>
          <label className="font-weight-bold">
            <Translate id="react.createShipment.actualShippingDate.label" defaultMessage="Actual shipping date" />
          </label>
          <input
            type="datetime-local"
            name="actualShippingDate"
            className="form-control form-control-sm mb-2"
            value={send.actualShippingDate}
            onChange={(e) => setSend((prev) => ({ ...prev, actualShippingDate: e.target.value }))}
          />
          <label className="font-weight-bold">
            <Translate id="react.createShipment.comments.label" defaultMessage="Comments" />
          </label>
          <textarea
            name="comments"
            className="form-control form-control-sm mb-2"
            rows="3"
            value={send.comments}
            onChange={(e) => setSend((prev) => ({ ...prev, comments: e.target.value }))}
          />
          {data?.emailRecipients?.length > 0 && (
            <div className="mb-2" aria-label="email-recipients">
              <label className="font-weight-bold">
                <Translate id="react.createShipment.emailRecipients.label" defaultMessage="Send notification email to" />
              </label>
              {data.emailRecipients.map((recipient) => (
                <div key={recipient.id} className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`emailRecipient-${recipient.id}`}
                    checked={send.emailRecipientIds.includes(recipient.id)}
                    onChange={() => onToggleEmailRecipient(recipient.id)}
                  />
                  <label className="form-check-label" htmlFor={`emailRecipient-${recipient.id}`}>
                    {recipient.name}
                    {recipient.email ? ` (${recipient.email})` : ''}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="col-md-6">
          <h3>
            <Translate id="react.createShipment.shipmentContents.label" defaultMessage="Shipment contents" />
          </h3>
          <table className="table table-sm" aria-label="send-shipment-items">
            <thead>
              <tr>
                <th><Translate id="react.createShipment.product.label" defaultMessage="Product" /></th>
                <th><Translate id="react.createShipment.lotNumber.label" defaultMessage="Lot number" /></th>
                <th><Translate id="react.createShipment.binLocation.label" defaultMessage="Bin location" /></th>
                <th><Translate id="react.createShipment.quantity.label" defaultMessage="Quantity" /></th>
              </tr>
            </thead>
            <tbody>
              {data?.shipmentItems?.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.productCode}
                    {' '}
                    {item.productName}
                  </td>
                  <td>{item.lotNumber}</td>
                  <td>{item.binLocationName}</td>
                  <td>
                    {item.quantity}
                    {' '}
                    {item.unitOfMeasure}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-3">
        <button type="button" className="btn btn-outline-secondary btn-sm mr-1" onClick={() => goToStep('Picking')}>
          <Translate id="react.createShipment.back.label" defaultMessage="Back" />
        </button>
        <button type="button" className="btn btn-primary btn-sm mr-1" onClick={onSendShipment}>
          <Translate id="react.createShipment.sendShipment.label" defaultMessage="Send shipment" />
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm mr-1" onClick={exitToShipment}>
          <Translate id="react.createShipment.saveAndExit.label" defaultMessage="Save and exit" />
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={exitToShipment}>
          <Translate id="react.createShipment.cancel.label" defaultMessage="Cancel" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-3">
      {renderWizardSteps()}
      {renderSummary()}
      {message && (
        <div className="alert alert-success" role="alert" aria-label="flash-message">
          {message}
        </div>
      )}
      {errors.length > 0 && (
        <div className="alert alert-danger" role="alert" aria-label="error-message">
          <ul className="mb-0">
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}
      {unpackedItems.length > 0 && step === 'Packing' && (
        <div className="alert alert-warning" role="alert">
          <Translate id="react.createShipment.unpackedItems.message" defaultMessage="There are unpacked items in this shipment." />
        </div>
      )}
      {step === 'Details' && renderDetailsStep()}
      {step === 'Tracking' && renderTrackingStep()}
      {step === 'Packing' && renderPackingStep()}
      {step === 'Picking' && renderPickingStep()}
      {step === 'Sending' && renderSendingStep()}
    </div>
  );
};

export default withRouter(CreateShipmentPage);

CreateShipmentPage.propTypes = {
  location: PropTypes.shape({
    search: PropTypes.string,
  }).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      shipmentId: PropTypes.string,
    }),
  }).isRequired,
};
