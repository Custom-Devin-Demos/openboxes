import React, { useEffect, useState } from 'react';

import { useHistory, useParams } from 'react-router-dom';

import shipmentItemApi from 'api/services/ShipmentItemApi';
import Button from 'components/form-elements/Button';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { SHIPMENT_ITEM_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const ShipmentItemShow = () => {
  useTranslation('shipmentItem', 'default');
  const { id } = useParams();
  const history = useHistory();
  const spinner = useSpinner();
  const [shipmentItem, setShipmentItem] = useState(null);

  useEffect(() => {
    spinner.show();
    shipmentItemApi.getShipmentItem(id)
      .then((response) => setShipmentItem(response.data.data))
      .catch(() => history.push(SHIPMENT_ITEM_URL.list()))
      .finally(() => spinner.hide());
  }, [id]);

  const deleteShipmentItem = async (onClose) => {
    try {
      await shipmentItemApi.deleteShipmentItem(id);
      notification(NotificationType.SUCCESS)({
        message: `Shipment item ${id} deleted`,
      });
      history.push(SHIPMENT_ITEM_URL.list());
    } finally {
      onClose?.();
    }
  };

  const deleteConfirmationModalButtons = (onClose) => ([
    {
      variant: 'transparent',
      defaultLabel: 'No',
      label: 'react.default.no.label',
      onClick: () => onClose?.(),
    },
    {
      variant: 'primary',
      defaultLabel: 'Yes',
      label: 'react.default.yes.label',
      onClick: () => deleteShipmentItem(onClose),
    },
  ]);

  const onDelete = () => confirmationModal({
    buttons: deleteConfirmationModalButtons,
    title: {
      label: 'react.default.areYouSure.label',
      default: 'Are you sure?',
    },
  });

  const rows = shipmentItem ? [
    {
      key: 'id',
      label: translate({ id: 'react.shipmentItem.column.id.label', defaultMessage: 'Id' }),
      value: shipmentItem.id,
    },
    {
      key: 'container',
      label: translate({ id: 'react.shipmentItem.column.container.label', defaultMessage: 'Container' }),
      value: shipmentItem.container?.name,
    },
    {
      key: 'product',
      label: translate({ id: 'react.shipmentItem.column.product.label', defaultMessage: 'Product' }),
      value: shipmentItem.product?.name,
    },
    {
      key: 'lotNumber',
      label: translate({ id: 'react.shipmentItem.column.lotNumber.label', defaultMessage: 'Lot Number' }),
      value: shipmentItem.lotNumber,
    },
    {
      key: 'expirationDate',
      label: translate({ id: 'react.shipmentItem.column.expirationDate.label', defaultMessage: 'Expiration Date' }),
      value: shipmentItem.expirationDate,
    },
    {
      key: 'quantity',
      label: translate({ id: 'react.shipmentItem.column.quantity.label', defaultMessage: 'Quantity' }),
      value: shipmentItem.quantity,
    },
    {
      key: 'recipient',
      label: translate({ id: 'react.shipmentItem.recipient.label', defaultMessage: 'Recipient' }),
      value: shipmentItem.recipient?.name,
    },
    {
      key: 'inventoryItem',
      label: translate({ id: 'react.shipmentItem.inventoryItem.label', defaultMessage: 'Inventory Item' }),
      value: shipmentItem.inventoryItem?.name,
    },
    {
      key: 'donor',
      label: translate({ id: 'react.shipmentItem.donor.label', defaultMessage: 'Donor' }),
      value: shipmentItem.donor?.name,
    },
    {
      key: 'dateCreated',
      label: translate({ id: 'react.shipmentItem.dateCreated.label', defaultMessage: 'Date Created' }),
      value: shipmentItem.dateCreated,
    },
    {
      key: 'lastUpdated',
      label: translate({ id: 'react.shipmentItem.lastUpdated.label', defaultMessage: 'Last Updated' }),
      value: shipmentItem.lastUpdated,
    },
    {
      key: 'orderItems',
      label: translate({ id: 'react.shipmentItem.orderItems.label', defaultMessage: 'Order Items' }),
      value: (shipmentItem.orderItems || []).map((orderItem) => orderItem.name).join(', '),
    },
    {
      key: 'shipment',
      label: translate({ id: 'react.shipmentItem.shipment.label', defaultMessage: 'Shipment' }),
      value: shipmentItem.shipment?.name,
    },
  ] : [];

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.shipmentItem.showShipmentItem.label',
          defaultMessage: 'Show Shipment Item',
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
          <h2>{shipmentItem.product?.name}</h2>
          <table className="table table-sm w-50">
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td className="font-weight-bold">{row.label}</td>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="d-flex">
            <Button
              label="react.default.button.edit.label"
              defaultLabel="Edit"
              onClick={() => history.push(SHIPMENT_ITEM_URL.edit(id))}
            />
            <Button
              variant="danger"
              label="react.default.button.delete.label"
              defaultLabel="Delete"
              onClick={onDelete}
            />
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default ShipmentItemShow;
