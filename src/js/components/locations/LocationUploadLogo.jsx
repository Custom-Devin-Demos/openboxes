import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { getTranslate } from 'react-localize-redux';
import { useSelector } from 'react-redux';
import { withRouter } from 'react-router-dom';
import Alert from 'react-s-alert';

import { LOCATION, LOCATION_DETAILS, LOCATION_LOGO } from 'api/urls';
import { LOCATION_URL } from 'consts/applicationUrls';
import apiClient from 'utils/apiClient';
import { convertToBase64 } from 'utils/file-utils';
import Translate, { translateWithDefaultMessage } from 'utils/Translate';

const ALLOWED_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/gif'];
const MAX_LOGO_SIZE = 1024 * 1000;

/**
 * React equivalent of the legacy location/uploadLogo screen: shows the
 * current logo of a location and lets the user upload or delete it.
 */
const LocationUploadLogo = ({ match }) => {
  const { locationId } = match.params;
  const [location, setLocation] = useState({});
  const [hasLogo, setHasLogo] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  // Used to force a refresh of the logo image after upload
  const [logoVersion, setLogoVersion] = useState(0);

  const { translate } = useSelector((state) => ({
    translate: translateWithDefaultMessage(getTranslate(state.localize)),
  }));

  const fetchLocation = () => {
    apiClient.get(LOCATION(locationId))
      .then((response) => setLocation(response.data.data || {}));
    apiClient.get(LOCATION_DETAILS(locationId))
      .then((response) => setHasLogo(response.data.data?.hasLogo || false));
  };

  useEffect(() => {
    fetchLocation();
  }, [locationId]);

  const uploadLogo = (event) => {
    event.preventDefault();
    if (!logoFile) {
      return;
    }
    if (!ALLOWED_CONTENT_TYPES.includes(logoFile.type) || logoFile.size >= MAX_LOGO_SIZE) {
      Alert.error(translate(
        'react.locationsList.uploadLogo.invalidFile.label',
        'Please upload a PNG, JPEG or GIF file that is less than 1 MB in size',
      ));
      return;
    }
    convertToBase64(logoFile)
      .then((logo) => apiClient.post(LOCATION(locationId), { logo }))
      .then(() => {
        Alert.success(translate('react.locationsList.uploadLogo.success.label', 'Logo has been uploaded successfully'), { timeout: 3000 });
        setLogoFile(null);
        setLogoVersion((version) => version + 1);
        fetchLocation();
      })
      .catch(() => {
        Alert.error(translate('react.locationsList.uploadLogo.error.label', 'Could not upload logo'));
      });
  };

  const deleteLogo = () => {
    apiClient.delete(LOCATION_LOGO(locationId))
      .then(() => {
        setLogoVersion((version) => version + 1);
        fetchLocation();
      });
  };

  return (
    <div className="d-flex flex-column list-page-main">
      <div className="d-flex list-page-header">
        <span className="d-flex align-self-center title">
          <Translate id="react.locationsList.uploadLogo.label" defaultMessage="Upload logo" />
          {location.name ? `: ${location.name}` : ''}
        </span>
      </div>
      <div className="p-3">
        <form onSubmit={uploadLogo}>
          <div className="form-group row">
            <label htmlFor="currentLogo" className="col-md-2 col-form-label">
              <Translate id="react.locationsList.currentLogo.label" defaultMessage="Current logo" />
            </label>
            <div className="col-md-6" id="currentLogo">
              {hasLogo
                ? (
                  <div>
                    <img className="img-fluid" alt={location.name || 'logo'} src={`${LOCATION_URL.viewLogo(locationId)}?v=${logoVersion}`} />
                    <button type="button" className="btn btn-outline-danger btn-xs ml-2" onClick={deleteLogo}>
                      <i className="fa fa-trash-o mr-1" aria-hidden="true" />
                      <Translate id="react.default.button.delete.label" defaultMessage="Delete" />
                    </button>
                  </div>
                )
                : (
                  <span className="text-muted">
                    <Translate id="react.default.none.label" defaultMessage="None" />
                  </span>
                )}
            </div>
          </div>
          <div className="form-group row">
            <label htmlFor="logo" className="col-md-2 col-form-label">
              <Translate id="react.locationsList.logo.label" defaultMessage="Logo" />
            </label>
            <div className="col-md-6">
              <input
                type="file"
                id="logo"
                name="logo"
                accept={ALLOWED_CONTENT_TYPES.join(',')}
                onChange={(event) => setLogoFile(event.target.files[0])}
              />
              <small className="form-text text-muted">
                <Translate
                  id="react.locationsList.uploadLogo.tooltip.label"
                  defaultMessage="Must be a PNG, JPEG or GIF that is less than 1 MB in size"
                />
              </small>
            </div>
          </div>
          <div className="d-flex">
            <button type="submit" className="btn btn-outline-primary btn-xs">
              <Translate id="react.default.button.upload.label" defaultMessage="Upload" />
            </button>
            <a className="btn btn-outline-secondary btn-xs ml-2" href={LOCATION_URL.edit(locationId)}>
              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default withRouter(LocationUploadLogo);

LocationUploadLogo.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({ locationId: PropTypes.string }),
  }).isRequired,
};
