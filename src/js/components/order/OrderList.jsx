import React from 'react';

import _ from 'lodash';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import filterFields from 'components/order/FilterFields';
import OrderListFilters from 'components/order/OrderListFilters';
import OrderListHeader from 'components/order/OrderListHeader';
import OrderListTable from 'components/order/OrderListTable';
import useOrderListFilters from 'hooks/list-pages/order/useOrderListFilters';
import useTranslation from 'hooks/useTranslation';

const OrderList = (props) => {
  const {
    defaultFilterValues,
    setFilterValues,
    filterParams,
    isCentralPurchasingEnabled,
    isPutawayList,
    statuses,
    orderTypes,
  } = useOrderListFilters();

  useTranslation('order', 'reactTable');

  const fields = isPutawayList
    ? _.omit(filterFields, ['destinationParty'])
    : filterFields;

  return (
    <div className="d-flex flex-column list-page-main">
      <OrderListHeader isPutawayList={isPutawayList} />
      <OrderListFilters
        defaultValues={defaultFilterValues}
        setFilterParams={setFilterValues}
        filterFields={fields}
        formProps={{
          statuses,
          orderTypes,
          buyers: props.buyers,
          isCentralPurchasingEnabled,
        }}
      />
      <OrderListTable filterParams={filterParams} isPutawayList={isPutawayList} />
    </div>
  );
};

const mapStateToProps = (state) => ({
  buyers: state.organizations.buyers,
});

export default connect(mapStateToProps)(OrderList);

OrderList.propTypes = {
  buyers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    value: PropTypes.string,
    label: PropTypes.string,
  })).isRequired,
};
