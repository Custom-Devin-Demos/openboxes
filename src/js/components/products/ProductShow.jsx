import React from 'react';

import useTranslation from 'hooks/useTranslation';
import PageWrapper from 'wrappers/PageWrapper';

/**
 * The legacy product/show screen was an AngularJS shell whose application
 * assets are no longer shipped, so it rendered an empty view container.
 * This screen preserves that behavior (an empty page under the main layout).
 */
const ProductShow = () => {
  useTranslation('default');

  return (
    <PageWrapper>
      <div className="view-container">
        <div className="view-frame" />
      </div>
    </PageWrapper>
  );
};

export default ProductShow;
