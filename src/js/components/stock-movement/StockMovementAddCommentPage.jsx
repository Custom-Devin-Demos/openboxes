import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import queryString from 'query-string';
import { connect } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';

import { STOCK_MOVEMENT_COMMENT_FORM_DATA } from 'api/urls';
import StockMovementSummary from 'components/stock-movement/StockMovementSummary';
import { CONTEXT_PATH, STOCK_MOVEMENT_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const StockMovementAddCommentPage = ({ user }) => {
  const { id } = useParams();
  const location = useLocation();
  const queryProps = queryString.parse(location.search);

  // On the edit screen (stockMovement/editComment/:commentId?stockMovementId=:id),
  // :id is the comment id and the stock movement id comes from the query string.
  // On the reject screen (stockRequest/reject/:id), :id is the stock movement id
  // and the form confirms the rejection via updateStatus (legacy semantics).
  const isEdit = location.pathname.includes('editComment');
  const isReject = location.pathname.includes('reject');
  const stockMovementId = isEdit ? queryProps.stockMovementId : id;
  const commentId = isEdit ? id : null;

  const [recipients, setRecipients] = useState([]);
  const [recipientId, setRecipientId] = useState('');
  const [comment, setComment] = useState('');
  const [summary, setSummary] = useState(null);
  const [rejectMessage, setRejectMessage] = useState('');

  useTranslation('stockMovement');

  useEffect(() => {
    if (stockMovementId) {
      apiClient.get(STOCK_MOVEMENT_COMMENT_FORM_DATA(stockMovementId), {
        params: commentId ? { commentId } : {},
      })
        .then((response) => {
          const { data } = response.data;
          setRecipients(data.recipients);
          setSummary(data.summary);
          setRejectMessage(data.rejectMessage);
          if (data.comment) {
            setRecipientId(data.comment.recipientId || '');
            setComment(data.comment.comment || '');
          }
        });
    }
  }, [stockMovementId, commentId]);

  // Plain form POST preserves the legacy saveComment/updateComment/updateStatus
  // semantics (server-side validation, flash messages and redirect to show)
  let formAction = `${CONTEXT_PATH}/stockMovement/saveComment`;
  if (commentId) {
    formAction = `${CONTEXT_PATH}/stockMovement/updateComment`;
  } else if (isReject) {
    formAction = `${CONTEXT_PATH}/stockMovement/updateStatus`;
  }

  return (
    <div className="d-flex flex-column list-page-main">
      <StockMovementSummary summary={summary} />
      <div className="box p-3">
        <h2>
          {isReject
            ? rejectMessage
            : <Translate id="react.stockMovement.addComment.label" defaultMessage="Add comment" />}
        </h2>
        <form method="post" action={formAction}>
          {isReject && <input type="hidden" name="status" value="REJECTED" />}
          {isReject && <input type="hidden" name="id" value={stockMovementId || ''} />}
          {commentId && <input type="hidden" name="id" value={commentId} />}
          <input type="hidden" name="stockMovementId" value={stockMovementId || ''} />
          <table>
            <tbody>
              <tr className="prop">
                <td valign="top" className="name">
                  <label htmlFor="recipient.id">
                    <Translate id="react.stockMovement.comment.recipient.label" defaultMessage="Recipient" />
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
                    <Translate id="react.stockMovement.comment.sender.label" defaultMessage="Sender" />
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
                    <Translate id="react.stockMovement.comment.label" defaultMessage="Comment" />
                  </label>
                </td>
                <td valign="top" className="value">
                  <textarea
                    id="comment"
                    name="comment"
                    cols="100"
                    rows="10"
                    required
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
              {isReject
                ? <Translate id="react.stockMovement.confirmReject.label" defaultMessage="Confirm reject" />
                : <Translate id="react.default.button.save.label" defaultMessage="Save" />}
            </button>
            <a href={STOCK_MOVEMENT_URL.show(stockMovementId)} className="button icon trash">
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

export default connect(mapStateToProps)(StockMovementAddCommentPage);

StockMovementAddCommentPage.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    username: PropTypes.string,
  }).isRequired,
};
