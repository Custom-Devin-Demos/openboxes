import React, { useMemo } from 'react';

import PropTypes from 'prop-types';
import {
  RiArrowGoBackLine,
  RiChat3Line,
  RiCloseLine,
  RiDeleteBinLine,
  RiDownload2Line,
  RiFileLine,
  RiFilePdfLine,
  RiInformationLine,
  RiListUnordered,
  RiPencilLine,
  RiPrinterLine,
  RiShoppingCartLine,
} from 'react-icons/ri';
import { getTranslate } from 'react-localize-redux';
import { connect } from 'react-redux';

import DataTable, { TableCell } from 'components/DataTable';
import DateCell from 'components/DataTable/DateCell';
import Button from 'components/form-elements/Button';
import { ORDER_URL, PURCHASE_ORDER_URL, PUTAWAY_URL } from 'consts/applicationUrls';
import useOrderListTableData from 'hooks/list-pages/order/useOrderListTableData';
import ContextMenu from 'utils/ContextMenu';
import { findActions } from 'utils/list-utils';
import Translate, { translateWithDefaultMessage } from 'utils/Translate';

import 'react-confirm-alert/src/react-confirm-alert.css';

const OrderListTable = ({
  supportedActivities,
  highestRole,
  translate,
  currencyCode,
  locale,
  filterParams,
  isPutawayList,
}) => {
  const {
    tableData,
    loading,
    tableRef,
    printOrder,
    cancelOrder,
    rollbackHandler,
    deleteHandler,
    downloadOrders,
    onFetchHandler,
  } = useOrderListTableData(filterParams);

  // List of actions, mirroring grails-app/views/order/_actions.gsp
  const actions = useMemo(() => {
    if (isPutawayList) {
      return [
        {
          label: 'react.order.viewOrderDetails.label',
          defaultLabel: 'View order details',
          leftIcon: <RiInformationLine />,
          href: ORDER_URL.show,
        },
        {
          label: 'react.order.addComment.label',
          defaultLabel: 'Add comment',
          leftIcon: <RiChat3Line />,
          href: ORDER_URL.addComment,
        },
        {
          label: 'react.order.addDocument.label',
          defaultLabel: 'Add document',
          leftIcon: <RiFileLine />,
          href: ORDER_URL.addDocument,
        },
        {
          label: 'react.order.generatePutawayList.label',
          defaultLabel: 'Generate Putaway List',
          leftIcon: <RiFilePdfLine />,
          onClick: (id) => window.open(PUTAWAY_URL.generatePdf(id), '_blank'),
        },
        {
          label: 'react.order.delete.label',
          defaultLabel: 'Delete',
          leftIcon: <RiDeleteBinLine />,
          minimumRequiredRole: 'Assistant',
          variant: 'danger',
          statuses: ['PENDING', 'PLACED', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELED', 'REJECTED'],
          onClick: (id) => deleteHandler(id),
        },
      ];
    }
    return [
      {
        label: 'react.order.viewOrderDetails.label',
        defaultLabel: 'View order details',
        leftIcon: <RiInformationLine />,
        href: ORDER_URL.show,
      },
      {
        label: 'react.order.addComment.label',
        defaultLabel: 'Add comment',
        leftIcon: <RiChat3Line />,
        activityCode: ['PLACE_ORDER'],
        href: ORDER_URL.addComment,
      },
      {
        label: 'react.order.addDocument.label',
        defaultLabel: 'Add document',
        leftIcon: <RiFileLine />,
        activityCode: ['PLACE_ORDER'],
        href: ORDER_URL.addDocument,
      },
      {
        label: 'react.order.edit.label',
        defaultLabel: 'Edit order',
        leftIcon: <RiPencilLine />,
        statuses: ['PENDING'],
        activityCode: ['PLACE_ORDER'],
        href: PURCHASE_ORDER_URL.edit,
      },
      {
        label: 'react.order.editLineItems.label',
        defaultLabel: 'Edit line items',
        leftIcon: <RiListUnordered />,
        statuses: ['PENDING'],
        activityCode: ['PLACE_ORDER'],
        href: PURCHASE_ORDER_URL.addItems,
      },
      {
        label: 'react.order.placeOrder.label',
        defaultLabel: 'Place order',
        leftIcon: <RiShoppingCartLine />,
        statuses: ['PENDING'],
        activityCode: ['PLACE_ORDER'],
        href: ORDER_URL.placeOrder,
      },
      {
        label: 'react.order.printOrder.label',
        defaultLabel: 'Print order',
        leftIcon: <RiPrinterLine />,
        activityCode: ['PLACE_ORDER'],
        onClick: (id) => printOrder(id),
      },
      {
        label: 'react.order.cancelOrder.label',
        defaultLabel: 'Cancel order',
        leftIcon: <RiCloseLine />,
        activityCode: ['PLACE_ORDER'],
        statuses: ['PLACED'],
        onClick: () => cancelOrder(),
      },
      {
        label: 'react.order.rollbackOrder.label',
        defaultLabel: 'Rollback order status',
        leftIcon: <RiArrowGoBackLine />,
        minimumRequiredRole: 'Superuser',
        activityCode: ['PLACE_ORDER'],
        statuses: ['PLACED'],
        onClick: (id) => rollbackHandler(id),
      },
      {
        label: 'react.order.delete.label',
        defaultLabel: 'Delete',
        leftIcon: <RiDeleteBinLine />,
        minimumRequiredRole: 'Assistant',
        activityCode: ['PLACE_ORDER'],
        variant: 'danger',
        onClick: (id) => deleteHandler(id),
      },
    ];
  }, [isPutawayList]);

  // Columns for react-table
  const columns = useMemo(() => [
    {
      Header: ' ',
      width: 50,
      fixed: 'left',
      sortable: false,
      style: {
        overflow: 'visible',
        zIndex: 1,
      },
      Cell: (row) => (
        <ContextMenu
          positions={['right']}
          dropdownClasses="action-dropdown-offset"
          actions={findActions(actions, row, {
            supportedActivities,
            highestRole,
          })}
          id={row.original.id}
        />
      ),
    },
    {
      Header: <Translate id="react.order.column.status.label" defaultMessage="Status" />,
      accessor: 'derivedStatus',
      fixed: 'left',
      width: 160,
      sortable: false,
      Cell: (row) => (
        <TableCell {...row}>
          <div className="tag" data-testid="status">{row.original.derivedStatus}</div>
        </TableCell>
      ),
    },
    {
      Header: <Translate id="react.order.column.type.label" defaultMessage="Type" />,
      accessor: 'orderTypeName',
      fixed: 'left',
      width: 130,
      sortable: false,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.order.column.orderNumber.label" defaultMessage="Order Number" />,
      accessor: 'orderNumber',
      fixed: 'left',
      width: 150,
      sortable: false,
      Cell: (row) => (
        <TableCell
          {...row}
          link={ORDER_URL.show(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.order.column.name.label" defaultMessage="Name" />,
      accessor: 'name',
      fixed: 'left',
      minWidth: 250,
      sortable: false,
      Cell: (row) => (
        <TableCell
          {...row}
          tooltip
          link={ORDER_URL.show(row.original.id)}
        />
      ),
    },
    ...(!isPutawayList ? [
      {
        Header: <Translate id="react.order.column.origin.label" defaultMessage="Origin" />,
        accessor: 'origin',
        minWidth: 250,
        sortable: false,
        Cell: (row) => <TableCell {...row} tooltip />,
      },
      {
        Header: <Translate id="react.order.column.destination.label" defaultMessage="Destination" />,
        accessor: 'destination',
        minWidth: 250,
        sortable: false,
        Cell: (row) => <TableCell {...row} tooltip />,
      },
    ] : []),
    {
      Header: <Translate id="react.order.column.orderedBy.label" defaultMessage="Ordered By" />,
      accessor: 'orderedBy',
      headerClassName: 'text-left',
      minWidth: 150,
      sortable: false,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.order.column.dateOrdered.label" defaultMessage="Date Ordered" />,
      accessor: 'dateOrdered',
      minWidth: 120,
      sortable: false,
      Cell: (row) => <DateCell {...row} />,
    },
    {
      Header: <Translate id="react.order.column.lineItems.label" defaultMessage="Order Items" />,
      accessor: 'orderItemsCount',
      className: 'text-right',
      headerClassName: 'justify-content-end',
      sortable: false,
    },
    ...(!isPutawayList ? [
      {
        Header: <Translate id="react.order.column.ordered.label" defaultMessage="Ordered" />,
        accessor: 'orderedOrderItemsCount',
        className: 'text-right',
        headerClassName: 'justify-content-end',
        sortable: false,
      },
      {
        Header: <Translate id="react.order.column.shipped.label" defaultMessage="Shipped" />,
        accessor: 'shippedItemsCount',
        className: 'text-right',
        headerClassName: 'justify-content-end',
        sortable: false,
      },
      {
        Header: <Translate id="react.order.column.received.label" defaultMessage="Received" />,
        accessor: 'receivedItemsCount',
        className: 'text-right',
        headerClassName: 'justify-content-end',
        sortable: false,
      },
    ] : []),
    {
      Header: <Translate
        id="react.order.column.totalAmountLocalCurrency.label"
        defaultMessage="Total amount (local currency)"
      />,
      accessor: 'total',
      className: 'text-right',
      headerClassName: 'justify-content-end',
      sortable: false,
      minWidth: 230,
    },
    {
      Header: <Translate
        id="react.order.column.totalAmountDefaultCurrency.label"
        defaultMessage="Total amount (default currency)"
      />,
      accessor: 'totalNormalized',
      className: 'text-right',
      headerClassName: 'justify-content-end',
      sortable: false,
      minWidth: 260,
    },
  ], [supportedActivities, highestRole, actions, isPutawayList]);

  const totalAmount = () => `${translate('react.order.totalAmount.label', 'Total amount')}: ${tableData.totalPrice.toLocaleString([locale, 'en'])} ${currencyCode}`;

  return (
    <div className="list-page-list-section">
      <div className="title-text p-3 d-flex justify-content-between align-items-center">
        <span>
          {isPutawayList
            ? <Translate id="react.order.listPutaways.label" defaultMessage="List Putaways" />
            : <Translate id="react.order.listOrders.label" defaultMessage="List Purchase orders" />}
          &nbsp;
          (
          {totalAmount()}
          )
        </span>
        <div className="btn-group">
          <Button
            isDropdown
            defaultLabel="Export"
            label="react.default.button.export.label"
            variant="secondary"
            EndIcon={<RiDownload2Line />}
          />
          <div
            className="dropdown-menu dropdown-menu-right nav-item padding-8"
            aria-labelledby="dropdownMenuButton"
          >
            <a
              href="#"
              className="dropdown-item"
              onClick={() => downloadOrders(true)}
              role="button"
              tabIndex={0}
              data-testid="download-order-line-details-button"
            >
              <Translate
                id="react.order.export.orderLineDetails.label"
                defaultMessage="Export order line details"
              />
            </a>
            <a
              className="dropdown-item"
              onClick={() => downloadOrders(false)}
              href="#"
              data-testid="download-orders-button"
            >
              <Translate
                id="react.order.export.orders.label"
                defaultMessage="Export orders"
              />
            </a>
          </div>
        </div>
      </div>
      <DataTable
        manual
        sortable={false}
        ref={tableRef}
        columns={columns}
        data={tableData.data}
        loading={loading}
        defaultPageSize={10}
        pages={tableData.pages}
        totalData={tableData.totalCount}
        onFetchData={onFetchHandler}
        NoDataComponent={() => (
          <div className="rt-noData" data-testid="empty-table">
            <Translate id="react.order.empty.label" defaultMessage="There are no orders that match the given criteria" />
          </div>
        )}
        footerComponent={() => (
          <span className="title-text p-1 d-flex flex-1 justify-content-end">
            {totalAmount()}
          </span>
        )}
      />
    </div>
  );
};

const mapStateToProps = (state) => ({
  supportedActivities: state.session.supportedActivities,
  highestRole: state.session.highestRole,
  translate: translateWithDefaultMessage(getTranslate(state.localize)),
  currencyCode: state.session.currencyCode,
  locale: state.session.activeLanguageTag,
});

export default connect(mapStateToProps)(OrderListTable);

OrderListTable.propTypes = {
  filterParams: PropTypes.shape({}).isRequired,
  supportedActivities: PropTypes.arrayOf(PropTypes.string).isRequired,
  highestRole: PropTypes.string.isRequired,
  translate: PropTypes.func.isRequired,
  currencyCode: PropTypes.string.isRequired,
  locale: PropTypes.string.isRequired,
  isPutawayList: PropTypes.bool.isRequired,
};
