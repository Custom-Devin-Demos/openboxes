import React, { useEffect, useState } from 'react';

import { useParams } from 'react-router-dom';

import userApi from 'api/services/UserApi';
import Button from 'components/form-elements/Button';
import Checkbox from 'components/form-elements/v2/Checkbox';
import SelectField from 'components/form-elements/v2/SelectField';
import TextInput from 'components/form-elements/v2/TextInput';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { USER_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import RoleType from 'consts/roleType';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import useUserHasPermissions from 'hooks/useUserHasPermissions';
import confirmationModal from 'utils/confirmationModalUtils';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const TABS = [
  { key: 'details-tab', labelId: 'react.user.details.label', defaultLabel: 'User Details' },
  { key: 'password-tab', labelId: 'react.user.changePassword.label', defaultLabel: 'Change Password' },
  { key: 'authorization-tab', labelId: 'react.user.authorization.label', defaultLabel: 'Authorization' },
];

const toOption = (option) => ({ ...option, value: option.id });

const UserEditForm = () => {
  useTranslation('user', 'default');
  const { id } = useParams();
  const spinner = useSpinner();
  const isUserAdmin = useUserHasPermissions({ minRequiredRole: RoleType.ROLE_ADMIN });

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('details-tab');
  const [localeOptions, setLocaleOptions] = useState([]);
  const [timezoneOptions, setTimezoneOptions] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);

  // User Details tab
  const [active, setActive] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [locale, setLocale] = useState(null);
  const [timezone, setTimezone] = useState(null);

  // Change Password tab
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  // Authorization tab
  const [defaultLocation, setDefaultLocation] = useState(null);
  const [rememberLastLocation, setRememberLastLocation] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);

  // Add Location Role form
  const [showLocationRoleForm, setShowLocationRoleForm] = useState(false);
  const [locationRoleLocation, setLocationRoleLocation] = useState(null);
  const [locationRoleRoles, setLocationRoleRoles] = useState([]);

  const applyUser = (userData, options = {}) => {
    setUser(userData);
    setActive(Boolean(userData.active));
    setEmail(userData.email ?? '');
    setUsername(userData.username ?? '');
    setFirstName(userData.firstName ?? '');
    setLastName(userData.lastName ?? '');
    const locales = options.localeOptions ?? localeOptions;
    setLocale(locales.find((option) => option.id === userData.locale) ?? null);
    const timezones = options.timezoneOptions ?? timezoneOptions;
    setTimezone(timezones.find((option) => option.id === userData.timezone) ?? null);
    const locations = options.locationOptions ?? locationOptions;
    setDefaultLocation(
      locations.find((option) => option.id === userData.defaultLocation?.id) ?? null,
    );
    setRememberLastLocation(Boolean(userData.rememberLastLocation));
    const roles = options.roleOptions ?? roleOptions;
    setSelectedRoles(
      (userData.roles ?? [])
        .map((role) => roles.find((option) => option.id === role.id))
        .filter(Boolean),
    );
  };

  const fetchUser = async (options = {}) => {
    const response = await userApi.getUser(id);
    applyUser(response.data.data, options);
  };

  useEffect(() => {
    spinner.show();
    Promise.all([
      userApi.getLocaleOptions(),
      userApi.getTimezoneOptions(),
      userApi.getLoginLocationOptions(),
      userApi.getRoleOptions(),
    ])
      .then(([locales, timezones, locations, roles]) => {
        const options = {
          localeOptions: (locales.data?.data ?? []).map(toOption),
          timezoneOptions: (timezones.data?.data ?? []).map(toOption),
          locationOptions: (locations.data?.data ?? []).map(toOption),
          roleOptions: (roles.data?.data ?? []).map(toOption),
        };
        setLocaleOptions(options.localeOptions);
        setTimezoneOptions(options.timezoneOptions);
        setLocationOptions(options.locationOptions);
        setRoleOptions(options.roleOptions);
        return fetchUser(options);
      })
      .catch(() => { window.location.href = USER_URL.list(); })
      .finally(() => spinner.hide());
  }, [id]);

  const notifyUpdated = () => {
    notification(NotificationType.SUCCESS)({
      message: Translate({
        id: 'react.user.photoUpdated.label',
        defaultMessage: `User ${id} updated`,
        data: { id },
      }),
    });
  };

  const onSubmitDetails = async (event) => {
    event.preventDefault();
    spinner.show();
    try {
      await userApi.updateUser(id, {
        version: user?.version,
        active,
        email,
        username,
        firstName,
        lastName,
        locale: locale?.id ?? '',
        timezone: timezone?.id ?? '',
      });
      notifyUpdated();
      await fetchUser();
    } finally {
      spinner.hide();
    }
  };

  const onSubmitPassword = async (event) => {
    event.preventDefault();
    spinner.show();
    try {
      await userApi.changePassword(id, { password, passwordConfirm });
      notifyUpdated();
      setPassword('');
      setPasswordConfirm('');
    } finally {
      spinner.hide();
    }
  };

  const onSubmitAuthorization = async (event) => {
    event.preventDefault();
    spinner.show();
    try {
      await userApi.updateUser(id, {
        version: user?.version,
        warehouse: defaultLocation?.id ?? '',
        rememberLastLocation,
        ...(isUserAdmin
          ? { roles: selectedRoles.length ? selectedRoles.map((role) => role.id) : ['null'] }
          : {}),
      });
      notifyUpdated();
      await fetchUser();
    } finally {
      spinner.hide();
    }
  };

  const onToggleActivation = async () => {
    spinner.show();
    try {
      await userApi.toggleActivation(id);
      notifyUpdated();
      await fetchUser();
    } finally {
      spinner.hide();
    }
  };

  const onSendTestEmail = async () => {
    spinner.show();
    try {
      const response = await userApi.sendTestEmail(id);
      notification(NotificationType.SUCCESS)({ message: response.data?.data });
    } finally {
      spinner.hide();
    }
  };

  const deleteUser = async (onClose) => {
    try {
      await userApi.deleteUser(id);
      window.location.href = USER_URL.list();
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
      onClick: () => deleteUser(onClose),
    },
  ]);

  const onDelete = () => confirmationModal({
    buttons: deleteConfirmationModalButtons,
    title: {
      label: 'react.default.areYouSure.label',
      default: 'Are you sure?',
    },
  });

  const onDeleteLocationRole = async (locationRoleId) => {
    spinner.show();
    try {
      await userApi.deleteLocationRole(id, locationRoleId);
      notifyUpdated();
      await fetchUser();
    } finally {
      spinner.hide();
    }
  };

  const onSaveLocationRole = async () => {
    spinner.show();
    try {
      await userApi.saveLocationRole(id, {
        location: locationRoleLocation?.id ?? '',
        roles: locationRoleRoles.map((role) => role.id),
      });
      notifyUpdated();
      setShowLocationRoleForm(false);
      setLocationRoleLocation(null);
      setLocationRoleRoles([]);
      await fetchUser();
    } finally {
      spinner.hide();
    }
  };

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.user.editUser.label',
          defaultMessage: 'Edit User',
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
            <div className="d-flex ml-auto">
              <Button
                variant="secondary"
                label="react.user.showUser.label"
                defaultLabel="Show User"
                onClick={() => { window.location.href = USER_URL.show(id); }}
              />
              <Button
                variant="secondary"
                label="react.user.changePhoto.header.label"
                defaultLabel="Change Photo"
                onClick={() => { window.location.href = USER_URL.changePhoto(id); }}
              />
              <Button
                variant="secondary"
                label={user.active ? 'react.user.deactivate.label' : 'react.user.activate.label'}
                defaultLabel={user.active ? 'Deactivate' : 'Activate'}
                onClick={onToggleActivation}
              />
              {isUserAdmin && (
                <Button
                  variant="secondary"
                  label="react.user.sendTestEmail.label"
                  defaultLabel="Send test email"
                  onClick={onSendTestEmail}
                />
              )}
              <Button
                variant="danger"
                label="react.default.button.delete.label"
                defaultLabel="Delete"
                onClick={onDelete}
              />
            </div>
          </div>
          <ul className="nav nav-tabs" role="tablist">
            {TABS.map((tab) => (
              <li className="nav-item" key={tab.key}>
                <a
                  href={`#${tab.key}`}
                  role="tab"
                  className={`nav-link ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={(event) => {
                    event.preventDefault();
                    setActiveTab(tab.key);
                  }}
                >
                  <Translate id={tab.labelId} defaultMessage={tab.defaultLabel} />
                </a>
              </li>
            ))}
          </ul>
          {activeTab === 'details-tab' && (
            <section id="details-tab" aria-label="User Details">
              <form className="pt-3 w-50" onSubmit={onSubmitDetails}>
                <div className="pt-2">
                  <Checkbox
                    id="active"
                    title={{ id: 'react.user.active.label', defaultMessage: 'Active' }}
                    value={active}
                    onChange={(event) => setActive(event.target.checked)}
                  />
                </div>
                <div className="pt-2">
                  <TextInput
                    title={{ id: 'react.user.email.label', defaultMessage: 'Email' }}
                    name="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <div className="pt-2">
                  <TextInput
                    title={{ id: 'react.user.username.label', defaultMessage: 'Username' }}
                    name="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                  />
                </div>
                <div className="pt-2">
                  <TextInput
                    title={{ id: 'react.user.firstName.label', defaultMessage: 'First Name' }}
                    name="firstName"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                  />
                </div>
                <div className="pt-2">
                  <TextInput
                    title={{ id: 'react.user.lastName.label', defaultMessage: 'Last Name' }}
                    name="lastName"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                  />
                </div>
                <div className="pt-2" data-testid="locale-select">
                  <SelectField
                    title={{ id: 'react.user.locale.label', defaultMessage: 'Locale' }}
                    name="locale"
                    options={localeOptions}
                    value={locale}
                    onChange={(selected) => setLocale(selected)}
                  />
                </div>
                <div className="pt-2" data-testid="timezone-select">
                  <SelectField
                    title={{ id: 'react.user.timezone.label', defaultMessage: 'Timezone' }}
                    name="timezone"
                    options={timezoneOptions}
                    value={timezone}
                    onChange={(selected) => setTimezone(selected)}
                  />
                </div>
                <div className="d-flex pt-3">
                  <Button
                    type="submit"
                    label="react.default.button.save.label"
                    defaultLabel="Save"
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
            </section>
          )}
          {activeTab === 'password-tab' && (
            <section id="password-tab" aria-label="Change Password">
              <form className="pt-3 w-50" onSubmit={onSubmitPassword}>
                <div className="pt-2">
                  <TextInput
                    type="password"
                    title={{ id: 'react.user.password.label', defaultMessage: 'Password' }}
                    name="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                <div className="pt-2">
                  <TextInput
                    type="password"
                    title={{ id: 'react.user.confirmPassword.label', defaultMessage: 'Confirm Password' }}
                    name="passwordConfirm"
                    value={passwordConfirm}
                    onChange={(event) => setPasswordConfirm(event.target.value)}
                  />
                </div>
                <div className="d-flex pt-3">
                  <Button
                    type="submit"
                    label="react.default.button.save.label"
                    defaultLabel="Save"
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
            </section>
          )}
          {activeTab === 'authorization-tab' && (
            <section id="authorization-tab" aria-label="Authorization">
              <form className="pt-3 w-50" onSubmit={onSubmitAuthorization}>
                <div className="pt-2" data-testid="default-location-select">
                  <SelectField
                    title={{ id: 'react.user.defaultLocation.label', defaultMessage: 'Default Location' }}
                    name="warehouse"
                    options={locationOptions}
                    value={defaultLocation}
                    onChange={(selected) => setDefaultLocation(selected)}
                  />
                </div>
                <div className="pt-2">
                  <Checkbox
                    id="rememberLastLocation"
                    title={{ id: 'react.user.rememberLastLocation.label', defaultMessage: 'Remember Last Location' }}
                    value={rememberLastLocation}
                    onChange={(event) => setRememberLastLocation(event.target.checked)}
                  />
                </div>
                {isUserAdmin && (
                  <div className="pt-2" data-testid="default-roles-select">
                    <SelectField
                      title={{ id: 'react.user.roles.label', defaultMessage: 'Roles' }}
                      name="roles"
                      multiple
                      options={roleOptions}
                      value={selectedRoles}
                      onChange={(selected) => setSelectedRoles(selected || [])}
                    />
                  </div>
                )}
                <div className="d-flex pt-3">
                  <Button
                    type="submit"
                    label="react.default.button.save.label"
                    defaultLabel="Save"
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
              {isUserAdmin && (
                <div className="pt-4 w-75">
                  <h3>
                    <Translate id="react.user.locationRoles.label" defaultMessage="Location Roles" />
                  </h3>
                  <table className="table table-sm" aria-label="Location Roles">
                    <thead>
                      <tr>
                        <th aria-label="Location"><Translate id="react.user.location.label" defaultMessage="Location" /></th>
                        <th aria-label="Role"><Translate id="react.user.role.label" defaultMessage="Role" /></th>
                        <th aria-label="Actions"><Translate id="react.default.actions.label" defaultMessage="Actions" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(user.locationRoles ?? []).map((locationRole) => (
                        <tr key={locationRole.id} className={locationRole.inactive ? 'text-muted' : ''}>
                          <td>{locationRole.location}</td>
                          <td>{locationRole.role}</td>
                          <td>
                            <Button
                              variant="transparent"
                              label="react.default.button.delete.label"
                              defaultLabel="Delete"
                              onClick={() => onDeleteLocationRole(locationRole.id)}
                            />
                          </td>
                        </tr>
                      ))}
                      {!(user.locationRoles ?? []).length && (
                        <tr>
                          <td colSpan="3" className="text-muted text-center">
                            <Translate id="react.default.none.label" defaultMessage="None" />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {!showLocationRoleForm && (
                    <Button
                      variant="secondary"
                      label="react.user.addLocationRoles.label"
                      defaultLabel="Add Location Roles"
                      onClick={() => setShowLocationRoleForm(true)}
                    />
                  )}
                  {showLocationRoleForm && (
                    <div className="w-75">
                      <div className="pt-2" data-testid="location-select">
                        <SelectField
                          title={{ id: 'react.user.location.label', defaultMessage: 'Location' }}
                          name="locationRoleLocation"
                          options={locationOptions}
                          value={locationRoleLocation}
                          onChange={(selected) => setLocationRoleLocation(selected)}
                        />
                      </div>
                      <div className="pt-2" data-testid="role-select">
                        <SelectField
                          title={{ id: 'react.user.role.label', defaultMessage: 'Role' }}
                          name="locationRoleRoles"
                          multiple
                          options={roleOptions}
                          value={locationRoleRoles}
                          onChange={(selected) => setLocationRoleRoles(selected || [])}
                        />
                      </div>
                      <div className="d-flex pt-3">
                        <Button
                          label="react.default.button.save.label"
                          defaultLabel="Save"
                          onClick={onSaveLocationRole}
                        />
                        <Button
                          variant="transparent"
                          label="react.default.button.cancel.label"
                          defaultLabel="Cancel"
                          onClick={() => setShowLocationRoleForm(false)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </PageWrapper>
  );
};

export default UserEditForm;
