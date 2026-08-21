import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import locationGroupApi from 'api/services/LocationGroupApi';
import Button from 'components/form-elements/Button';
import notification from 'components/Layout/notifications/notification';
import { LOCATION_GROUP_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const LocationGroupShow = ({ match }) => {
  useTranslation('locationGroup');
  const { locationGroupId } = match.params;

  const [locationGroup, setLocationGroup] = useState(null);

  useEffect(() => {
    locationGroupApi.getLocationGroup(locationGroupId)
      .then((response) => {
        setLocationGroup(response.data.data);
      });
  }, [locationGroupId]);

  const deleteLocationGroup = async (onClose) => {
    try {
      await locationGroupApi.deleteLocationGroup(locationGroupId);
      notification(NotificationType.SUCCESS)({
        message: `Location group ${locationGroup?.name} deleted`,
      });
      window.location = LOCATION_GROUP_URL.list();
    } finally {
      onClose?.();
    }
  };

  const deleteConfirmationModalButtons = (onClose) => ([
    {
      variant: 'transparent',
      defaultLabel: 'No',
      label: 'react.default.no.label',
      onClick: () => onClose?.(),
    },
    {
      variant: 'primary',
      defaultLabel: 'Yes',
      label: 'react.default.yes.label',
      onClick: () => deleteLocationGroup(onClose),
    },
  ]);

  const onDelete = () => confirmationModal({
    buttons: deleteConfirmationModalButtons,
    title: {
      label: 'react.default.areYouSure.label',
      default: 'Are you sure?',
    },
  });

  return (
    <PageWrapper>
      <div className="d-flex flex-column m-3">
        <h1 className="mb-3">
          <Translate id="react.locationGroup.showLocationGroup.label" defaultMessage="Show Location Group" />
        </h1>
        {locationGroup && (
          <div className="w-50">
            <table className="table table-bordered">
              <tbody>
                <tr>
                  <td className="font-weight-bold">
                    <Translate id="react.locationGroup.name.label" defaultMessage="Name" />
                  </td>
                  <td>{locationGroup.name}</td>
                </tr>
                <tr>
                  <td className="font-weight-bold">
                    <Translate id="react.locationGroup.locations.label" defaultMessage="Locations" />
                  </td>
                  <td>
                    <ul className="mb-0 pl-3">
                      {locationGroup.locations?.map((location) => (
                        <li key={location.id}>{location.name}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="d-flex gap-8 align-items-center">
              <Button
                type="button"
                label="react.default.button.edit.label"
                defaultLabel="Edit"
                onClick={() => {
                  window.location = LOCATION_GROUP_URL.edit(locationGroupId);
                }}
              />
              <Button
                type="button"
                variant="danger"
                label="react.default.button.delete.label"
                defaultLabel="Delete"
                onClick={onDelete}
              />
              <a href={LOCATION_GROUP_URL.list()} className="ml-2">
                <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
              </a>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default withRouter(LocationGroupShow);

LocationGroupShow.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      locationGroupId: PropTypes.string,
    }),
  }).isRequired,
};
