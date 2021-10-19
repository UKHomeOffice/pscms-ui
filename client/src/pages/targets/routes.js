import { map, mount, route } from 'navi';
import React from 'react';
import { withAuthentication } from '../../routes/utils';
import TargetsListPage from './TargetsListPage';
import TargetInfoPage from './TargetInfoPage';

const routes = mount({
  '/': map((request, context) =>
    withAuthentication(
      route({
        title: context.t('pages.targets.title'),
        view: <TargetsListPage taskType="targets" />,
      })
    )
  ),
  '/:targetId': map((request, context) =>
    withAuthentication(
      route({
        title: context.t('pages.targets.title'),
        view: (
          <TargetInfoPage
            targetId={request.params.targetId}
            targetData={request.params.targetData}
          />
        ),
      })
    )
  ),
});

export default routes;
