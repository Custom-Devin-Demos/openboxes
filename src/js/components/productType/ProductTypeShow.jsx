import React, { useEffect, useState } from 'react';

import { useParams } from 'react-router-dom';

import productTypeApi from 'api/services/ProductTypeApi';
import Button from 'components/form-elements/Button';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { PRODUCT_TYPE_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import translate from 'utils/Translate';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const ProductTypeShow = () => {
  useTranslation('productType', 'default');
  const { id } = useParams();
  const spinner = useSpinner();
  const [productType, setProductType] = useState(null);

  useEffect(() => {
    spinner.show();
    productTypeApi.getProductType(id)
      .then((response) => setProductType(response.data.data))
      .catch(() => {
        window.location = PRODUCT_TYPE_URL.list();
      })
      .finally(() => spinner.hide());
  }, [id]);

  const deleteProductType = async (onClose) => {
    try {
      await productTypeApi.deleteProductType(id);
      notification(NotificationType.SUCCESS)({
        message: `Product type ${id} deleted`,
      });
      window.location = PRODUCT_TYPE_URL.list();
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

  const rows = productType ? [
    {
      key: 'id',
      label: translate({ id: 'react.productType.id.label', defaultMessage: 'Id' }),
      value: productType.id,
    },
    {
      key: 'name',
      label: translate({ id: 'react.productType.name.label', defaultMessage: 'Name' }),
      value: productType.name,
    },
    {
      key: 'productTypeCode',
      label: translate({ id: 'react.productType.productTypeCode.label', defaultMessage: 'Product Type Code' }),
      value: productType.productTypeCode,
    },
    {
      key: 'productIdentifierFormat',
      label: translate({ id: 'react.productType.productIdentifierFormat.label', defaultMessage: 'Product Identifier Format' }),
      value: productType.productIdentifierFormat,
    },
    {
      key: 'supportedActivities',
      label: translate({ id: 'react.productType.supportedActivities.label', defaultMessage: 'Supported Activities' }),
      value: productType.supportedActivities?.join(', '),
    },
    {
      key: 'requiredFields',
      label: translate({ id: 'react.productType.requiredFields.label', defaultMessage: 'Required Fields' }),
      value: productType.requiredFields?.join(', '),
    },
    {
      key: 'displayedFields',
      label: translate({ id: 'react.productType.displayedFields.label', defaultMessage: 'Displayed Fields' }),
      value: productType.displayedFields?.join(', '),
    },
    {
      key: 'dateCreated',
      label: translate({ id: 'react.productType.dateCreated.label', defaultMessage: 'Date Created' }),
      value: productType.dateCreated,
    },
    {
      key: 'lastUpdated',
      label: translate({ id: 'react.productType.lastUpdated.label', defaultMessage: 'Last Updated' }),
      value: productType.lastUpdated,
    },
  ] : [];

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.productType.showProductType.label',
          defaultMessage: 'Show ProductType',
        }}
        />
      </HeaderWrapper>
      {productType && (
        <div className="p-3">
          <h2>{productType.name}</h2>
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
          <div className="d-flex gap-8">
            <Button
              label="react.default.button.edit.label"
              defaultLabel="Edit"
              onClick={() => {
                window.location = PRODUCT_TYPE_URL.edit(id);
              }}
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

export default ProductTypeShow;
