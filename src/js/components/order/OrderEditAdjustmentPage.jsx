import React, { useEffect, useState } from 'react';

import queryString from 'query-string';
import { useLocation, useParams } from 'react-router-dom';
import Alert from 'react-s-alert';

import { ORDER_ADJUSTMENT_FORM_DATA } from 'api/urls';
import OrderSummary from 'components/order/OrderSummary';
import { ORDER_URL, PURCHASE_ORDER_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const OrderEditAdjustmentPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const queryProps = queryString.parse(location.search);

  // On the edit screen (order/editAdjustment/:adjustmentId?order.id=:orderId),
  // :id is the adjustment id and the order id comes from the query string.
  // On the add screen (order/addAdjustment/:orderId), :id is the order id.
  const isEdit = location.pathname.includes('editAdjustment');
  const orderId = isEdit ? queryProps['order.id'] : id;
  const adjustmentId = isEdit ? id : null;

  const [order, setOrder] = useState(null);
  const [isAccountingRequired, setIsAccountingRequired] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const [adjustmentTypes, setAdjustmentTypes] = useState([]);
  const [budgetCodes, setBudgetCodes] = useState([]);
  const [values, setValues] = useState({
    orderItemId: '',
    orderAdjustmentTypeId: '',
    description: '',
    amount: '',
    percentage: '',
    comments: '',
    budgetCodeId: '',
  });

  useTranslation('order');

  useEffect(() => {
    if (orderId) {
      apiClient.get(ORDER_ADJUSTMENT_FORM_DATA(orderId), {
        params: adjustmentId ? { adjustmentId } : {},
      })
        .then((response) => {
          const { data } = response.data;
          setIsAccountingRequired(data.isAccountingRequired);
          setOrderItems(data.orderItems);
          setAdjustmentTypes(data.adjustmentTypes);
          setBudgetCodes(data.budgetCodes);
          if (data.adjustment) {
            setValues({
              orderItemId: data.adjustment.orderItemId || '',
              orderAdjustmentTypeId: data.adjustment.orderAdjustmentTypeId || '',
              description: data.adjustment.description || '',
              amount: data.adjustment.amount != null ? `${data.adjustment.amount}` : '',
              percentage: data.adjustment.percentage != null ? `${data.adjustment.percentage}` : '',
              comments: data.adjustment.comments || '',
              budgetCodeId: data.adjustment.budgetCodeId || '',
            });
          }
        });
    }
  }, [orderId, adjustmentId]);

  const onChange = (field) => (event) => {
    const { value } = event.target;
    setValues((prevValues) => ({ ...prevValues, [field]: value }));
  };

  // If percentage is filled, the amount field is disabled and vice versa
  const amountDisabled = Boolean(values.percentage);
  const percentageDisabled = Boolean(values.amount);

  const validateForm = () => {
    if (!values.budgetCodeId && isAccountingRequired) {
      Alert.error('Required');
      return false;
    }
    if (!values.description) {
      Alert.error('Description required');
      return false;
    }
    return true;
  };

  const saveOrderAdjustment = () => {
    if (!validateForm()) {
      Alert.error('Please enter a value for all required fields');
      return;
    }
    // Serialize all fields (including disabled amount/percentage values),
    // matching the legacy jQuery serialization behavior
    const data = new URLSearchParams();
    data.append('id', adjustmentId || '');
    data.append('isAccountingRequired', `${isAccountingRequired}`);
    data.append('order.id', orderId || '');
    data.append('orderItem.id', values.orderItemId);
    data.append('orderAdjustmentType.id', values.orderAdjustmentTypeId);
    data.append('description', values.description);
    data.append('amount', values.amount);
    data.append('percentage', values.percentage);
    data.append('comments', values.comments);
    data.append('budgetCode', values.budgetCodeId);

    apiClient.post(ORDER_URL.saveAdjustment(), data, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
      .then(() => {
        Alert.success('Successfully saved new adjustment');
        window.location = `${PURCHASE_ORDER_URL.addItems(orderId)}?skipTo=adjustments`;
      })
      .catch((error) => {
        const responseData = error.response?.data;
        if (responseData?.errorMessage) {
          Alert.error(responseData.errorMessage);
        } else if (typeof responseData === 'string' && responseData) {
          Alert.error(responseData);
        } else {
          Alert.error('Error saving adjustment');
        }
      });
  };

  return (
    <div className="d-flex flex-column list-page-main">
      <OrderSummary orderId={orderId} onFetchedOrder={setOrder} />
      <div className="box p-3">
        <h2>
          <Translate id="react.order.editAdjustment.label" defaultMessage="Edit adjustment" />
        </h2>
        <form name="orderAdjustmentForm" onSubmit={(event) => event.preventDefault()}>
          <table>
            <tbody>
              <tr className="prop">
                <td valign="top" className="name">
                  <span className="label">
                    <Translate id="react.order.label" defaultMessage="Order" />
                  </span>
                </td>
                <td valign="top" className="value">
                  {order?.orderNumber}
                  {' '}
                  {order?.name}
                </td>
              </tr>
              <tr className="prop">
                <td valign="top" className="name">
                  <label htmlFor="orderItemId">
                    <Translate id="react.order.orderItem.label" defaultMessage="Order item" />
                  </label>
                </td>
                <td valign="top" className="value">
                  <select
                    id="orderItemId"
                    aria-label="Order item"
                    className="form-control"
                    value={values.orderItemId}
                    onChange={onChange('orderItemId')}
                  >
                    <option value="" aria-label="None" label=" " />
                    {orderItems.map((orderItem) => (
                      <option key={orderItem.id} value={orderItem.id}>
                        {orderItem.name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
              <tr className="prop">
                <td valign="top" className="name">
                  <label htmlFor="orderAdjustmentTypeId">
                    <Translate id="react.order.orderAdjustmentType.label" defaultMessage="Adjustment type" />
                  </label>
                </td>
                <td valign="top" className="value">
                  <select
                    id="orderAdjustmentTypeId"
                    aria-label="Adjustment type"
                    className="form-control"
                    value={values.orderAdjustmentTypeId}
                    onChange={onChange('orderAdjustmentTypeId')}
                  >
                    <option value="" aria-label="None" label=" " />
                    {adjustmentTypes.map((adjustmentType) => (
                      <option key={adjustmentType.id} value={adjustmentType.id}>
                        {adjustmentType.name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
              <tr className="prop">
                <td valign="top" className="name">
                  <label htmlFor="description">
                    <Translate id="react.default.description.label" defaultMessage="Description" />
                  </label>
                </td>
                <td valign="top" className="value">
                  <input
                    id="description"
                    type="text"
                    className="large text form-control"
                    value={values.description}
                    onChange={onChange('description')}
                  />
                </td>
              </tr>
              <tr className="prop">
                <td valign="top" className="name">
                  <label htmlFor="amount">
                    <Translate id="react.order.adjustment.amount.label" defaultMessage="Amount" />
                  </label>
                </td>
                <td valign="top" className="value">
                  <input
                    id="amount"
                    type="text"
                    className="large text form-control"
                    value={values.amount}
                    disabled={amountDisabled}
                    onChange={onChange('amount')}
                  />
                </td>
              </tr>
              <tr className="prop">
                <td valign="top" className="name">
                  <label htmlFor="percentage">
                    <Translate id="react.order.adjustment.percentage.label" defaultMessage="Percentage" />
                  </label>
                </td>
                <td valign="top" className="value">
                  <input
                    id="percentage"
                    type="text"
                    className="large text form-control"
                    value={values.percentage}
                    disabled={percentageDisabled}
                    onChange={onChange('percentage')}
                  />
                </td>
              </tr>
              <tr className="prop">
                <td valign="top" className="name">
                  <label htmlFor="comments">
                    <Translate id="react.default.comments.label" defaultMessage="Comments" />
                  </label>
                </td>
                <td valign="top" className="value">
                  <textarea
                    id="comments"
                    className="large text form-control"
                    value={values.comments}
                    onChange={onChange('comments')}
                  />
                </td>
              </tr>
              <tr className="prop">
                <td valign="top" className="name">
                  <label htmlFor="budgetCode">
                    <Translate id="react.order.adjustment.budgetCode.label" defaultMessage="Budget code" />
                  </label>
                </td>
                <td valign="top" className="value">
                  <select
                    id="budgetCode"
                    aria-label="Budget code"
                    className="form-control"
                    value={values.budgetCodeId}
                    onChange={onChange('budgetCodeId')}
                  >
                    <option value="" aria-label="None" label=" " />
                    {budgetCodes.map((budgetCode) => (
                      <option key={budgetCode.id} value={budgetCode.id}>
                        {budgetCode.code}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="buttons">
            <button type="button" className="button icon approve" onClick={saveOrderAdjustment}>
              <Translate id="react.default.button.save.label" defaultMessage="Save" />
            </button>
            <a href={ORDER_URL.show(orderId)} className="button icon trash">
              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderEditAdjustmentPage;
