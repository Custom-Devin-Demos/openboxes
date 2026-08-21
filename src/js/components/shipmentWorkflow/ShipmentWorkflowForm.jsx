import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import shipmentWorkflowApi from 'api/services/ShipmentWorkflowApi';
import Button from 'components/form-elements/Button';
import SelectField from 'components/form-elements/v2/SelectField';
import TextInput from 'components/form-elements/v2/TextInput';
import notification from 'components/Layout/notifications/notification';
import { SHIPMENT_WORKFLOW_URL } from 'consts/applicationUrls';
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

const findOptions = (options, entities) => (entities || [])
  .map((entity) => findOption(options, entity))
  .filter(Boolean);

const ShipmentWorkflowForm = ({ match }) => {
  useTranslation('shipmentWorkflow', 'default');
  const { shipmentWorkflowId } = match.params;
  const isEdit = Boolean(shipmentWorkflowId);

  const [values, setValues] = useState({
    name: '',
    shipmentType: null,
    excludedFields: '',
    documentTemplate: '',
    referenceNumberTypes: [],
    containerTypes: [],
    documentTemplates: [],
    version: null,
  });
  const [options, setOptions] = useState({
    shipmentTypes: [],
    referenceNumberTypes: [],
    containerTypes: [],
    documentTemplates: [],
  });
  const [shipmentWorkflow, setShipmentWorkflow] = useState(null);

  useEffect(() => {
    shipmentWorkflowApi.getShipmentWorkflowOptions()
      .then((response) => {
        const { data } = response.data;
        setOptions({
          shipmentTypes: (data.shipmentTypes || []).map(toOption),
          referenceNumberTypes: (data.referenceNumberTypes || []).map(toOption),
          containerTypes: (data.containerTypes || []).map(toOption),
          documentTemplates: (data.documentTemplates || []).map(toOption),
        });
      });
  }, []);

  useEffect(() => {
    if (isEdit) {
      shipmentWorkflowApi.getShipmentWorkflow(shipmentWorkflowId)
        .then((response) => {
          setShipmentWorkflow(response.data.data);
        });
    }
  }, [shipmentWorkflowId]);

  useEffect(() => {
    if (shipmentWorkflow) {
      setValues({
        name: shipmentWorkflow.name || '',
        shipmentType: findOption(options.shipmentTypes, shipmentWorkflow.shipmentType),
        excludedFields: shipmentWorkflow.excludedFields || '',
        documentTemplate: shipmentWorkflow.documentTemplate || '',
        referenceNumberTypes:
          findOptions(options.referenceNumberTypes, shipmentWorkflow.referenceNumberTypes),
        containerTypes: findOptions(options.containerTypes, shipmentWorkflow.containerTypes),
        documentTemplates:
          findOptions(options.documentTemplates, shipmentWorkflow.documentTemplates),
        version: shipmentWorkflow.version,
      });
    }
  }, [shipmentWorkflow, options]);

  const setValue = (field) => (value) => setValues((prev) => ({ ...prev, [field]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      name: values.name,
      shipmentType: values.shipmentType?.id || null,
      excludedFields: values.excludedFields,
      documentTemplate: values.documentTemplate,
    };
    if (isEdit) {
      await shipmentWorkflowApi.updateShipmentWorkflow(shipmentWorkflowId, {
        ...payload,
        referenceNumberTypes: (values.referenceNumberTypes || []).map((option) => option.id),
        containerTypes: (values.containerTypes || []).map((option) => option.id),
        documentTemplates: (values.documentTemplates || []).map((option) => option.id),
        version: values.version,
      });
      notification(NotificationType.SUCCESS)({
        message: `Shipment workflow ${shipmentWorkflowId} updated`,
      });
    } else {
      const response = await shipmentWorkflowApi.createShipmentWorkflow(payload);
      notification(NotificationType.SUCCESS)({
        message: `Shipment workflow ${response.data.data.id} created`,
      });
    }
    window.location = SHIPMENT_WORKFLOW_URL.list();
  };

  const deleteShipmentWorkflow = async (onClose) => {
    try {
      await shipmentWorkflowApi.deleteShipmentWorkflow(shipmentWorkflowId);
      notification(NotificationType.SUCCESS)({
        message: `Shipment workflow ${shipmentWorkflowId} deleted`,
      });
      window.location = SHIPMENT_WORKFLOW_URL.list();
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

  return (
    <PageWrapper>
      <div className="d-flex flex-column m-3">
        <h1 className="mb-3">
          {isEdit
            ? <Translate id="react.shipmentWorkflow.editShipmentWorkflow.label" defaultMessage="Edit Shipment Workflow" />
            : <Translate id="react.shipmentWorkflow.createShipmentWorkflow.label" defaultMessage="Create Shipment Workflow" />}
        </h1>
        <form onSubmit={onSubmit} className="w-50">
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.shipmentWorkflow.column.name.label', defaultMessage: 'Name' }}
              name="name"
              value={values.name}
              onChange={(e) => setValue('name')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <SelectField
              title={{ id: 'react.shipmentWorkflow.column.shipmentType.label', defaultMessage: 'Shipment Type' }}
              name="shipmentType"
              options={options.shipmentTypes}
              defaultValue={values.shipmentType}
              onChange={setValue('shipmentType')}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.shipmentWorkflow.column.excludedFields.label', defaultMessage: 'Excluded Fields' }}
              name="excludedFields"
              value={values.excludedFields}
              onChange={(e) => setValue('excludedFields')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.shipmentWorkflow.column.documentTemplate.label', defaultMessage: 'Document Template' }}
              name="documentTemplate"
              value={values.documentTemplate}
              onChange={(e) => setValue('documentTemplate')(e.target.value)}
            />
          </div>
          {isEdit && (
            <>
              <div className="mb-3">
                <SelectField
                  title={{ id: 'react.shipmentWorkflow.referenceNumberTypes.label', defaultMessage: 'Reference Number Types' }}
                  name="referenceNumberTypes"
                  multiple
                  options={options.referenceNumberTypes}
                  defaultValue={values.referenceNumberTypes}
                  onChange={setValue('referenceNumberTypes')}
                />
              </div>
              <div className="mb-3">
                <SelectField
                  title={{ id: 'react.shipmentWorkflow.containerTypes.label', defaultMessage: 'Container Types' }}
                  name="containerTypes"
                  multiple
                  options={options.containerTypes}
                  defaultValue={values.containerTypes}
                  onChange={setValue('containerTypes')}
                />
              </div>
              <div className="mb-3">
                <SelectField
                  title={{ id: 'react.shipmentWorkflow.documentTemplates.label', defaultMessage: 'Document Templates' }}
                  name="documentTemplates"
                  multiple
                  options={options.documentTemplates}
                  defaultValue={values.documentTemplates}
                  onChange={setValue('documentTemplates')}
                />
              </div>
            </>
          )}
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
            <a href={SHIPMENT_WORKFLOW_URL.list()} className="ml-2">
              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
            </a>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default withRouter(ShipmentWorkflowForm);

ShipmentWorkflowForm.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      shipmentWorkflowId: PropTypes.string,
    }),
  }).isRequired,
};
