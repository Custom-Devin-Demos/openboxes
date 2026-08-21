import React, { useEffect, useState } from 'react';

import mobileApi from 'api/services/MobileApi';
import notification from 'components/Layout/notifications/notification';
import MobileMenuBar from 'components/mobile/MobileMenuBar';
import MobilePagination from 'components/mobile/MobilePagination';
import { CONTEXT_PATH, MOBILE_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import PageWrapper from 'wrappers/PageWrapper';

const PAGE_SIZE = 10;

export const productImageUrl = (product) => (product.thumbnailId
  ? `${CONTEXT_PATH}/product/renderImage/${product.thumbnailId}`
  : `${CONTEXT_PATH}/images/default-product.png`);

const MobileProductList = () => {
  useTranslation('mobile', 'default');
  const spinner = useSpinner();
  const [offset, setOffset] = useState(0);
  const [productSummaries, setProductSummaries] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    spinner.show();
    mobileApi.getProductSummaries({ max: PAGE_SIZE, offset })
      .then((response) => {
        setProductSummaries(response.data.data);
        setTotalCount(response.data.totalCount);
      })
      .catch(() => {
        notification(NotificationType.ERROR)({
          message: 'Unable to fetch products',
        });
      })
      .finally(() => spinner.hide());
  }, [offset]);

  return (
    <PageWrapper>
      <MobileMenuBar />
      <div className="row g-0">
        <table className="table table-borderless">
          <tbody>
            {productSummaries.map(({ product, quantityOnHand }) => (
              <tr className="border-bottom" key={product.id}>
                <td className="col-2">
                  <picture>
                    <a href={MOBILE_URL.productDetails(product.id)} className="text-decoration-none">
                      <img src={productImageUrl(product)} alt={product.name} className="img-fluid" width="64" />
                    </a>
                  </picture>
                </td>
                <td className="col-8">
                  <a href={MOBILE_URL.productDetails(product.id)} className="text-decoration-none text-reset">
                    <h5>
                      {product.productCode}
                      {' '}
                      {product.name}
                    </h5>
                  </a>
                  {product.handlingIcons?.map((handlingIcon) => (
                    <i
                      key={handlingIcon.icon}
                      className={`fa ${handlingIcon.icon}`}
                      style={{ color: handlingIcon.color || 'inherit' }}
                      title={handlingIcon.label}
                    />
                  ))}
                  {product.description && (
                    <div className="d-flex align-items-center justify-content-between mt-1">
                      {product.description}
                    </div>
                  )}
                </td>
                <td>
                  <a href={MOBILE_URL.productDetails(product.id)} className="text-decoration-none text-reset">
                    {Math.round(quantityOnHand)}
                    {' '}
                    <small>{product.unitOfMeasure || 'EA'}</small>
                  </a>
                </td>
                <td>
                  <a href={MOBILE_URL.productDetails(product.id)} className="btn btn-link">
                    <i className="fa fa-chevron-right" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <MobilePagination
          offset={offset}
          max={PAGE_SIZE}
          totalCount={totalCount}
          onPageChange={setOffset}
        />
      </div>
    </PageWrapper>
  );
};

export default MobileProductList;
