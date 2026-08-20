/* eslint-disable jsx-a11y/label-has-for, jsx-a11y/label-has-associated-control */
import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import queryString from 'query-string';

import { SHIPMENT_EVENT_FORM, SHIPMENT_SUMMARY } from 'api/urls';
import ShipmentSummary from 'components/shipment/ShipmentSummary';
import { SHIPMENT_URL } from 'consts/applicationUrls';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const range = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => start + i);

const DateStructPicker = ({ name, value }) => {
  const date = value ? new Date(value) : new Date();
  const currentYear = new Date().getFullYear();

  return (
    <span>
      <input type="hidden" name={name} value="date.struct" />
      <select name={`${name}_day`} defaultValue={date.getDate()}>
        {range(1, 31).map((day) => (
          <option key={day} value={day}>{day}</option>
        ))}
      </select>
      {' '}
      <select name={`${name}_month`} defaultValue={date.getMonth() + 1}>
        {range(1, 12).map((month) => (
          <option key={month} value={month}>{MONTH_NAMES[month - 1]}</option>
        ))}
      </select>
      {' '}
      <select name={`${name}_year`} defaultValue={date.getFullYear()}>
        {range(currentYear - 100, currentYear + 100).map((year) => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
      {' '}
      <select name={`${name}_hour`} defaultValue={String(date.getHours()).padStart(2, '0')}>
        {range(0, 23).map((hour) => (
          <option key={hour} value={String(hour).padStart(2, '0')}>
            {String(hour).padStart(2, '0')}
          </option>
        ))}
      </select>
      :
      <select name={`${name}_minute`} defaultValue={String(date.getMinutes()).padStart(2, '0')}>
        {range(0, 59).map((minute) => (
          <option key={minute} value={String(minute).padStart(2, '0')}>
            {String(minute).padStart(2, '0')}
          </option>
        ))}
      </select>
    </span>
  );
};

DateStructPicker.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
};

DateStructPicker.defaultProps = {
  value: null,
};

const EditEvent = ({ match, location }) => {
  const parsedQuery = queryString.parse(location.search);
  const { eventId } = match.params;
  const shipmentId = match.params.shipmentId || parsedQuery.shipmentId;
  const [summary, setSummary] = useState(null);
  const [event, setEvent] = useState(null);
  const [eventTypes, setEventTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    apiClient.get(SHIPMENT_SUMMARY(shipmentId))
      .then((response) => setSummary(response.data.data));
    apiClient.get(SHIPMENT_EVENT_FORM(shipmentId), { params: { eventId } })
      .then((response) => {
        setEvent(response.data.data.event);
        setEventTypes(response.data.data.eventTypes);
        setLocations(response.data.data.locations);
        setLoaded(true);
      });
  }, [shipmentId, eventId]);

  if (!loaded) {
    return null;
  }

  return (
    <div className="body">
      <div className="dialog">
        <form action={SHIPMENT_URL.saveEvent()} method="post">
          <input type="hidden" name="shipmentId" value={shipmentId} />
          <input type="hidden" name="eventId" value={event?.id || ''} />
          <ShipmentSummary summary={summary} />
          <div className="box">
            <h2>
              <Translate id="react.shipment.editEvent.label" defaultMessage="Edit Event" />
            </h2>
            <table>
              <tbody>
                <tr className="prop">
                  <td valign="top" className="name">
                    <label>
                      <Translate id="react.shipment.eventType.label" defaultMessage="Event type" />
                    </label>
                  </td>
                  <td valign="top" className="value">
                    {!event?.eventType
                      ? (
                        <select id="eventType.id" name="eventType.id" defaultValue="">
                          <option value="">
                            <Translate id="react.default.selectOne.label" defaultMessage="Select One ..." />
                          </option>
                          {eventTypes.map((eventType) => (
                            <option key={eventType.id} value={eventType.id}>
                              {eventType.name}
                            </option>
                          ))}
                        </select>
                      )
                      : (
                        <span>
                          <input type="hidden" name="eventType.id" value={event.eventType.id} />
                          {event.eventType.name}
                        </span>
                      )}
                  </td>
                </tr>
                <tr className="prop">
                  <td valign="top" className="name">
                    <label>
                      <Translate id="react.shipment.eventDate.label" defaultMessage="Event date" />
                    </label>
                  </td>
                  <td valign="top" className="value">
                    <DateStructPicker name="eventDate" value={event?.eventDate} />
                  </td>
                </tr>
                <tr className="prop">
                  <td valign="top" className="name">
                    <label>
                      <Translate id="react.shipment.location.label" defaultMessage="Location" />
                    </label>
                  </td>
                  <td valign="top" className="value">
                    <select id="eventLocation.id" name="eventLocation.id" defaultValue={event?.eventLocation?.id || ''}>
                      <option value="">
                        <Translate id="react.default.selectOne.label" defaultMessage="Select One ..." />
                      </option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="2">
                    <div className="buttons">
                      <button type="submit" className="button icon approve">
                        <Translate id="react.default.button.save.label" defaultMessage="Save" />
                      </button>
                      {' '}
                      {event?.id
                        && (
                        <a
                          href={SHIPMENT_URL.deleteEvent(event.id, { shipmentId })}
                          className="button icon trash"
                        >
                          <Translate id="react.default.button.delete.label" defaultMessage="Delete" />
                        </a>
                        )}
                      {' '}
                      <a href={SHIPMENT_URL.showDetails(shipmentId)}>
                        <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
                      </a>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEvent;

EditEvent.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      eventId: PropTypes.string,
      shipmentId: PropTypes.string,
    }),
  }).isRequired,
  location: PropTypes.shape({
    search: PropTypes.string,
  }).isRequired,
};
