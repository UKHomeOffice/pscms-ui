import { map, lazy, mount, route, redirect } from 'navi';
import React from 'react';
import { withAuthentication } from './utils';
import AccessibilityStatement from '../components/AccessibilityStatement';
import PrivacyAndCookiePolicy from '../components/PrivacyAndCookiePolicy';
import NewAccountPage from '../pages/account/NewAccountPage';
import ExistingAccountPage from '../pages/account/ExistingAccountPage';
import Confirmation from '../pages/forms/Confirmation';

function redirectUser(request, context, active, userCreateAnAccount) {
  const parseUserCreateAnAccount = userCreateAnAccount === 'true';
  const userNoAccount = !active && !parseUserCreateAnAccount;

  const navigateToDashboard = active && !parseUserCreateAnAccount;
  const userHasAccount = active && parseUserCreateAnAccount;
  const navigateToCreateAnAccount = !active && parseUserCreateAnAccount;

  if (userNoAccount) {
    return redirect('/new-account');
  }
  if (navigateToDashboard) {
    return request.params.redirectTo
      ? redirect(decodeURIComponent(request.params.redirectTo))
      : route({
          title: context.t('pages.home.title'),
          getView: () => import('../pages/home'),
        });
  }
  if (userHasAccount) {
    return redirect('/existing-account');
  }
  if (navigateToCreateAnAccount) {
    return redirect('/forms/createAccount');
  }

  return route({
    title: context.t('pages.home.title'),
    getView: () => import('../pages/home'),
  });
}
const routes = mount({
  '/': map((request, context) =>
    context.isAuthenticated
      ? redirectUser(request, context, context.active, request.params.createaccount)
      : redirect(`/login?redirectTo=${encodeURIComponent(request.mountpath + request.search)}`)
  ),
  '/accessibility-statement': map((request, context) =>
    route({
      title: context.t('pages.accessibility.title'),
      view: <AccessibilityStatement />,
    })
  ),
  '/privacy-and-cookie-policy': map((request, context) =>
    route({
      title: context.t('pages.privacy.title'),
      view: <PrivacyAndCookiePolicy />,
    })
  ),
  '/forms': lazy(() => import('../pages/forms/routes')),
  '/submit-a-form': lazy(() => import('../pages/forms/routes')),
  '/reports': lazy(() => import('../pages/reports/routes')),
  '/targets': lazy(() => import('../pages/targets/routes')),
  '/tasks': lazy(() => import('../pages/tasks/routes')),
  '/cases': lazy(() => import('../pages/cases/routes')),
  '/logout': map((request, context) =>
    withAuthentication(
      route({
        title: context.t('logout'),
        getView: () => import('../components/header/Logout'),
      })
    )
  ),
  '/login': map(async (request, context) =>
    context.isAuthenticated
      ? redirect(request.params.redirectTo ? decodeURIComponent(request.params.redirectTo) : '/')
      : lazy(() => import('../pages/home/LoginPage'))
  ),
  '/new-account': map((request, context) =>
    context.active
      ? redirect('/')
      : route({
          title: context.t('pages.new-account.title'),
          view: <NewAccountPage key={`na-${Date.now()}`} />,
        })
  ),
  '/existing-account': map((request, context) =>
    route({
      title: context.t('pages.existing-account.title'),
      view: <ExistingAccountPage />,
    })
  ),
  '/confirmation-page': map((request, context) =>
    context.isAuthenticated
      ? route({
          title: context.t('pages.confirmation-page.title'),
          view: <Confirmation reference={request.params.ref} />,
        })
      : redirect(`/login?redirectTo=${encodeURIComponent(request.mountpath + request.search)}`)
  ),
});

export default routes;
