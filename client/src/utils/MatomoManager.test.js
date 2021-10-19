import MatomoManager from './MatomoManager';

describe('MatomoManager', () => {
  const replaceState = jest.fn();
  const windowSpy = jest.spyOn(window, 'window', 'get');
  windowSpy.mockImplementation(() => ({
    history: {
      replaceState,
    },
    location: {
      hostname: 'www.cop.homeoffice.gov.uk',
      pathname: '/forms/test-form',
      port: '1234',
      protocol: 'https:',
    },
  }));
  const trackPageView = jest.fn();

  it('should not track page if form is not a wizard', () => {
    const formRef = {
      current: {
        formio: { component: { title: 'Test title' } },
      },
    };
    MatomoManager.trackWizardPage(formRef, trackPageView);
    expect(replaceState).not.toHaveBeenCalled();
    expect(trackPageView).not.toHaveBeenCalled();
  });

  it('should track page if form is a wizard', () => {
    const formRef = {
      current: {
        formio: { component: { title: 'Test title' }, wizard: {} },
      },
    };
    MatomoManager.trackWizardPage(formRef, trackPageView);
    expect(replaceState).toHaveBeenCalledWith(null, null, '/forms/test-form/test-title');
    expect(trackPageView).toHaveBeenCalledTimes(1);
  });
});
