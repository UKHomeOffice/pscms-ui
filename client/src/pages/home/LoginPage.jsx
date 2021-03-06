import React from 'react';
import { route, map } from 'navi';
import { useKeycloak } from '@react-keycloak/web';
import { useTranslation } from 'react-i18next';

export const LoginPage = () => {
  const { keycloak } = useKeycloak();
  const { t } = useTranslation();
  return (
    <div>
      <button type="button" className="govuk-button" onClick={() => keycloak.login()}>
        {t('pages.login.title')}
      </button>
    </div>
  );
};

export default map((request, context) =>
  route({
    title: context.t('pages.login.title'),
    view: <LoginPage />,
  })
);
