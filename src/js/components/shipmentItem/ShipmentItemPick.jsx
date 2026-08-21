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

const ShipmentItemPick = () => {
  useTranslation('shipmentItem', 'default');
  const { id } = useParams();
  const history = useHistory();
  const spinner = useSpinner();
  const [shipmentItem, setShipmentItem] = useState(null);
  const [binLocations, setBinLocations] = useState([]);
  const [selection, setSelection] = useState('');
  const [quantity, setQuantity] = useState('');

  const fetchPick = () => {
    spinner.show();
    shipmentItemApi.getShipmentItemPick(id)
      .then((response) => {
        const { data } = response.data;
        setShipmentItem(data.shipmentItem);
        setBinLocations(data.binLocations || []);
        const selected = (data.binLocationSelected || [])[0];
        setSelection(selected ? selectionKey(selected) : '');
        setQuantity(data.shipmentItem.quantity != null ? `${data.shipmentItem.quantity}` : '');
      })
      .catch(() => history.push(SHIPMENT_ITEM_URL.list()))
      .finally(() => spinner.hide());
  };

  useEffect(() => {
    fetchPick();
  }, [id]);

  const totalQuantityOnHand = binLocations
    .reduce((sum, entry) => sum + (entry.quantity || 0), 0);

  const selectedEntry = binLocations.find((entry) => selectionKey(entry) === selection);
  const quantityNeeded = shipmentItem?.quantity || 0;
  const isPicked = Boolean(selectedEntry) && (selectedEntry.quantity || 0) >= quantityNeeded;

  const onPick = async (event) => {
    event.preventDefault();
    if (!selection) {
      notification(NotificationType.ERROR_OUTLINED)({
        message: 'Please choose a bin location from the list',
      });
      return;
    }
    try {
      await shipmentItemApi.updateShipmentItemPick(id, { selection, quantity });
      notification(NotificationType.SUCCESS)({
        message: 'Successfully picked shipment item',
      });
      fetchPick();
    } catch (error) {
      // error notification handled by apiClient interceptor
    }
  };

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.shipmentItem.pickShipmentItem.label',
          defaultMessage: 'Pick Shipment Item',
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
          <div className="mb-2">
            <span className={`badge ${isPicked ? 'badge-success' : 'badge-warning'}`}>
              {isPicked
                ? <Translate id="react.shipmentItem.pick.picked.label" defaultMessage="Picked" />
                : <Translate id="react.shipmentItem.pick.notPicked.label" defaultMessage="Not picked" />}
            </span>
          </div>
          <form onSubmit={onPick}>
            <table className="table table-sm">
              <thead>
                <tr>
                  <td className="font-weight-bold"><Translate id="react.shipmentItem.pick.selected.label" defaultMessage="Selected" /></td>
                  <td className="font-weight-bold"><Translate id="react.shipmentItem.pick.binLocation.label" defaultMessage="Bin Location" /></td>
                  <td className="font-weight-bold"><Translate id="react.shipmentItem.column.lotNumber.label" defaultMessage="Lot Number" /></td>
                  <td className="font-weight-bold"><Translate id="react.shipmentItem.column.expirationDate.label" defaultMessage="Expiration Date" /></td>
                  <td className="font-weight-bold"><Translate id="react.shipmentItem.column.quantity.label" defaultMessage="Quantity" /></td>
                  <td className="font-weight-bold"><Translate id="react.shipmentItem.pick.sufficient.label" defaultMessage="Sufficient" /></td>
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
                      <td>{(entry.quantity || 0) >= quantityNeeded ? 'Yes' : 'No'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4" className="font-weight-bold">
                    <Translate id="react.shipmentItem.pick.totalQuantityOnHand.label" defaultMessage="Total Quantity On Hand" />
                  </td>
                  <td colSpan="2" className="font-weight-bold">{totalQuantityOnHand}</td>
                </tr>
              </tfoot>
            </table>
            <div className="w-25 mb-3">
              <div className="mb-2">
                <Translate id="react.shipmentItem.pick.quantityNeeded.label" defaultMessage="Quantity Needed" />
                {': '}
                {quantityNeeded}
              </div>
              <TextInput
                title={{ id: 'react.shipmentItem.pick.quantityPicked.label', defaultMessage: 'Quantity Picked' }}
                name="quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              label="react.shipmentItem.pick.pick.label"
              defaultLabel="Pick"
            />
          </form>
        </div>
      )}
    </PageWrapper>
  );
};

export default ShipmentItemPick;
