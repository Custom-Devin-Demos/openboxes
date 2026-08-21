import React, { useEffect, useState } from 'react';

import moment from 'moment';
import { useSelector } from 'react-redux';
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

const formatDateTime = (millis) => (millis ? moment(millis).format('MMM D, YYYY h:mm:ss A') : null);

const UserShow = () => {
  useTranslation('user', 'default');
  const { id } = useParams();
  const spinner = useSpinner();
  const [user, setUser] = useState(null);
  const isSuperuser = useSelector((state) => state.session.isSuperuser);

  useEffect(() => {
    spinner.show();
    userApi.getUser(id)
      .then((response) => setUser(response.data.data))
      .catch(() => { window.location.href = USER_URL.list(); })
      .finally(() => spinner.hide());
  }, [id]);

  const none = (
    <span className="text-muted">
      <Translate id="react.default.none.label" defaultMessage="None" />
    </span>
  );
  const never = (
    <span className="text-muted">
      <Translate id="react.default.never.label" defaultMessage="Never" />
    </span>
  );

  const rows = user ? [
    {
      key: 'username',
      label: Translate({ id: 'react.user.username.label', defaultMessage: 'Username' }),
      value: user.username,
    },
    {
      key: 'name',
      label: Translate({ id: 'react.user.name.label', defaultMessage: 'Name' }),
      value: user.name,
    },
    {
      key: 'email',
      label: Translate({ id: 'react.user.email.label', defaultMessage: 'Email' }),
      value: user.email,
    },
    {
      key: 'locale',
      label: Translate({ id: 'react.user.locale.label', defaultMessage: 'Locale' }),
      value: user.localeDisplayName,
    },
    {
      key: 'timezone',
      label: Translate({ id: 'react.user.timezone.label', defaultMessage: 'Timezone' }),
      value: user.timezone,
    },
    {
      key: 'roles',
      label: Translate({ id: 'react.user.roles.label', defaultMessage: 'Roles' }),
      value: user.roles?.length
        ? user.roles.map((role) => role.name).join(', ')
        : (
          <span className="text-muted">
            <Translate id="react.user.noAccess.label" defaultMessage="No access" />
          </span>
        ),
    },
    {
      key: 'locationRoles',
      label: Translate({ id: 'react.user.locationRoles.label', defaultMessage: 'Location Roles' }),
      value: user.locationRolesDescription || none,
    },
    {
      key: 'defaultLocation',
      label: Translate({ id: 'react.user.defaultLocation.label', defaultMessage: 'Default Location' }),
      value: user.defaultLocation?.name || none,
    },
    {
      key: 'rememberLastLocation',
      label: Translate({ id: 'react.user.rememberLastLocation.label', defaultMessage: 'Remember Last Location' }),
      value: user.rememberLastLocation ? `${user.rememberLastLocation}` : none,
    },
    {
      key: 'lastLoginDate',
      label: Translate({ id: 'react.user.lastLoginDate.label', defaultMessage: 'Last Login' }),
      value: formatDateTime(user.lastLoginDate) || never,
    },
    {
      key: 'lastUpdated',
      label: Translate({ id: 'react.user.lastUpdated.label', defaultMessage: 'Last Updated' }),
      value: formatDateTime(user.lastUpdated) || never,
    },
    {
      key: 'dateCreated',
      label: Translate({ id: 'react.user.dateCreated.label', defaultMessage: 'Date Created' }),
      value: formatDateTime(user.dateCreated) || never,
    },
  ] : [];

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
          <Button
            label="react.user.createUser.header.label"
            defaultLabel="Create User"
            onClick={() => { window.location.href = USER_URL.create(); }}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      {user && (
        <div className="p-3">
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
          <table className="table table-sm w-50" data-testid="user-details-table">
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td className="font-weight-bold">{row.label}</td>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="d-flex">
            <Button
              label="react.default.button.edit.label"
              defaultLabel="Edit"
              onClick={() => { window.location.href = USER_URL.edit(id); }}
            />
            <Button
              variant="secondary"
              label="react.user.changePhoto.header.label"
              defaultLabel="Change Photo"
              onClick={() => { window.location.href = USER_URL.changePhoto(id); }}
            />
            {isSuperuser && user.active && (
              <Button
                variant="secondary"
                label="react.user.impersonate.label"
                defaultLabel="Impersonate"
                onClick={() => { window.location.href = USER_URL.impersonate(id); }}
              />
            )}
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default UserShow;
