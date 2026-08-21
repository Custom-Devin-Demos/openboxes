import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import orderAdjustmentTypeApi from 'api/services/OrderAdjustmentTypeApi';
import Button from 'components/form-elements/Button';
import SelectField from 'components/form-elements/v2/SelectField';
import TextInput from 'components/form-elements/v2/TextInput';
import notification from 'components/Layout/notifications/notification';
import { ORDER_ADJUSTMENT_TYPE_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const OrderAdjustmentTypeForm = ({ match }) => {
  useTranslation('orderAdjustmentType');
  const { orderAdjustmentTypeId } = match.params;
  const isEdit = Boolean(orderAdjustmentTypeId);

  const [values, setValues] = useState({
    name: '',
    description: '',
    code: null,
    glAccount: null,
  });
  const [codeOptions, setCodeOptions] = useState([]);
  const [glAccountOptions, setGlAccountOptions] = useState([]);
  const [isAccountingRequired, setIsAccountingRequired] = useState(false);

  useEffect(() => {
    orderAdjustmentTypeApi.getFormData()
      .then((response) => {
        const formData = response.data.data;
        setIsAccountingRequired(Boolean(formData.isAccountingRequired));
        setCodeOptions(formData.codeOptions);
        setGlAccountOptions(formData.glAccountOptions);
      });
  }, []);

  useEffect(() => {
    if (isEdit) {
      orderAdjustmentTypeApi.getOrderAdjustmentType(orderAdjustmentTypeId)
        .then((response) => {
          const orderAdjustmentType = response.data.data;
          setValues({
            name: orderAdjustmentType.name || '',
            description: orderAdjustmentType.description || '',
            code: orderAdjustmentType.code ? {
              id: orderAdjustmentType.code,
              value: orderAdjustmentType.code,
              label: orderAdjustmentType.code,
            } : null,
            glAccount: orderAdjustmentType.glAccount ? {
              id: orderAdjustmentType.glAccount.id,
              value: orderAdjustmentType.glAccount.id,
              label: `${orderAdjustmentType.glAccount.code} ${orderAdjustmentType.glAccount.description}`,
            } : null,
          });
        });
    }
  }, [orderAdjustmentTypeId]);

  const setValue = (field) => (value) => setValues((prev) => ({ ...prev, [field]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    if (isAccountingRequired && !values.glAccount?.id) {
      notification(NotificationType.ERROR)({
        message: 'GL Account is required',
      });
      return;
    }
    const payload = {
      name: values.name,
      description: values.description,
      code: values.code?.id || null,
      glAccount: values.glAccount?.id ? { id: values.glAccount.id } : null,
    };
    if (isEdit) {
      await orderAdjustmentTypeApi.updateOrderAdjustmentType(orderAdjustmentTypeId, payload);
      notification(NotificationType.SUCCESS)({
        message: `Order adjustment type ${orderAdjustmentTypeId} updated`,
      });
      window.location = ORDER_ADJUSTMENT_TYPE_URL.list();
    } else {
      const response = await orderAdjustmentTypeApi.createOrderAdjustmentType(payload);
      notification(NotificationType.SUCCESS)({
        message: `Order adjustment type ${response.data.data.id} created`,
      });
      window.location = ORDER_ADJUSTMENT_TYPE_URL.edit(response.data.data.id);
    }
  };

  const deleteOrderAdjustmentType = async (onClose) => {
    try {
      await orderAdjustmentTypeApi.deleteOrderAdjustmentType(orderAdjustmentTypeId);
      notification(NotificationType.SUCCESS)({
        message: `Order adjustment type ${orderAdjustmentTypeId} deleted`,
      });
      window.location = ORDER_ADJUSTMENT_TYPE_URL.list();
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
      onClick: () => deleteOrderAdjustmentType(onClose),
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
            ? <Translate id="react.orderAdjustmentType.editOrderAdjustmentType.label" defaultMessage="Edit Order Adjustment Type" />
            : <Translate id="react.orderAdjustmentType.createOrderAdjustmentType.label" defaultMessage="Add Order Adjustment Types" />}
        </h1>
        <form onSubmit={onSubmit} className="w-50">
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.orderAdjustmentType.name.label', defaultMessage: 'Name' }}
              name="name"
              value={values.name}
              onChange={(e) => setValue('name')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.orderAdjustmentType.description.label', defaultMessage: 'Description' }}
              name="description"
              value={values.description}
              onChange={(e) => setValue('description')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <SelectField
              title={{ id: 'react.orderAdjustmentType.code.label', defaultMessage: 'Order Adjustment Type Code' }}
              name="code"
              options={codeOptions}
              defaultValue={values.code}
              onChange={setValue('code')}
            />
          </div>
          <div className="mb-3">
            <SelectField
              title={{ id: 'react.orderAdjustmentType.glAccount.label', defaultMessage: 'GL Account' }}
              name="glAccount"
              options={glAccountOptions}
              defaultValue={values.glAccount}
              onChange={setValue('glAccount')}
              required={isAccountingRequired}
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
            <a href={ORDER_ADJUSTMENT_TYPE_URL.list()} className="ml-2">
              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
            </a>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default withRouter(OrderAdjustmentTypeForm);

OrderAdjustmentTypeForm.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      orderAdjustmentTypeId: PropTypes.string,
    }),
  }).isRequired,
};
