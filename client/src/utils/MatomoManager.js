import { kebabCase } from 'lodash';

export default class MatomoManager {
  static trackWizardPage = (formRef, trackPageView) => {
    if (formRef.current?.formio?.wizard) {
      const pageId = kebabCase(formRef.current.formio.component.title);
      const formPath = window.location.pathname.split('/').slice(1, 3).join('/');
      const newPath = `/${formPath}/${pageId}`;
      window.history.replaceState(null, null, newPath);
      trackPageView();
    }
  };
}
