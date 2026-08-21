import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import shipmentItemApi from 'api/services/ShipmentItemApi';
import Button from 'components/form-elements/Button';
import SelectField from 'components/form-elements/v2/SelectField';
import TextInput from 'components/form-elements/v2/TextInput';
import notification from 'components/Layout/notifications/notification';
import { SHIPMENT_ITEM_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const toOption = (option) => ({ id: option.id, value: option.id, label: option.label });

const findOption = (options, entity) => {
  if (!entity) {
    return null;
  }
  return options.find((option) => option.id === entity.id)
    || { id: entity.id, value: entity.id, label: entity.name };
};

const ShipmentItemForm = ({ match }) => {
  useTranslation('shipmentItem');
  const { shipmentItemId } = match.params;
  const isEdit = Boolean(shipmentItemId);

  const [values, setValues] = useState({
    container: null,
    product: null,
    lotNumber: '',
    expirationDate: '',
    quantity: '',
    recipient: null,
    inventoryItem: null,
    donor: null,
    shipment: null,
    version: null,
  });
  const [options, setOptions] = useState({
    containers: [],
    products: [],
    persons: [],
    inventoryItems: [],
    donors: [],
    shipments: [],
  });
  const [shipmentItem, setShipmentItem] = useState(null);

  useEffect(() => {
    shipmentItemApi.getShipmentItemOptions()
      .then((response) => {
        const { data } = response.data;
        setOptions({
          containers: (data.containers || []).map(toOption),
          products: (data.products || []).map(toOption),
          persons: (data.persons || []).map(toOption),
          inventoryItems: (data.inventoryItems || []).map(toOption),
          donors: (data.donors || []).map(toOption),
          shipments: (data.shipments || []).map(toOption),
        });
      });
  }, []);

  useEffect(() => {
    if (isEdit) {
      shipmentItemApi.getShipmentItem(shipmentItemId)
        .then((response) => {
          setShipmentItem(response.data.data);
        });
    }
  }, [shipmentItemId]);

  useEffect(() => {
    if (shipmentItem) {
      setValues({
        container: findOption(options.containers, shipmentItem.container),
        product: findOption(options.products, shipmentItem.product),
        lotNumber: shipmentItem.lotNumber || '',
        expirationDate: shipmentItem.expirationDate ? shipmentItem.expirationDate.substring(0, 10) : '',
        quantity: shipmentItem.quantity != null ? `${shipmentItem.quantity}` : '',
        recipient: findOption(options.persons, shipmentItem.recipient),
        inventoryItem: findOption(options.inventoryItems, shipmentItem.inventoryItem),
        donor: findOption(options.donors, shipmentItem.donor),
        shipment: findOption(options.shipments, shipmentItem.shipment),
        version: shipmentItem.version,
      });
    }
  }, [shipmentItem, options]);

  const setValue = (field) => (value) => setValues((prev) => ({ ...prev, [field]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      container: values.container?.id || null,
      product: values.product?.id || null,
      lotNumber: values.lotNumber,
      expirationDate: values.expirationDate || null,
      quantity: values.quantity,
      recipient: values.recipient?.id || null,
      inventoryItem: values.inventoryItem?.id || null,
      donor: values.donor?.id || null,
      shipment: values.shipment?.id || null,
    };
    if (isEdit) {
      await shipmentItemApi.updateShipmentItem(shipmentItemId, {
        ...payload,
        version: values.version,
      });
      notification(NotificationType.SUCCESS)({
        message: `Shipment item ${shipmentItemId} updated`,
      });
    } else {
      const response = await shipmentItemApi.createShipmentItem(payload);
      notification(NotificationType.SUCCESS)({
        message: `Shipment item ${response.data.data.id} created`,
      });
    }
    window.location = SHIPMENT_ITEM_URL.list();
  };

  const deleteShipmentItem = async (onClose) => {
    try {
      await shipmentItemApi.deleteShipmentItem(shipmentItemId);
      notification(NotificationType.SUCCESS)({
        message: `Shipment item ${shipmentItemId} deleted`,
      });
      window.location = SHIPMENT_ITEM_URL.list();
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

  return (
    <PageWrapper>
      <div className="d-flex flex-column m-3">
        <h1 className="mb-3">
          {isEdit
            ? <Translate id="react.shipmentItem.editShipmentItem.label" defaultMessage="Edit Shipment Item" />
            : <Translate id="react.shipmentItem.createShipmentItem.label" defaultMessage="Create Shipment Item" />}
        </h1>
        <form onSubmit={onSubmit} className="w-50">
          <div className="mb-3">
            <SelectField
              title={{ id: 'react.shipmentItem.column.container.label', defaultMessage: 'Container' }}
              name="container"
              options={options.containers}
              defaultValue={values.container}
              onChange={setValue('container')}
            />
          </div>
          <div className="mb-3">
            <SelectField
              title={{ id: 'react.shipmentItem.column.product.label', defaultMessage: 'Product' }}
              name="product"
              options={options.products}
              defaultValue={values.product}
              onChange={setValue('product')}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.shipmentItem.column.lotNumber.label', defaultMessage: 'Lot Number' }}
              name="lotNumber"
              value={values.lotNumber}
              onChange={(e) => setValue('lotNumber')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.shipmentItem.column.expirationDate.label', defaultMessage: 'Expiration Date' }}
              name="expirationDate"
              type="date"
              value={values.expirationDate}
              onChange={(e) => setValue('expirationDate')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.shipmentItem.column.quantity.label', defaultMessage: 'Quantity' }}
              name="quantity"
              value={values.quantity}
              onChange={(e) => setValue('quantity')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <SelectField
              title={{ id: 'react.shipmentItem.recipient.label', defaultMessage: 'Recipient' }}
              name="recipient"
              options={options.persons}
              defaultValue={values.recipient}
              onChange={setValue('recipient')}
            />
          </div>
          <div className="mb-3">
            <SelectField
              title={{ id: 'react.shipmentItem.inventoryItem.label', defaultMessage: 'Inventory Item' }}
              name="inventoryItem"
              options={options.inventoryItems}
              defaultValue={values.inventoryItem}
              onChange={setValue('inventoryItem')}
            />
          </div>
          <div className="mb-3">
            <SelectField
              title={{ id: 'react.shipmentItem.donor.label', defaultMessage: 'Donor' }}
              name="donor"
              options={options.donors}
              defaultValue={values.donor}
              onChange={setValue('donor')}
            />
          </div>
          <div className="mb-3">
            <SelectField
              title={{ id: 'react.shipmentItem.shipment.label', defaultMessage: 'Shipment' }}
              name="shipment"
              options={options.shipments}
              defaultValue={values.shipment}
              onChange={setValue('shipment')}
            />
          </div>
          <div className="d-flex gap-8 align-items-center">
            <Button
              type="submit"
              label={isEdit ? 'react.default.button.update.label' : 'react.default.button.create.label'}
              defaultLabel={isEdit ? 'Update' : 'Create'}
            />
            {isEdit && (
              <Button
                type="button"
                variant="danger"
                label="react.default.button.delete.label"
                defaultLabel="Delete"
                onClick={onDelete}
              />
            )}
            <a href={SHIPMENT_ITEM_URL.list()} className="ml-2">
              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
            </a>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default withRouter(ShipmentItemForm);

ShipmentItemForm.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      shipmentItemId: PropTypes.string,
    }),
  }).isRequired,
};
