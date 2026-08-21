import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import productTypeApi from 'api/services/ProductTypeApi';
import Button from 'components/form-elements/Button';
import SelectField from 'components/form-elements/v2/SelectField';
import TextInput from 'components/form-elements/v2/TextInput';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { PRODUCT_TYPE_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const toOptions = (values, options) => (values || []).map((value) => {
  const option = options.find((it) => it.id === value);
  return option || { id: value, value, label: value };
});

const ProductTypeForm = ({ match }) => {
  useTranslation('productType', 'default');
  const { id } = match.params;
  const isEdit = Boolean(id);

  const [values, setValues] = useState({
    name: '',
    code: '',
    productTypeCode: 'GOOD',
    productIdentifierFormat: '',
    sequenceNumber: 0,
    supportedActivities: [],
    requiredFields: ['PRODUCT_CODE', 'NAME', 'CATEGORY', 'GL_ACCOUNT'],
    displayedFields: [],
    productCount: 0,
    version: null,
  });
  const [activityOptions, setActivityOptions] = useState([]);
  const [fieldOptions, setFieldOptions] = useState([]);

  useEffect(() => {
    productTypeApi.getProductActivityCodeOptions()
      .then((response) => {
        setActivityOptions(response.data.data.map((option) => ({
          id: option.id,
          value: option.id,
          label: option.label,
        })));
      });
    productTypeApi.getProductFieldOptions()
      .then((response) => {
        setFieldOptions(response.data.data.map((option) => ({
          id: option.id,
          value: option.id,
          label: option.label,
        })));
      });
  }, []);

  useEffect(() => {
    if (isEdit) {
      productTypeApi.getProductType(id)
        .then((response) => {
          const productType = response.data.data;
          setValues({
            name: productType.name || '',
            code: productType.code || '',
            productTypeCode: productType.productTypeCode || 'GOOD',
            productIdentifierFormat: productType.productIdentifierFormat || '',
            sequenceNumber: productType.sequenceNumber != null ? productType.sequenceNumber : 0,
            supportedActivities: productType.supportedActivities || [],
            requiredFields: productType.requiredFields || [],
            displayedFields: productType.displayedFields || [],
            productCount: productType.productCount || 0,
            version: productType.version,
          });
        })
        .catch(() => {
          window.location = PRODUCT_TYPE_URL.list();
        });
    }
  }, [id]);

  const setValue = (field) => (value) => setValues((prev) => ({ ...prev, [field]: value }));

  const setMultiValue = (field) => (selected) => setValues((prev) => ({
    ...prev,
    [field]: (selected || []).map((option) => option.id),
  }));

  const onSubmit = async (event) => {
    event.preventDefault();
    if (isEdit) {
      await productTypeApi.updateProductType(id, {
        name: values.name,
        sequenceNumber: values.sequenceNumber,
        supportedActivities: values.supportedActivities,
        displayedFields: values.displayedFields,
        version: values.version,
      });
      notification(NotificationType.SUCCESS)({
        message: `Product type ${values.name} updated`,
      });
    } else {
      const response = await productTypeApi.createProductType({
        name: values.name,
        code: values.code,
        productIdentifierFormat: values.productIdentifierFormat,
        sequenceNumber: values.sequenceNumber,
        supportedActivities: values.supportedActivities,
        displayedFields: values.displayedFields,
      });
      notification(NotificationType.SUCCESS)({
        message: `Product type ${response.data.data.name} created`,
      });
    }
    window.location = PRODUCT_TYPE_URL.list();
  };

  const deleteProductType = async (onClose) => {
    try {
      await productTypeApi.deleteProductType(id);
      notification(NotificationType.SUCCESS)({
        message: `Product type ${values.name} deleted`,
      });
      window.location = PRODUCT_TYPE_URL.list();
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
      onClick: () => deleteProductType(onClose),
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
        <ListTitle label={isEdit
          ? { id: 'react.productType.editProductType.label', defaultMessage: 'Edit ProductType' }
          : { id: 'react.productType.createProductType.label', defaultMessage: 'Create ProductType' }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.productType.listProductTypes.label"
            defaultLabel="List product types"
            variant="secondary"
            onClick={() => {
              window.location = PRODUCT_TYPE_URL.list();
            }}
          />
          <Button
            label="react.productType.addProductType.label"
            defaultLabel="Add product type"
            onClick={() => {
              window.location = PRODUCT_TYPE_URL.create();
            }}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      <div className="d-flex flex-column m-3">
        <form onSubmit={onSubmit} className="w-50">
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.productType.name.label', defaultMessage: 'Name' }}
              name="name"
              value={values.name}
              onChange={(e) => setValue('name')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.productType.productTypeCode.label', defaultMessage: 'Product Type Code' }}
              name="productTypeCode"
              value={values.productTypeCode}
              disabled
            />
          </div>
          {(!isEdit || values.productCount === 0) && (
            <div className="mb-3">
              <TextInput
                title={{ id: 'react.productType.productIdentifierFormat.label', defaultMessage: 'Product Identifier Format' }}
                name="productIdentifierFormat"
                value={values.productIdentifierFormat}
                disabled={isEdit}
                onChange={(e) => setValue('productIdentifierFormat')(e.target.value)}
              />
            </div>
          )}
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.productType.sequenceNumber.label', defaultMessage: 'Sequence Number' }}
              name="sequenceNumber"
              type="number"
              value={values.sequenceNumber}
              onChange={(e) => setValue('sequenceNumber')(e.target.value)}
            />
          </div>
          {!isEdit && (
            <div className="mb-3">
              <TextInput
                title={{ id: 'react.productType.code.label', defaultMessage: 'Code' }}
                name="code"
                value={values.code}
                onChange={(e) => setValue('code')(e.target.value)}
              />
            </div>
          )}
          <div className="mb-3">
            <SelectField
              title={{ id: 'react.productType.supportedActivities.label', defaultMessage: 'Supported Activities' }}
              name="supportedActivities"
              multiple
              options={activityOptions}
              defaultValue={toOptions(values.supportedActivities, activityOptions)}
              onChange={setMultiValue('supportedActivities')}
            />
          </div>
          <div className="mb-3">
            <SelectField
              title={{ id: 'react.productType.requiredFields.label', defaultMessage: 'Required Fields' }}
              name="requiredFields"
              multiple
              disabled
              options={fieldOptions}
              defaultValue={toOptions(values.requiredFields, fieldOptions)}
            />
          </div>
          <div className="mb-3">
            <SelectField
              title={{ id: 'react.productType.displayedFields.label', defaultMessage: 'Displayed Fields' }}
              name="displayedFields"
              multiple
              options={fieldOptions}
              defaultValue={toOptions(values.displayedFields, fieldOptions)}
              onChange={setMultiValue('displayedFields')}
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
            <a href={PRODUCT_TYPE_URL.list()} className="ml-2">
              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
            </a>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default withRouter(ProductTypeForm);

ProductTypeForm.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }),
  }).isRequired,
};
