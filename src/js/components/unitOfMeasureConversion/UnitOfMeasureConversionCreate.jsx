import React, { useEffect, useState } from 'react';

import tagApi from 'api/services/UnitOfMeasureConversionApi';
import Button from 'components/form-elements/Button';
import Checkbox from 'components/form-elements/v2/Checkbox';
import SelectField from 'components/form-elements/v2/SelectField';
import TextInput from 'components/form-elements/v2/TextInput';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { UNIT_OF_MEASURE_CONVERSION_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const UnitOfMeasureConversionCreate = () => {
  useTranslation('unitOfMeasureConversion', 'default');

  const [values, setValues] = useState({
    fromUnitOfMeasure: null,
    toUnitOfMeasure: null,
    conversionRate: '',
    active: true,
  });
  const [unitOfMeasureOptions, setUnitOfMeasureOptions] = useState([]);

  useEffect(() => {
    tagApi.getUnitOfMeasureOptions()
      .then((response) => {
        setUnitOfMeasureOptions(response.data.data.map((option) => ({
          id: option.id,
          value: option.id,
          label: option.label,
        })));
      });
  }, []);

  const setValue = (field) => (value) => setValues((prev) => ({ ...prev, [field]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      await tagApi.createUnitOfMeasureConversion({
        fromUnitOfMeasureId: values.fromUnitOfMeasure?.id || null,
        toUnitOfMeasureId: values.toUnitOfMeasure?.id || null,
        conversionRate: values.conversionRate,
        active: values.active,
      });
      notification(NotificationType.SUCCESS)({
        message: 'Unit of measure conversion created',
      });
      window.location = UNIT_OF_MEASURE_CONVERSION_URL.list();
    } catch (error) {
      const errorMessage = error?.response?.data?.errorMessage;
      if (errorMessage) {
        notification(NotificationType.ERROR)({ message: errorMessage });
      }
    }
  };

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.unitOfMeasureConversion.createUnitOfMeasureConversion.label',
          defaultMessage: 'Create UnitOfMeasureConversion',
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
              label="react.default.button.create.label"
              defaultLabel="Create"
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

export default UnitOfMeasureConversionCreate;
