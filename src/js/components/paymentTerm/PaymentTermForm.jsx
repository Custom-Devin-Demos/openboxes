import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import paymentTermApi from 'api/services/PaymentTermApi';
import Button from 'components/form-elements/Button';
import TextInput from 'components/form-elements/v2/TextInput';
import notification from 'components/Layout/notifications/notification';
import { PAYMENT_TERM_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const PaymentTermForm = ({ match }) => {
  useTranslation('paymentTerm');
  const { paymentTermId } = match.params;
  const isEdit = Boolean(paymentTermId);

  const [values, setValues] = useState({
    code: '',
    name: '',
    description: '',
    prepaymentPercent: '',
    daysToPayment: '',
  });

  useEffect(() => {
    if (isEdit) {
      paymentTermApi.getPaymentTerm(paymentTermId)
        .then((response) => {
          const paymentTerm = response.data.data;
          setValues({
            code: paymentTerm.code || '',
            name: paymentTerm.name || '',
            description: paymentTerm.description || '',
            prepaymentPercent: paymentTerm.prepaymentPercent != null ? `${paymentTerm.prepaymentPercent}` : '',
            daysToPayment: paymentTerm.daysToPayment != null ? `${paymentTerm.daysToPayment}` : '',
          });
        });
    }
  }, [paymentTermId]);

  const setValue = (field) => (value) => setValues((prev) => ({ ...prev, [field]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      code: values.code,
      name: values.name,
      description: values.description,
      prepaymentPercent: values.prepaymentPercent || null,
      daysToPayment: values.daysToPayment || null,
    };
    if (isEdit) {
      await paymentTermApi.updatePaymentTerm(paymentTermId, payload);
      notification(NotificationType.SUCCESS)({
        message: `Payment term ${paymentTermId} updated`,
      });
      window.location = PAYMENT_TERM_URL.list();
    } else {
      const response = await paymentTermApi.createPaymentTerm(payload);
      notification(NotificationType.SUCCESS)({
        message: `Payment term ${response.data.data.id} created`,
      });
      window.location = PAYMENT_TERM_URL.edit(response.data.data.id);
    }
  };

  const deletePaymentTerm = async (onClose) => {
    try {
      await paymentTermApi.deletePaymentTerm(paymentTermId);
      notification(NotificationType.SUCCESS)({
        message: `Payment term ${paymentTermId} deleted`,
      });
      window.location = PAYMENT_TERM_URL.list();
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
      onClick: () => deletePaymentTerm(onClose),
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
            ? <Translate id="react.paymentTerm.editPaymentTerm.label" defaultMessage="Edit Payment Terms" />
            : <Translate id="react.paymentTerm.createPaymentTerm.label" defaultMessage="Create Payment Terms" />}
        </h1>
        <form onSubmit={onSubmit} className="w-50">
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.paymentTerm.code.label', defaultMessage: 'Code' }}
              name="code"
              value={values.code}
              onChange={(e) => setValue('code')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.paymentTerm.name.label', defaultMessage: 'Name' }}
              name="name"
              value={values.name}
              onChange={(e) => setValue('name')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.paymentTerm.description.label', defaultMessage: 'Description' }}
              name="description"
              value={values.description}
              onChange={(e) => setValue('description')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.paymentTerm.prepaymentPercent.label', defaultMessage: 'Prepayment percent' }}
              name="prepaymentPercent"
              placeholder="e.g. 50"
              value={values.prepaymentPercent}
              onChange={(e) => setValue('prepaymentPercent')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.paymentTerm.daysToPayment.label', defaultMessage: 'Days payment due after invoice' }}
              name="daysToPayment"
              placeholder="e.g. 30"
              value={values.daysToPayment}
              onChange={(e) => setValue('daysToPayment')(e.target.value)}
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
            <a href={PAYMENT_TERM_URL.list()} className="ml-2">
              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
            </a>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default withRouter(PaymentTermForm);

PaymentTermForm.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      paymentTermId: PropTypes.string,
    }),
  }).isRequired,
};
