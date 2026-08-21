import React, { useEffect, useState } from 'react';

import { useHistory, useParams } from 'react-router-dom';

import shipmentItemApi from 'api/services/ShipmentItemApi';
import Button from 'components/form-elements/Button';
import TextInput from 'components/form-elements/v2/TextInput';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { SHIPMENT_ITEM_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const selectionKey = (entry) => `${entry.binLocation?.id || 'null'}:${entry.inventoryItem?.id || 'null'}`;

const ShipmentItemSplit = () => {
  useTranslation('shipmentItem', 'default');
  const { id } = useParams();
  const history = useHistory();
  const spinner = useSpinner();
  const [shipmentItem, setShipmentItem] = useState(null);
  const [binLocations, setBinLocations] = useState([]);
  const [selection, setSelection] = useState('');
  const [splitQuantity, setSplitQuantity] = useState('');

  const fetchSplit = () => {
    spinner.show();
    shipmentItemApi.getShipmentItemSplit(id)
      .then((response) => {
        const { data } = response.data;
        setShipmentItem(data.shipmentItem);
        setBinLocations(data.binLocations || []);
        const selected = (data.binLocationSelected || [])[0];
        setSelection(selected ? selectionKey(selected) : '');
      })
      .catch(() => history.push(SHIPMENT_ITEM_URL.list()))
      .finally(() => spinner.hide());
  };

  useEffect(() => {
    fetchSplit();
  }, [id]);

  const originalQuantity = shipmentItem?.quantity || 0;
  const parsedSplitQuantity = parseInt(splitQuantity, 10);
  const remainingQuantity = Number.isNaN(parsedSplitQuantity)
    ? originalQuantity
    : originalQuantity - parsedSplitQuantity;

  const onSplit = async (event) => {
    event.preventDefault();
    if (!selection) {
      notification(NotificationType.ERROR_OUTLINED)({
        message: 'Please choose a bin location from the list',
      });
      return;
    }
    if (Number.isNaN(parsedSplitQuantity) || parsedSplitQuantity <= 0 || remainingQuantity <= 0) {
      notification(NotificationType.ERROR_OUTLINED)({
        message: 'Quantity is invalid',
      });
      return;
    }
    try {
      await shipmentItemApi.updateShipmentItemSplit(id, { selection, splitQuantity });
      notification(NotificationType.SUCCESS)({
        message: 'Successfully split shipment item',
      });
      history.push(SHIPMENT_ITEM_URL.list());
    } catch (error) {
      // error notification handled by apiClient interceptor
    }
  };

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.shipmentItem.splitShipmentItem.label',
          defaultMessage: 'Split Shipment Item',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.shipmentItem.header.label"
            defaultLabel="Shipment Items"
            variant="secondary"
            onClick={() => history.push(SHIPMENT_ITEM_URL.list())}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      {shipmentItem && (
        <div className="p-3">
          <h2>
            {shipmentItem.product?.productCode}
            {' '}
            {shipmentItem.product?.name}
          </h2>
          <div className="alert alert-warning w-50">
            <Translate
              id="react.shipmentItem.split.warning.label"
              defaultMessage="Please be careful using this feature. Once you split an item you cannot undo the operation."
            />
          </div>
          <table className="table table-sm w-50 mb-3">
            <tbody>
              <tr>
                <td className="font-weight-bold"><Translate id="react.shipmentItem.split.binLocation.label" defaultMessage="Bin Location" /></td>
                <td>{shipmentItem.binLocation?.name || <Translate id="react.default.default.label" defaultMessage="Default" />}</td>
              </tr>
              <tr>
                <td className="font-weight-bold"><Translate id="react.shipmentItem.column.lotNumber.label" defaultMessage="Lot Number" /></td>
                <td>{shipmentItem.lotNumber}</td>
              </tr>
              <tr>
                <td className="font-weight-bold"><Translate id="react.shipmentItem.column.expirationDate.label" defaultMessage="Expiration Date" /></td>
                <td>{shipmentItem.expirationDate}</td>
              </tr>
              <tr>
                <td className="font-weight-bold"><Translate id="react.shipmentItem.column.quantity.label" defaultMessage="Quantity" /></td>
                <td>{originalQuantity}</td>
              </tr>
            </tbody>
          </table>
          <form onSubmit={onSplit}>
            <h3><Translate id="react.shipmentItem.split.newItem.label" defaultMessage="Split Item" /></h3>
            <table className="table table-sm">
              <thead>
                <tr>
                  <td className="font-weight-bold"><Translate id="react.shipmentItem.pick.selected.label" defaultMessage="Selected" /></td>
                  <td className="font-weight-bold"><Translate id="react.shipmentItem.pick.binLocation.label" defaultMessage="Bin Location" /></td>
                  <td className="font-weight-bold"><Translate id="react.shipmentItem.column.lotNumber.label" defaultMessage="Lot Number" /></td>
                  <td className="font-weight-bold"><Translate id="react.shipmentItem.column.expirationDate.label" defaultMessage="Expiration Date" /></td>
                  <td className="font-weight-bold"><Translate id="react.shipmentItem.column.quantity.label" defaultMessage="Quantity" /></td>
                </tr>
              </thead>
              <tbody>
                {binLocations.map((entry) => {
                  const key = selectionKey(entry);
                  return (
                    <tr key={key}>
                      <td>
                        <input
                          type="radio"
                          name="selection"
                          value={key}
                          checked={selection === key}
                          onChange={() => setSelection(key)}
                        />
                      </td>
                      <td>{entry.binLocation?.name || <Translate id="react.default.default.label" defaultMessage="Default" />}</td>
                      <td>{entry.inventoryItem?.lotNumber}</td>
                      <td>{entry.inventoryItem?.expirationDate ? entry.inventoryItem.expirationDate.substring(0, 10) : ''}</td>
                      <td>{entry.quantity}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="w-25 mb-3">
              <TextInput
                title={{ id: 'react.shipmentItem.split.splitQuantity.label', defaultMessage: 'Split Quantity' }}
                name="splitQuantity"
                value={splitQuantity}
                onChange={(e) => setSplitQuantity(e.target.value)}
              />
              <div className="mt-2">
                <Translate id="react.shipmentItem.split.remainingQuantity.label" defaultMessage="Remaining Quantity" />
                {': '}
                {remainingQuantity}
              </div>
            </div>
            <Button
              type="submit"
              label="react.shipmentItem.split.split.label"
              defaultLabel="Split"
            />
          </form>
        </div>
      )}
    </PageWrapper>
  );
};

export default ShipmentItemSplit;
