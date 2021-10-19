import React from 'react';
import { useTranslation } from 'react-i18next';

const TaskNoForm = () => {
  const { t } = useTranslation();
  return (
    <div className="govuk-warning-text">
      <span className="govuk-warning-text__icon" aria-hidden="true">
        !
      </span>
      <strong className="govuk-warning-text__text">
        <span className="govuk-warning-text__assistive">{t('warning')}</span>
        {t('pages.task.no-form')}
      </strong>
    </div>
  );
};

export default TaskNoForm;
