// Global imports
import React from 'react';
import PropTypes from 'prop-types';

const Confirmation = ({ reference }) => {
  return (
    <>
      <div className="govuk-panel govuk-panel--confirmation">
        <h1 className="govuk-panel__title">Account created</h1>
        <div className="govuk-panel__body">COP reference:</div>
        <div className="govuk-panel__body">
          <strong>{reference}</strong>
        </div>
      </div>
      <p className="govuk-body">We have sent you a confirmation email.</p>
      <p className="govuk-body">
        <a href="/">Go to homepage</a>
      </p>
      <p className="govuk-body">
        Depending on how you created your account, select HMRC Stride or POISE when you sign in.
      </p>
      <h1 className="govuk-heading-l">If your details change</h1>
      <p className="govuk-body">
        You can go to your profile in COP and update your details at any time.
      </p>
    </>
  );
};

Confirmation.propTypes = {
  reference: PropTypes.string.isRequired,
};

export default Confirmation;
