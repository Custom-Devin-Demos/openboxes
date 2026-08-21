import React, { useEffect, useState } from 'react';

import { useParams } from 'react-router-dom';

import mobileApi from 'api/services/MobileApi';
import notification from 'components/Layout/notifications/notification';
import MobileMenuBar from 'components/mobile/MobileMenuBar';
import { productImageUrl } from 'components/mobile/MobileProductList';
import { CONTEXT_PATH, MOBILE_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const MobileProductDetails = () => {
  useTranslation('mobile', 'default');
  const { id } = useParams();
  const spinner = useSpinner();
  const [productSummary, setProductSummary] = useState(null);

  useEffect(() => {
    spinner.show();
    mobileApi.getProductSummary(id)
      .then((response) => setProductSummary(response.data.data))
      .catch((error) => {
        const errorMessage = error?.response?.data?.errorMessage;
        if (errorMessage) {
          notification(NotificationType.ERROR)({ message: errorMessage });
        }
        window.location = MOBILE_URL.productList();
      })
      .finally(() => spinner.hide());
  }, [id]);

  if (!productSummary) {
    return null;
  }

  const { product, quantityOnHand, attributes } = productSummary;

  return (
    <PageWrapper>
      <MobileMenuBar />
      <div>
        <div className="row">
          <a href={MOBILE_URL.productList()} className="nav nav-link">
            <i className="fa fa-chevron-left" />
            {' '}
            <Translate id="react.default.button.back.label" defaultMessage="Back" />
          </a>
        </div>
        <div className="card">
          <div className="card-body">
            <h5 className="display-5">
              <small className="text-small">{product.productCode}</small>
              {' '}
              {product.name}
            </h5>
            <picture>
              <img src={productImageUrl(product)} alt={product.name} className="img-fluid" />
            </picture>
            <h3 className="display-3">
              <Translate id="react.mobile.description.label" defaultMessage="Description" />
            </h3>
            {product.description && <p>{product.description}</p>}
            <h3 className="display-3">
              <Translate id="react.mobile.details.label" defaultMessage="Details" />
            </h3>
            <ul className="list-group">
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <Translate id="react.mobile.status.label" defaultMessage="Status" />
                {quantityOnHand > 0 ? (
                  <div className="text-success">
                    <Translate id="react.mobile.inStock.label" defaultMessage="In Stock" />
                  </div>
                ) : (
                  <div className="text-danger">
                    <Translate id="react.mobile.outOfStock.label" defaultMessage="Out of Stock" />
                  </div>
                )}
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <div className="label">
                  <Translate id="react.mobile.qoh.label" defaultMessage="QoH" />
                </div>
                <span className="badge badge-primary badge-pill text-secondary">
                  {Math.round(quantityOnHand || 0)}
                  {' '}
                  {product.unitOfMeasure || 'EA'}
                </span>
              </li>
              {attributes?.map((attribute) => (
                <li
                  key={attribute.name}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  {attribute.name}
                  <span className="badge badge-primary badge-pill text-secondary">
                    {attribute.value || 0}
                    {' '}
                    {attribute.unitOfMeasure}
                  </span>
                </li>
              ))}
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <Translate id="react.mobile.barcode.label" defaultMessage="Barcode" />
                <div className="barcode">
                  <div className="barcode-image">
                    <img
                      src={`${CONTEXT_PATH}/product/barcode?data=${encodeURIComponent(product.productCode)}&format=CODE_128&height=20`}
                      alt={product.productCode}
                      className="top"
                    />
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default MobileProductDetails;
