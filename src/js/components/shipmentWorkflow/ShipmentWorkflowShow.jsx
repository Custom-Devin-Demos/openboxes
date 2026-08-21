import React, { useEffect, useState } from 'react';

import { useHistory, useParams } from 'react-router-dom';

import shipmentWorkflowApi from 'api/services/ShipmentWorkflowApi';
import Button from 'components/form-elements/Button';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { SHIPMENT_WORKFLOW_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const ShipmentWorkflowShow = () => {
  useTranslation('shipmentWorkflow', 'default');
  const { id } = useParams();
  const history = useHistory();
  const spinner = useSpinner();
  const [shipmentWorkflow, setShipmentWorkflow] = useState(null);

  useEffect(() => {
    spinner.show();
    shipmentWorkflowApi.getShipmentWorkflow(id)
      .then((response) => setShipmentWorkflow(response.data.data))
      .catch(() => history.push(SHIPMENT_WORKFLOW_URL.list()))
      .finally(() => spinner.hide());
  }, [id]);

  const deleteShipmentWorkflow = async (onClose) => {
    try {
      await shipmentWorkflowApi.deleteShipmentWorkflow(id);
      notification(NotificationType.SUCCESS)({
        message: `Shipment workflow ${id} deleted`,
      });
      history.push(SHIPMENT_WORKFLOW_URL.list());
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
      onClick: () => deleteShipmentWorkflow(onClose),
    },
  ]);

  const onDelete = () => confirmationModal({
    buttons: deleteConfirmationModalButtons,
    title: {
      label: 'react.default.areYouSure.label',
      default: 'Are you sure?',
    },
  });

  const toList = (entities) => (entities || []).map((entity) => entity.name).join(', ');

  const rows = shipmentWorkflow ? [
    {
      key: 'id',
      label: translate({ id: 'react.shipmentWorkflow.column.id.label', defaultMessage: 'Id' }),
      value: shipmentWorkflow.id,
    },
    {
      key: 'name',
      label: translate({ id: 'react.shipmentWorkflow.column.name.label', defaultMessage: 'Name' }),
      value: shipmentWorkflow.name,
    },
    {
      key: 'shipmentType',
      label: translate({ id: 'react.shipmentWorkflow.column.shipmentType.label', defaultMessage: 'Shipment Type' }),
      value: shipmentWorkflow.shipmentType?.name,
    },
    {
      key: 'excludedFields',
      label: translate({ id: 'react.shipmentWorkflow.column.excludedFields.label', defaultMessage: 'Excluded Fields' }),
      value: shipmentWorkflow.excludedFields,
    },
    {
      key: 'documentTemplate',
      label: translate({ id: 'react.shipmentWorkflow.column.documentTemplate.label', defaultMessage: 'Document Template' }),
      value: shipmentWorkflow.documentTemplate,
    },
    {
      key: 'dateCreated',
      label: translate({ id: 'react.shipmentWorkflow.column.dateCreated.label', defaultMessage: 'Date Created' }),
      value: shipmentWorkflow.dateCreated,
    },
    {
      key: 'lastUpdated',
      label: translate({ id: 'react.shipmentWorkflow.lastUpdated.label', defaultMessage: 'Last Updated' }),
      value: shipmentWorkflow.lastUpdated,
    },
    {
      key: 'referenceNumberTypes',
      label: translate({ id: 'react.shipmentWorkflow.referenceNumberTypes.label', defaultMessage: 'Reference Number Types' }),
      value: toList(shipmentWorkflow.referenceNumberTypes),
    },
    {
      key: 'containerTypes',
      label: translate({ id: 'react.shipmentWorkflow.containerTypes.label', defaultMessage: 'Container Types' }),
      value: toList(shipmentWorkflow.containerTypes),
    },
    {
      key: 'documentTemplates',
      label: translate({ id: 'react.shipmentWorkflow.documentTemplates.label', defaultMessage: 'Document Templates' }),
      value: toList(shipmentWorkflow.documentTemplates),
    },
  ] : [];

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.shipmentWorkflow.showShipmentWorkflow.label',
          defaultMessage: 'Show Shipment Workflow',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.shipmentWorkflow.header.label"
            defaultLabel="Shipment Workflows"
            variant="secondary"
            onClick={() => history.push(SHIPMENT_WORKFLOW_URL.list())}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      {shipmentWorkflow && (
        <div className="p-3">
          <h2>{shipmentWorkflow.name}</h2>
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
              onClick={() => history.push(SHIPMENT_WORKFLOW_URL.edit(id))}
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

export default ShipmentWorkflowShow;
