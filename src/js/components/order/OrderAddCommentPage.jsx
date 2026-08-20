import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import queryString from 'query-string';
import { connect } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';

import { ORDER_COMMENT_FORM_DATA } from 'api/urls';
import OrderSummary from 'components/order/OrderSummary';
import { CONTEXT_PATH, ORDER_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const OrderAddCommentPage = ({ user }) => {
  const { id } = useParams();
  const location = useLocation();
  const queryProps = queryString.parse(location.search);

  // On the edit screen (order/editComment/:commentId?order.id=:orderId),
  // :id is the comment id and the order id comes from the query string
  const isEdit = location.pathname.includes('editComment');
  const orderId = isEdit ? queryProps['order.id'] : id;
  const commentId = isEdit ? id : null;

  const [recipients, setRecipients] = useState([]);
  const [recipientId, setRecipientId] = useState('');
  const [comment, setComment] = useState('');

  useTranslation('order');

  useEffect(() => {
    if (orderId) {
      apiClient.get(ORDER_COMMENT_FORM_DATA(orderId), {
        params: commentId ? { commentId } : {},
      })
        .then((response) => {
          const { data } = response.data;
          setRecipients(data.recipients);
          if (data.comment) {
            setRecipientId(data.comment.recipientId || '');
            setComment(data.comment.comment || '');
          }
        });
    }
  }, [orderId, commentId]);

  return (
    <div className="d-flex flex-column list-page-main">
      <OrderSummary orderId={orderId} />
      <div className="box p-3">
        <h2>
          <Translate id="react.order.addComment.label" defaultMessage="Add comment" />
        </h2>
        {/* Plain form POST preserves the legacy saveComment semantics
            (server-side validation, flash messages and redirect to order/show) */}
        <form method="post" action={`${CONTEXT_PATH}/order/saveComment`}>
          <input type="hidden" name="id" value={commentId || ''} />
          <input type="hidden" name="order.id" value={orderId || ''} />
          <table>
            <tbody>
              <tr className="prop">
                <td valign="top" className="name">
                  <label htmlFor="recipient.id">
                    <Translate id="react.order.comment.recipient.label" defaultMessage="Recipient" />
                  </label>
                </td>
                <td valign="top" className="value">
                  <select
                    id="recipient.id"
                    name="recipient.id"
                    aria-label="Recipient"
                    className="form-control"
                    style={{ width: '300px' }}
                    value={recipientId}
                    onChange={(event) => setRecipientId(event.target.value)}
                  >
                    <option value="" aria-label="None" label=" " />
                    {recipients.map((recipient) => (
                      <option key={recipient.id} value={recipient.id}>
                        {recipient.name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
              <tr className="prop">
                <td valign="top" className="name">
                  <label htmlFor="sender.id">
                    <Translate id="react.order.comment.sender.label" defaultMessage="Sender" />
                  </label>
                </td>
                <td valign="top" className="value">
                  <input type="hidden" name="sender.id" value={user.id} />
                  {user.name || user.username}
                  {' '}
                  <span className="fade">
                    (
                    {user.username}
                    )
                  </span>
                </td>
              </tr>
              <tr className="prop">
                <td valign="top" className="name">
                  <label htmlFor="comment">
                    <Translate id="react.order.comment.label" defaultMessage="Comment" />
                  </label>
                </td>
                <td valign="top" className="value">
                  <textarea
                    id="comment"
                    name="comment"
                    cols="100"
                    rows="10"
                    className="form-control"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <div className="buttons">
            <button type="submit" className="button icon approve">
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

const mapStateToProps = (state) => ({
  user: state.session.user,
});

export default connect(mapStateToProps)(OrderAddCommentPage);

OrderAddCommentPage.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    username: PropTypes.string,
  }).isRequired,
};
