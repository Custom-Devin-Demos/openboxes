import React, { useEffect, useState } from 'react';

import { useParams } from 'react-router-dom';

import userApi from 'api/services/UserApi';
import Button from 'components/form-elements/Button';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { USER_URL } from 'consts/applicationUrls';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const UserCropPhoto = () => {
  useTranslation('user', 'default');
  const { id } = useParams();
  const spinner = useSpinner();
  const [user, setUser] = useState(null);

  useEffect(() => {
    spinner.show();
    userApi.getUser(id)
      .then((response) => setUser(response.data.data))
      .catch(() => { window.location.href = USER_URL.list(); })
      .finally(() => spinner.hide());
  }, [id]);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.user.showUser.label',
          defaultMessage: 'Show User',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.user.listUsers.label"
            defaultLabel="User List"
            variant="secondary"
            onClick={() => { window.location.href = USER_URL.list(); }}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      {user && (
        <div className="p-3">
          <div className="d-flex align-items-center pb-3">
            <h2 className="mb-0">{user.name}</h2>
            <span className="tag ml-3">
              {user.active
                ? <Translate id="react.user.active.label" defaultMessage="Active" />
                : <Translate id="react.user.inactive.label" defaultMessage="Inactive" />}
            </span>
          </div>
          <div className="pt-2">
            <span className="font-weight-bold d-block pb-2">
              <Translate id="react.user.photo.label" defaultMessage="Photo" />
            </span>
            {user.hasPhoto ? (
              <div className="d-flex align-items-center">
                <img
                  id="thumb"
                  src={USER_URL.viewThumb(id)}
                  alt={user.name}
                  className="mr-3"
                />
                <img
                  id="image"
                  src={USER_URL.viewPhoto(id)}
                  alt={user.name}
                />
              </div>
            ) : (
              <span className="text-muted">
                <Translate id="react.default.none.label" defaultMessage="None" />
              </span>
            )}
          </div>
          <div className="d-flex align-items-center pt-3">
            <Button
              label="react.default.button.update.label"
              defaultLabel="Update"
              onClick={() => { window.location.href = USER_URL.changePhoto(id); }}
            />
            <Button
              type="button"
              variant="transparent"
              label="react.default.button.cancel.label"
              defaultLabel="Cancel"
              onClick={() => { window.location.href = USER_URL.show(id); }}
            />
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default UserCropPhoto;
