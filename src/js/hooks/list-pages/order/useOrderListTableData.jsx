import { useState } from 'react';

import _ from 'lodash';
import { stringifyUrl } from 'query-string';
import { confirmAlert } from 'react-confirm-alert';
import { getTranslate } from 'react-localize-redux';
import { useSelector } from 'react-redux';
import Alert from 'react-s-alert';

import { ORDER_API } from 'api/urls';
import { ORDER_URL } from 'consts/applicationUrls';
import useTableData from 'hooks/list-pages/useTableData';
import { translateWithDefaultMessage } from 'utils/Translate';

const useOrderListTableData = (filterParams) => {
  const errorMessageId = 'react.order.error.orderList.label';
  const defaultErrorMessage = 'Unable to fetch orders';
  const [totalPrice, setTotalPrice] = useState(0);
  const getParams = ({
    offset,
    state,
  }) => {
    const {
      status, origin, orderedBy, createdBy, destinationParty, destination, searchTerm, orderType,
    } = filterParams;
    return {
      ..._.omitBy({
        offset: `${offset}`,
        max: `${state.pageSize}`,
        ..._.omit(filterParams, 'searchTerm'),
        q: searchTerm,
        orderType,
        status: status?.value,
        origin: origin?.id,
        orderedBy: orderedBy?.id,
        createdBy: createdBy?.id,
        destinationParty: destinationParty?.id,
      }, _.isEmpty),
      destination: destination?.id,
    };
  };

  const { translate, isUserApprover } = useSelector((state) => ({
    translate: translateWithDefaultMessage(getTranslate(state.localize)),
    isUserApprover: state.session.isUserApprover,
  }));

  const {
    tableRef,
    loading,
    onFetchHandler,
    tableData,
  } = useTableData({
    filterParams,
    url: ORDER_API,
    errorMessageId,
    defaultErrorMessage,
    defaultSorting: {},
    getParams,
    onFetchedData: (data) => setTotalPrice(data.totalPrice),
  });

  // Legacy CSV exports are still handled by OrderController.list
  const downloadOrders = (orderLineDetails) => {
    const params = _.omit(tableData.currentParams, 'offset', 'max');
    window.open(stringifyUrl({
      url: ORDER_URL.list(),
      query: {
        ...params,
        ...(orderLineDetails ? { format: 'csv' } : { downloadOrders: 'csv' }),
      },
    }), '_blank');
  };

  const deleteHandler = (id) => {
    const order = tableData.data.find((ord) => ord.id === id);
    if (order && order.status !== 'PENDING') {
      Alert.error(translate(
        'react.order.errors.delete.label',
        'An order can only be deleted from pending status',
      ));
      return;
    }
    confirmAlert({
      title: translate('react.default.areYouSure.label', 'Are you sure?'),
      message: translate(
        'react.order.delete.confirm.title.label',
        'Are you sure you want to delete this order?',
      ),
      buttons: [
        {
          label: translate('react.default.yes.label', 'Yes'),
          onClick: () => { window.location = ORDER_URL.remove(id); },
        },
        {
          label: translate('react.default.no.label', 'No'),
        },
      ],
    });
  };

  const rollbackHandler = (id) => {
    if (!isUserApprover) {
      Alert.error(translate(
        'react.default.errors.noPermissions.label',
        'You do not have permissions to perform this action',
      ));
      return;
    }
    const order = tableData.data.find((ord) => ord.id === id);
    if (order && order.shipmentsCount > 0) {
      Alert.error(translate(
        'react.order.rollback.error.label',
        'Cannot rollback order with associated shipments',
      ));
      return;
    }
    confirmAlert({
      title: translate('react.default.areYouSure.label', 'Are you sure?'),
      message: translate(
        'react.order.rollback.confirm.title.label',
        'Are you sure you want to rollback this order?',
      ),
      buttons: [
        {
          label: translate('react.default.yes.label', 'Yes'),
          onClick: () => { window.location = ORDER_URL.rollbackOrderStatus(id); },
        },
        {
          label: translate('react.default.no.label', 'No'),
        },
      ],
    });
  };

  const printOrder = (id) => {
    const order = tableData.data.find((ord) => ord.id === id);
    if (order && order.isBeforePlaced) {
      Alert.error(translate(
        'react.order.print.error.label',
        'Order must be placed in order to print.',
      ));
      return;
    }
    window.open(ORDER_URL.print(id), '_blank');
  };

  const cancelOrder = () => {
    Alert.error(translate('react.default.featureNotSupported', 'This feature is not currently supported'));
  };

  return {
    tableData: { ...tableData, totalPrice },
    loading,
    tableRef,
    printOrder,
    cancelOrder,
    rollbackHandler,
    deleteHandler,
    downloadOrders,
    onFetchHandler,
  };
};

export default useOrderListTableData;
