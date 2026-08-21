import React, { useState } from 'react';

import { PERSONS } from 'api/urls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const CreatePersonPage = () => {
  useTranslation('person', 'default');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [createdPerson, setCreatedPerson] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const savePerson = (event) => {
    event.preventDefault();
    setErrorMessage('');
    setCreatedPerson(null);
    apiClient.post(PERSONS, { firstName, lastName, email })
      .then((response) => {
        setCreatedPerson(response.data.data);
        setFirstName('');
        setLastName('');
        setEmail('');
      })
      .catch((error) => {
        const message = error?.response?.data?.errorMessages?.join('; ')
          || error?.response?.data?.errorMessage;
        setErrorMessage(message || 'An unexpected error has occurred');
      });
  };

  return (
    <PageWrapper>
      <div className="p-3">
        <h1>
          <Translate id="react.person.addRecipient.header.label" defaultMessage="Add a new recipient" />
        </h1>
        {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
        {createdPerson && (
          <div className="alert alert-success">
            <Translate id="react.person.created.label" defaultMessage="Person created" />
            {': '}
            {createdPerson.name}
          </div>
        )}
        <form onSubmit={savePerson} style={{ maxWidth: '400px' }}>
          <div className="form-group">
            <label htmlFor="person-first-name">
              <Translate id="react.person.firstName.label" defaultMessage="First Name" />
            </label>
            <input
              id="person-first-name"
              className="form-control"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="person-last-name">
              <Translate id="react.person.lastName.label" defaultMessage="Last Name" />
            </label>
            <input
              id="person-last-name"
              className="form-control"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="person-email">
              <Translate id="react.person.email.label" defaultMessage="Email" />
            </label>
            <input
              id="person-email"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            <Translate id="react.default.button.save.label" defaultMessage="Save" />
          </button>
        </form>
      </div>
    </PageWrapper>
  );
};

export default CreatePersonPage;
