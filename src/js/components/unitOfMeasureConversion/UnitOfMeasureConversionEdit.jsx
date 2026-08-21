import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import unitOfMeasureConversionApi from 'api/services/UnitOfMeasureConversionApi';
import Button from 'components/form-elements/Button';
import Checkbox from 'components/form-elements/v2/Checkbox';
import SelectField from 'components/form-elements/v2/SelectField';
import TextInput from 'components/form-elements/v2/TextInput';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { UNIT_OF_MEASURE_CONVERSION_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const toOption = (unitOfMeasure) => (unitOfMeasure ? {
  id: unitOfMeasure.id,
  value: unitOfMeasure.id,
  label: unitOfMeasure.name,
} : null);

const UnitOfMeasureConversionEdit = ({ match }) => {
  useTranslation('unitOfMeasureConversion', 'default');
  const { id } = match.params;

  const [values, setValues] = useState({
    fromUnitOfMeasure: null,
    toUnitOfMeasure: null,
    conversionRate: '',
    active: true,
  });
  const [unitOfMeasureOptions, setUnitOfMeasureOptions] = useState([]);

  useEffect(() => {
    unitOfMeasureConversionApi.getUnitOfMeasureOptions()
      .then((response) => {
        setUnitOfMeasureOptions(response.data.data.map((option) => ({
          id: option.id,
          value: option.id,
          label: option.label,
        })));
      });
  }, []);

  useEffect(() => {
    unitOfMeasureConversionApi.getUnitOfMeasureConversion(id)
      .then((response) => {
        const unitOfMeasureConversion = response.data.data;
        setValues({
          fromUnitOfMeasure: toOption(unitOfMeasureConversion.fromUnitOfMeasure),
          toUnitOfMeasure: toOption(unitOfMeasureConversion.toUnitOfMeasure),
          conversionRate: unitOfMeasureConversion.conversionRate != null
            ? `${unitOfMeasureConversion.conversionRate}` : '',
          active: Boolean(unitOfMeasureConversion.active),
        });
      })
      .catch(() => {
        window.location = UNIT_OF_MEASURE_CONVERSION_URL.list();
      });
  }, [id]);

  const setValue = (field) => (value) => setValues((prev) => ({ ...prev, [field]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      await unitOfMeasureConversionApi.updateUnitOfMeasureConversion(id, {
        fromUnitOfMeasureId: values.fromUnitOfMeasure?.id || null,
        toUnitOfMeasureId: values.toUnitOfMeasure?.id || null,
        conversionRate: values.conversionRate,
        active: values.active,
      });
      notification(NotificationType.SUCCESS)({
        message: 'Unit of measure conversion updated',
      });
      window.location = UNIT_OF_MEASURE_CONVERSION_URL.list();
    } catch (error) {
      const errorMessage = error?.response?.data?.errorMessage;
      if (errorMessage) {
        notification(NotificationType.ERROR)({ message: errorMessage });
      }
    }
  };

  const deleteUnitOfMeasureConversion = async (onClose) => {
    try {
      await unitOfMeasureConversionApi.deleteUnitOfMeasureConversion(id);
      notification(NotificationType.SUCCESS)({
        message: 'Unit of measure conversion deleted',
      });
      window.location = UNIT_OF_MEASURE_CONVERSION_URL.list();
    } catch (error) {
      const errorMessage = error?.response?.data?.errorMessage;
      if (errorMessage) {
        notification(NotificationType.ERROR)({ message: errorMessage });
      }
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
      onClick: () => deleteUnitOfMeasureConversion(onClose),
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
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.unitOfMeasureConversion.editUnitOfMeasureConversion.label',
          defaultMessage: 'Edit UnitOfMeasureConversion',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.unitOfMeasureConversion.listUnitOfMeasureConversions.label"
            defaultLabel="List unit of measure conversions"
            variant="secondary"
            onClick={() => {
              window.location = UNIT_OF_MEASURE_CONVERSION_URL.list();
            }}
          />
          <Button
            label="react.unitOfMeasureConversion.createUnitOfMeasureConversion.label"
            defaultLabel="Create UnitOfMeasureConversion"
            onClick={() => {
              window.location = UNIT_OF_MEASURE_CONVERSION_URL.create();
            }}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      <div className="d-flex flex-column m-3">
        <form onSubmit={onSubmit} className="w-50">
          <div className="mb-3">
            <SelectField
              title={{ id: 'react.unitOfMeasureConversion.fromUnitOfMeasure.label', defaultMessage: 'From Unit Of Measure' }}
              name="fromUnitOfMeasure"
              options={unitOfMeasureOptions}
              defaultValue={values.fromUnitOfMeasure}
              onChange={setValue('fromUnitOfMeasure')}
            />
          </div>
          <div className="mb-3">
            <SelectField
              title={{ id: 'react.unitOfMeasureConversion.toUnitOfMeasure.label', defaultMessage: 'To Unit Of Measure' }}
              name="toUnitOfMeasure"
              options={unitOfMeasureOptions}
              defaultValue={values.toUnitOfMeasure}
              onChange={setValue('toUnitOfMeasure')}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.unitOfMeasureConversion.conversionRate.label', defaultMessage: 'Conversion Rate' }}
              name="conversionRate"
              value={values.conversionRate}
              onChange={(e) => setValue('conversionRate')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <Checkbox
              title={{ id: 'react.unitOfMeasureConversion.active.label', defaultMessage: 'Active' }}
              name="active"
              value={values.active}
              onChange={(e) => setValue('active')(e.target.checked)}
            />
          </div>
          <div className="d-flex gap-8 align-items-center">
            <Button
              type="submit"
              label="react.default.button.update.label"
              defaultLabel="Update"
            />
            <Button
              type="button"
              variant="danger"
              label="react.default.button.delete.label"
              defaultLabel="Delete"
              onClick={onDelete}
            />
            <a href={UNIT_OF_MEASURE_CONVERSION_URL.list()} className="ml-2">
              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
            </a>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default withRouter(UnitOfMeasureConversionEdit);

UnitOfMeasureConversionEdit.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }),
  }).isRequired,
};
