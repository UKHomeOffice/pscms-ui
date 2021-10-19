import React from 'react';
import PropTypes from 'prop-types';

const PaginationButton = ({ isButtonDisabled, setPage, newPageValue, text }) => {
  const handleClick = (e) => {
    e.target.blur();
    setPage(newPageValue);
    window.scrollTo(0, 0);
  };

  return (
    <button
      type="submit"
      data-module="govuk-button"
      className={`govuk-button govuk-!-width-full ${
        isButtonDisabled ? 'govuk-button--disabled' : ''
      }`}
      disabled={isButtonDisabled ? 'disabled' : false}
      onClick={handleClick}
    >
      {text}
    </button>
  );
};

PaginationButton.propTypes = {
  isButtonDisabled: PropTypes.bool.isRequired,
  setPage: PropTypes.func.isRequired,
  newPageValue: PropTypes.number.isRequired,
  text: PropTypes.string.isRequired,
};

export default PaginationButton;
