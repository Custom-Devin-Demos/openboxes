import React, { useEffect, useState } from 'react';

import { Controller, useForm } from 'react-hook-form';
import { useHistory, useParams } from 'react-router-dom';

import productAssociationApi from 'api/services/ProductAssociationApi';
import Button from 'components/form-elements/Button';
import Checkbox from 'components/form-elements/v2/Checkbox';
import SelectField from 'components/form-elements/v2/SelectField';
import TextInput from 'components/form-elements/v2/TextInput';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import ProductSelect from 'components/product-select/ProductSelect';
import { PRODUCT_ASSOCIATION_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const ProductAssociationForm = () => {
  useTranslation('productAssociation', 'default');
  const { id } = useParams();
  const history = useHistory();
  const spinner = useSpinner();
  const [version, setVersion] = useState(null);
  const [mutualAssociation, setMutualAssociation] = useState(false);
  const [typeCodeOptions, setTypeCodeOptions] = useState([]);

  const {
    control,
    handleSubmit,
    reset,
  } = useForm({
    defaultValues: {
      code: null,
      product: null,
      associatedProduct: null,
      quantity: '0',
      comments: '',
      hasMutualAssociation: false,
    },
  });

  useEffect(() => {
    productAssociationApi.getProductAssociationTypeCodeOptions()
      .then((response) => {
        setTypeCodeOptions(response.data?.data ?? []);
      });
  }, []);

  useEffect(() => {
    if (!id) {
      return;
    }
    spinner.show();
    productAssociationApi.getProductAssociation(id)
      .then((response) => {
        const productAssociation = response.data;
        setVersion(productAssociation.version);
        setMutualAssociation(Boolean(productAssociation.mutualAssociation));
        reset({
          code: productAssociation.code ?? null,
          product: productAssociation.product
            ? {
              ...productAssociation.product,
              label: `${productAssociation.product.productCode} - ${productAssociation.product.name}`,
            } : null,
          associatedProduct: productAssociation.associatedProduct
            ? {
              ...productAssociation.associatedProduct,
              label: `${productAssociation.associatedProduct.productCode} - ${productAssociation.associatedProduct.name}`,
            } : null,
          quantity: productAssociation.quantity != null ? `${productAssociation.quantity}` : '',
          comments: productAssociation.comments ?? '',
          hasMutualAssociation: Boolean(productAssociation.mutualAssociation),
        });
      })
      .catch(() => history.push(PRODUCT_ASSOCIATION_URL.list()))
      .finally(() => spinner.hide());
  }, [id]);

  const showErrors = (error) => {
    const errorMessages = error?.response?.data?.errorMessages;
    if (errorMessages?.length) {
      errorMessages.forEach((message) => {
        notification(NotificationType.ERROR_OUTLINED)({ message });
      });
    }
  };

  const onSubmit = async (values) => {
    const payload = {
      code: values.code,
      product: values.product ? { id: values.product.id } : null,
      associatedProduct: values.associatedProduct ? { id: values.associatedProduct.id } : null,
      quantity: values.quantity,
      comments: values.comments,
      hasMutualAssociation: Boolean(values.hasMutualAssociation),
      ...(id ? { version } : {}),
    };
    spinner.show();
    try {
      const response = id
        ? await productAssociationApi.updateProductAssociation(id, payload)
        : await productAssociationApi.createProductAssociation(payload);
      notification(NotificationType.SUCCESS)({
        message: response.data?.message,
      });
      window.location = PRODUCT_ASSOCIATION_URL.list();
    } catch (error) {
      showErrors(error);
    } finally {
      spinner.hide();
    }
  };

  const deleteProductAssociation = async (mutualDelete, onClose) => {
    try {
      await productAssociationApi.deleteProductAssociation(id, mutualDelete);
      notification(NotificationType.SUCCESS)({
        message: translate({
          id: 'react.productAssociation.deleted.label',
          defaultMessage: `Product Association ${id} deleted`,
          data: { id },
        }),
      });
      window.location = PRODUCT_ASSOCIATION_URL.list();
    } finally {
      onClose?.();
    }
  };

  const mutualDeleteModalButtons = (onClose) => ([
    {
      variant: 'transparent',
      defaultLabel: 'Cancel',
      label: 'react.default.button.cancel.label',
      onClick: onClose,
    },
    {
      variant: 'secondary',
      defaultLabel: 'No, delete only this one',
      label: 'react.productAssociation.deleteMutual.no.label',
      onClick: () => deleteProductAssociation(false, onClose),
    },
    {
      variant: 'danger',
      defaultLabel: 'Yes, delete both',
      label: 'react.productAssociation.deleteMutual.yes.label',
      onClick: () => deleteProductAssociation(true, onClose),
    },
  ]);

  const deleteConfirmationModalButtons = (onClose) => ([
    {
      variant: 'transparent',
      defaultLabel: 'Cancel',
      label: 'react.default.button.cancel.label',
      onClick: onClose,
    },
    {
      variant: 'danger',
      defaultLabel: 'Delete',
      label: 'react.default.button.delete.label',
      onClick: () => deleteProductAssociation(false, onClose),
    },
  ]);

  const openDeleteConfirmationModal = () => {
    if (mutualAssociation) {
      confirmationModal({
        buttons: mutualDeleteModalButtons,
        title: {
          label: 'react.productAssociation.deleteMutual.title.label',
          default: 'Delete mutual association?',
        },
        content: {
          label: 'react.productAssociation.deleteMutual.content.label',
          default: 'This association is two-way. Do you want to delete the association in the other direction as well?',
        },
      });
      return;
    }
    confirmationModal({
      buttons: deleteConfirmationModalButtons,
      title: {
        label: 'react.productAssociation.deleteConfirmation.title.label',
        default: 'Are you sure?',
      },
      content: {
        label: 'react.productAssociation.deleteConfirmation.content.label',
        default: 'Are you sure you want to delete this Product Association?',
      },
    });
  };

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={id
          ? { id: 'react.productAssociation.editProductAssociation.label', defaultMessage: 'Edit Product Association' }
          : { id: 'react.productAssociation.createProductAssociation.label', defaultMessage: 'Create Product Association' }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.productAssociation.listProductAssociations.label"
            defaultLabel="List Product Associations"
            variant="secondary"
            onClick={() => history.push(PRODUCT_ASSOCIATION_URL.list())}
          />
          <Button
            label="react.productAssociation.addProductAssociation.label"
            defaultLabel="Add Product Association"
            onClick={() => {
              window.location = PRODUCT_ASSOCIATION_URL.create();
            }}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      <form className="p-3 w-50" onSubmit={handleSubmit(onSubmit)}>
        <div className="pt-2">
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <SelectField
                title={{ id: 'react.productAssociation.type.label', defaultMessage: 'Type' }}
                options={typeCodeOptions}
                {...field}
                value={typeCodeOptions.find((option) => option.id === field.value) ?? null}
                onChange={(option) => field.onChange(option?.id ?? null)}
              />
            )}
          />
        </div>
        <div className="pt-2">
          <Controller
            name="product"
            control={control}
            render={({ field }) => (
              <div>
                <div className="font-weight-bold">
                  {translate({ id: 'react.productAssociation.column.product.label', defaultMessage: 'Product' })}
                </div>
                <ProductSelect {...field} />
              </div>
            )}
          />
        </div>
        <div className="pt-2">
          <Controller
            name="associatedProduct"
            control={control}
            render={({ field }) => (
              <div>
                <div className="font-weight-bold">
                  {translate({ id: 'react.productAssociation.column.associatedProduct.label', defaultMessage: 'Associated Product' })}
                </div>
                <ProductSelect {...field} />
              </div>
            )}
          />
        </div>
        <div className="pt-2">
          <Controller
            name="quantity"
            control={control}
            render={({ field }) => (
              <TextInput
                title={{ id: 'react.productAssociation.column.quantity.label', defaultMessage: 'Conversion' }}
                {...field}
              />
            )}
          />
        </div>
        <div className="pt-2">
          <Controller
            name="comments"
            control={control}
            render={({ field }) => (
              <TextInput
                title={{ id: 'react.productAssociation.column.comments.label', defaultMessage: 'Comments' }}
                {...field}
              />
            )}
          />
        </div>
        <div className="pt-2">
          <Controller
            name="hasMutualAssociation"
            control={control}
            render={({ field }) => (
              <Checkbox
                title={{ id: 'react.productAssociation.mutualAssociation.label', defaultMessage: 'Two-way association' }}
                {...field}
              />
            )}
          />
        </div>
        <div className="d-flex pt-3">
          <Button
            type="submit"
            label={id ? 'react.default.button.update.label' : 'react.default.button.create.label'}
            defaultLabel={id ? 'Update' : 'Create'}
          />
          {id && (
            <Button
              type="button"
              variant="danger"
              label="react.default.button.delete.label"
              defaultLabel="Delete"
              onClick={openDeleteConfirmationModal}
            />
          )}
          <Button
            type="button"
            variant="transparent"
            label="react.default.button.cancel.label"
            defaultLabel="Cancel"
            onClick={() => history.push(PRODUCT_ASSOCIATION_URL.list())}
          />
        </div>
      </form>
    </PageWrapper>
  );
};

export default ProductAssociationForm;
