import React, { useEffect, useState } from 'react';

import { useHistory, useParams } from 'react-router-dom';

import productGroupApi from 'api/services/ProductGroupApi';
import Button from 'components/form-elements/Button';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { INVENTORY_ITEM_URL, PRODUCT_GROUP_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const ProductGroupShow = () => {
  useTranslation('productGroup', 'default');
  const { id } = useParams();
  const history = useHistory();
  const spinner = useSpinner();
  const [productGroup, setProductGroup] = useState(null);

  useEffect(() => {
    spinner.show();
    productGroupApi.getProductGroupDetails(id)
      .then((response) => setProductGroup(response.data.data))
      .catch(() => history.push(PRODUCT_GROUP_URL.list()))
      .finally(() => spinner.hide());
  }, [id]);

  const deleteProductGroup = async (onClose) => {
    try {
      await productGroupApi.deleteProductGroup(id);
      notification(NotificationType.SUCCESS)({
        message: `Product group ${id} deleted`,
      });
      history.push(PRODUCT_GROUP_URL.list());
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
      onClick: () => deleteProductGroup(onClose),
    },
  ]);

  const onDelete = () => confirmationModal({
    buttons: deleteConfirmationModalButtons,
    title: {
      label: 'react.default.areYouSure.label',
      default: 'Are you sure?',
    },
  });

  const rows = productGroup ? [
    {
      key: 'id',
      label: translate({ id: 'react.productGroup.column.id.label', defaultMessage: 'Id' }),
      value: productGroup.id,
    },
    {
      key: 'name',
      label: translate({ id: 'react.productGroup.name.label', defaultMessage: 'Name' }),
      value: productGroup.name,
    },
    {
      key: 'dateCreated',
      label: translate({ id: 'react.productGroup.column.dateCreated.label', defaultMessage: 'Date Created' }),
      value: productGroup.dateCreated,
    },
    {
      key: 'lastUpdated',
      label: translate({ id: 'react.productGroup.column.lastUpdated.label', defaultMessage: 'Last Updated' }),
      value: productGroup.lastUpdated,
    },
  ] : [];

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.productGroup.showProductGroup.label',
          defaultMessage: 'Show Product Group',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.productGroup.listProductGroups.label"
            defaultLabel="List Product Groups"
            variant="secondary"
            onClick={() => history.push(PRODUCT_GROUP_URL.list())}
          />
          <Button
            label="react.productGroup.addProductGroup.label"
            defaultLabel="Add Product Group"
            onClick={() => {
              window.location = PRODUCT_GROUP_URL.create();
            }}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      {productGroup && (
        <div className="p-3">
          <h2>{productGroup.name}</h2>
          <table className="table table-sm w-50">
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td className="font-weight-bold">{row.label}</td>
                  <td>{row.value}</td>
                </tr>
              ))}
              <tr>
                <td className="font-weight-bold">
                  {translate({ id: 'react.productGroup.products.label', defaultMessage: 'Products' })}
                </td>
                <td>
                  <ul className="list-unstyled mb-0">
                    {(productGroup.products || []).map((product) => (
                      <li key={product.id}>
                        <a href={INVENTORY_ITEM_URL.showStockCard(product.id)}>
                          {product.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="d-flex">
            <Button
              label="react.default.button.edit.label"
              defaultLabel="Edit"
              onClick={() => history.push(PRODUCT_GROUP_URL.edit(id))}
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

export default ProductGroupShow;
