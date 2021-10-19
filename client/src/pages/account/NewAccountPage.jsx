import React from 'react';

const NewAccountPage = () => {
  return (
    <>
      <h1>You do not have an account</h1>
      <p>You need to create an account to use COP.</p>
      <a className="govuk-button" href="/forms/createAccount">
        Create account
      </a>
    </>
  );
};

export default NewAccountPage;
