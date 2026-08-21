import React, { useEffect, useState } from 'react';

import { useParams } from 'react-router-dom';

import userApi from 'api/services/UserApi';
import Button from 'components/form-elements/Button';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { USER_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const UserChangePhoto = () => {
  useTranslation('user', 'default');
  const { id } = useParams();
  const spinner = useSpinner();
  const [user, setUser] = useState(null);
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    spinner.show();
    userApi.getUser(id)
      .then((response) => setUser(response.data.data))
      .catch(() => { window.location.href = USER_URL.list(); })
      .finally(() => spinner.hide());
  }, [id]);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!photo) {
      return;
    }
    const formData = new FormData();
    formData.append('photo', photo);
    spinner.show();
    try {
      await userApi.uploadPhoto(id, formData);
      notification(NotificationType.SUCCESS)({
        message: Translate({
          id: 'react.user.photoUpdated.label',
          defaultMessage: `User ${id} updated`,
          data: { id },
        }),
      });
      window.location.href = USER_URL.edit(id);
    } catch (error) {
      const errorMessage = error?.response?.data?.errorMessage;
      if (errorMessage) {
        notification(NotificationType.ERROR)({ message: errorMessage });
      }
    } finally {
      spinner.hide();
    }
  };

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.user.changePhoto.header.label',
          defaultMessage: 'Change Photo',
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
        <form className="p-3 w-50" onSubmit={onSubmit}>
          <div className="d-flex align-items-center pb-3">
            {user.hasPhoto && (
              <img
                src={USER_URL.viewThumb(id)}
                alt={user.name}
                width="64"
                height="64"
                className="mr-3"
              />
            )}
            <h2 className="mb-0">{user.name}</h2>
            <span className="tag ml-3">
              {user.active
                ? <Translate id="react.user.active.label" defaultMessage="Active" />
                : <Translate id="react.user.inactive.label" defaultMessage="Inactive" />}
            </span>
          </div>
          <div className="pt-2">
            <label htmlFor="photo" className="font-weight-bold d-block">
              <Translate id="react.user.photo.label" defaultMessage="Photo" />
            </label>
            <input
              id="photo"
              type="file"
              name="photo"
              accept="image/png,image/jpeg,image/gif"
              onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
            />
          </div>
          <div className="d-flex align-items-center pt-3">
            <Button
              type="submit"
              label="react.default.button.upload.label"
              defaultLabel="Upload"
            />
            <Button
              type="button"
              variant="transparent"
              label="react.default.button.cancel.label"
              defaultLabel="Cancel"
              onClick={() => { window.location.href = USER_URL.show(id); }}
            />
          </div>
        </form>
      )}
    </PageWrapper>
  );
};

export default UserChangePhoto;
