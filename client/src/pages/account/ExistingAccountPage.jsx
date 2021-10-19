import React from 'react';

const ExistingAccountPage = () => {
  return (
    <>
      <h1>You already have an account</h1>
      <p>We have found an account with your details.</p>
      <a className="govuk-button" href="/">
        Go to homepage
      </a>
    </>
  );
};

export default ExistingAccountPage;
