import React, { useEffect, useState } from 'react';

import { useHistory, useParams } from 'react-router-dom';

import productSupplierApi from 'api/services/ProductSupplierApi';
import Button from 'components/form-elements/Button';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { ORGANIZATION_URL, PRODUCT_SUPPLIER_URL, PRODUCT_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const ProductSupplierShow = () => {
  useTranslation('productSupplier', 'default');
  const { id } = useParams();
  const history = useHistory();
  const spinner = useSpinner();
  const [productSupplier, setProductSupplier] = useState(null);

  useEffect(() => {
    spinner.show();
    productSupplierApi.getProductSupplierDetails(id)
      .then((response) => setProductSupplier(response.data.data))
      .catch(() => history.push(PRODUCT_SUPPLIER_URL.list()))
      .finally(() => spinner.hide());
  }, [id]);

  const deleteProductSupplier = async (onClose) => {
    try {
      await productSupplierApi.deleteProductSupplier(id);
      notification(NotificationType.SUCCESS)({
        message: `Product Source ${id} deleted`,
      });
      history.push(PRODUCT_SUPPLIER_URL.list());
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
      onClick: () => deleteProductSupplier(onClose),
    },
  ]);

  const onDelete = () => confirmationModal({
    buttons: deleteConfirmationModalButtons,
    title: {
      label: 'react.default.areYouSure.label',
      default: 'Are you sure?',
    },
  });

  const rows = productSupplier ? [
    {
      key: 'id',
      label: translate({ id: 'react.productSupplier.show.id.label', defaultMessage: 'Id' }),
      value: productSupplier.id,
    },
    {
      key: 'product',
      label: translate({ id: 'react.productSupplier.show.product.label', defaultMessage: 'Product' }),
      value: productSupplier.product ? (
        <a href={PRODUCT_URL.show(productSupplier.product.id)}>
          {productSupplier.product.name}
        </a>
      ) : null,
    },
    {
      key: 'code',
      label: translate({ id: 'react.productSupplier.show.identifier.label', defaultMessage: 'Identifier' }),
      value: productSupplier.code,
    },
    {
      key: 'upc',
      label: translate({ id: 'react.productSupplier.show.upc.label', defaultMessage: 'Upc' }),
      value: productSupplier.upc,
    },
    {
      key: 'ndc',
      label: translate({ id: 'react.productSupplier.show.ndc.label', defaultMessage: 'Ndc' }),
      value: productSupplier.ndc,
    },
    {
      key: 'supplier',
      label: translate({ id: 'react.productSupplier.show.supplier.label', defaultMessage: 'Supplier' }),
      value: productSupplier.supplier ? (
        <a href={ORGANIZATION_URL.show(productSupplier.supplier.id)}>
          {productSupplier.supplier.name}
        </a>
      ) : null,
    },
    {
      key: 'supplierCode',
      label: translate({ id: 'react.productSupplier.show.supplierCode.label', defaultMessage: 'Supplier Code' }),
      value: productSupplier.supplierCode,
    },
    {
      key: 'supplierName',
      label: translate({ id: 'react.productSupplier.show.supplierName.label', defaultMessage: 'Supplier Name' }),
      value: productSupplier.supplierName,
    },
    {
      key: 'modelNumber',
      label: translate({ id: 'react.productSupplier.show.modelNumber.label', defaultMessage: 'Model Number' }),
      value: productSupplier.modelNumber,
    },
    {
      key: 'brandName',
      label: translate({ id: 'react.productSupplier.show.brandName.label', defaultMessage: 'Brand Name' }),
      value: productSupplier.brandName,
    },
    {
      key: 'manufacturer',
      label: translate({ id: 'react.productSupplier.show.manufacturer.label', defaultMessage: 'Manufacturer' }),
      value: productSupplier.manufacturer ? (
        <a href={ORGANIZATION_URL.show(productSupplier.manufacturer.id)}>
          {productSupplier.manufacturer.name}
        </a>
      ) : null,
    },
    {
      key: 'manufacturerCode',
      label: translate({ id: 'react.productSupplier.show.manufacturerCode.label', defaultMessage: 'Manufacturer Code' }),
      value: productSupplier.manufacturerCode,
    },
    {
      key: 'manufacturerName',
      label: translate({ id: 'react.productSupplier.show.manufacturerName.label', defaultMessage: 'Manufacturer Name' }),
      value: productSupplier.manufacturerName,
    },
    {
      key: 'standardLeadTimeDays',
      label: translate({ id: 'react.productSupplier.show.standardLeadTimeDays.label', defaultMessage: 'Standard Lead Time Days' }),
      value: productSupplier.standardLeadTimeDays,
    },
    {
      key: 'minOrderQuantity',
      label: translate({ id: 'react.productSupplier.show.minOrderQuantity.label', defaultMessage: 'Min Order Quantity' }),
      value: productSupplier.minOrderQuantity,
    },
    {
      key: 'ratingTypeCode',
      label: translate({ id: 'react.productSupplier.show.ratingTypeCode.label', defaultMessage: 'Rating Type Code' }),
      value: productSupplier.ratingTypeCode,
    },
    {
      key: 'comments',
      label: translate({ id: 'react.productSupplier.show.comments.label', defaultMessage: 'Comments' }),
      value: productSupplier.comments,
    },
  ] : [];

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.productSupplier.show.label',
          defaultMessage: 'Show ProductSupplier',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.productSupplier.listProductSources.label"
            defaultLabel="List Product Sources"
            variant="secondary"
            onClick={() => history.push(PRODUCT_SUPPLIER_URL.list())}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      {productSupplier && (
        <div className="p-3">
          <h2>{productSupplier.name}</h2>
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
              onClick={() => history.push(PRODUCT_SUPPLIER_URL.edit(id))}
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

export default ProductSupplierShow;
