/* eslint-disable jsx-a11y/label-has-for, jsx-a11y/label-has-associated-control */
import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { SHIPMENT_COMMENT_FORM, SHIPMENT_SUMMARY } from 'api/urls';
import ShipmentSummary from 'components/shipment/ShipmentSummary';
import { SHIPMENT_URL } from 'consts/applicationUrls';
import useTranslate from 'hooks/useTranslate';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const AddComment = ({ match }) => {
  const { shipmentId } = match.params;
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const currentUser = useSelector((state) => state.session.user);
  const translate = useTranslate();

  useEffect(() => {
    apiClient.get(SHIPMENT_SUMMARY(shipmentId))
      .then((response) => setSummary(response.data.data));
    apiClient.get(SHIPMENT_COMMENT_FORM)
      .then((response) => setUsers(response.data.data.users));
  }, [shipmentId]);

  return (
    <div className="body">
      <table>
        <tbody>
          <tr>
            <td>
              <fieldset>
                <ShipmentSummary summary={summary} />
                <form action={SHIPMENT_URL.saveComment()} method="post">
                  <input type="hidden" name="shipmentId" value={shipmentId} />
                  <table>
                    <tbody>
                      <tr className="prop">
                        <td valign="top" className="name">
                          <label>
                            <Translate id="react.default.to.label" defaultMessage="To" />
                          </label>
                        </td>
                        <td valign="top" className="value">
                          <select id="recipientId" name="recipientId" defaultValue="">
                            <option value="">
                              {translate('react.default.selectOne.label', 'Select One ...')}
                            </option>
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>{user.username}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                      <tr className="prop">
                        <td valign="top" className="name">
                          <label>
                            <Translate id="react.default.from.label" defaultMessage="From" />
                          </label>
                        </td>
                        <td valign="top" className="value">
                          {currentUser?.username}
                        </td>
                      </tr>
                      <tr className="prop">
                        <td valign="top" className="name">
                          <label>
                            <Translate id="react.shipment.comment.label" defaultMessage="Comment" />
                          </label>
                        </td>
                        <td valign="top" className="value">
                          <textarea name="comment" cols="60" rows="10" />
                        </td>
                      </tr>
                      <tr className="prop">
                        <td valign="top" className="name" />
                        <td valign="top" className="value">
                          <div className="buttons">
                            <button type="submit" className="positive">
                              <Translate id="react.default.button.add.label" defaultMessage="Add" />
                            </button>
                            {' '}
                            <a href={SHIPMENT_URL.showDetails(shipmentId)} className="negative">
                              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </form>
              </fieldset>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default AddComment;

AddComment.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      shipmentId: PropTypes.string,
    }),
  }).isRequired,
};
