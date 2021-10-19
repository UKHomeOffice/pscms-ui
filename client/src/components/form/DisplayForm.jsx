import React, { useContext, useEffect, useRef, useState } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { useMatomo } from '@datapunt/matomo-tracker-react';
import { Formio, Form } from 'react-formio';
import moment from 'moment';
import _ from 'lodash';
import PropTypes from 'prop-types';
import gds from '@ukhomeoffice/formio-gds-template';
import Loader from '@highpoint/react-loader-advanced';
import { BLACK, WHITE } from 'govuk-colours';
import { TeamContext } from '../../utils/TeamContext';
import { StaffIdContext } from '../../utils/StaffIdContext';
import { augmentRequest, interpolate } from '../../utils/formioSupport';
import Logger from '../../utils/logger';
import ApplicationSpinner from '../ApplicationSpinner';
import FileService from '../../utils/FileService';
import FormErrorsAlert from '../alert/FormErrorsAlert';
import SecureLocalStorageManager from '../../utils/SecureLocalStorageManager';
import './DisplayForm.scss';
import { CurrentGroupContext } from '../../utils/CurrentGroupContext';
import MatomoManager from '../../utils/MatomoManager';

Formio.use(gds);

const DisplayForm = ({
  form,
  handleOnCancel,
  handleOnCustomEvent,
  handleOnSubmit,
  interpolateContext,
  submitting,
  localStorageReference,
  existingSubmission,
}) => {
  const [augmentedSubmission, setAugmentedSubmission] = useState();
  const [errorAlert, setErrorAlert] = useState();
  const [hasFormChanged, setHasFormChanged] = useState(false);
  const formRef = useRef();
  const host = `${window.location.protocol}//${window.location.hostname}${
    window.location.port ? `:${window.location.port}` : ''
  }`;

  const { keycloak } = useKeycloak();
  const { trackPageView } = useMatomo();
  const {
    authServerUrl: url,
    realm,
    refreshToken,
    subject,
    token: accessToken,
    tokenParsed: {
      adelphi_number: adelphi,
      dateofleaving,
      delegate_email: delegateEmails,
      email,
      family_name: familyName,
      given_name: givenName,
      grade_id: gradeId,
      groups,
      line_manager_email: linemanagerEmail,
      location_id: defaultlocationid,
      name,
      phone,
      realm_access: { roles },
      team_id: teamid,
      session_state: sessionId,
    },
  } = keycloak;

  /* istanbul ignore next */
  Formio.baseUrl = host;
  Formio.projectUrl = host;
  Formio.plugins = [augmentRequest(keycloak, form.id)];

  const fileService = new FileService(keycloak);

  const [time, setTime] = useState({
    start: null,
    end: null,
    submitted: false,
  });

  const { currentGroup } = useContext(CurrentGroupContext);
  const { team } = useContext(TeamContext);
  const { staffId: staffid } = useContext(StaffIdContext);

  const contexts = {
    data: {
      environmentContext: {
        attachmentServiceUrl: '/files',
        operationalDataUrl: '/opdata',
        privateUiUrl: window.location.origin,
        referenceDataUrl: '/refdata',
        workflowUrl: '/camunda',
      },
      extendedStaffDetailsContext: {
        delegateEmails,
        email,
        linemanagerEmail,
        name,
      },
      keycloakContext: {
        accessToken,
        adelphi,
        email,
        familyName,
        givenName,
        gradeId,
        groups,
        locationId: defaultlocationid,
        phone,
        realm,
        refreshToken,
        roles,
        sessionId,
        subject,
        url,
      },
      shiftDetailsContext: {
        email,
        locationid: String(defaultlocationid),
        phone,
        roles,
        team: currentGroup,
        teamid,
        currentGroup,
        groups,
      },
      staffDetailsDataContext: {
        adelphi,
        dateofleaving,
        defaultlocationid,
        defaultteam: team,
        defaultteamid: teamid,
        email,
        firstname: givenName,
        gradeid: gradeId,
        locationid: defaultlocationid,
        phone,
        staffid,
        surname: familyName,
        teamid,
      },
      ...interpolateContext,
    },
  };

  const reformattedContexts = {
    keycloakContext: {
      accessToken: keycloak.token,
      refreshToken: keycloak.refreshToken,
      sessionId: keycloak.tokenParsed.session_state,
      email: keycloak.tokenParsed.email,
      givenName: keycloak.tokenParsed.given_name,
      familyName: keycloak.tokenParsed.family_name,
      subject: keycloak.subject,
      url: keycloak.authServerUrl,
      realm: keycloak.realm,
      roles: keycloak.tokenParsed.realm_access.roles,
      groups: keycloak.tokenParsed.groups,
    },
    ...contexts.data,
  };
  /*
   * augmentedSubmission is fed into the form (on the 'submission' prop) and pre-populates fields where possible.
   * interpolate() is used to pass the context objects to the parent form - this only applies to the parent form, not nested forms
   * Both augmentedSubmission and interpolate() pass context into the <Form> component
   * augmentedSubmission must have context included or it cannot pre-populate fields that rely on context.
   * We have kept interpolate() context to prevent any unwanted side effects of removing it from the parent form.
   */
  interpolate(form, { ...reformattedContexts });

  /* Storing users answers to retain them on page refresh:
   * Answers will persist on return to this page except
   * - when user has submitted the form
   * - or when user has gone to the Dashboard (answers are cleared there)
   * On pageload, once we have obtained the localStorageReference, we check if there is data for this form in localStorage
   * - if there is localStorage data, we use it to create the data for the submission prop for the <Form> component
   */
  useEffect(() => {
    if (!SecureLocalStorageManager.get(localStorageReference)) {
      setAugmentedSubmission(_.merge({ ...existingSubmission }, contexts));
      SecureLocalStorageManager.set(localStorageReference, augmentedSubmission);
    } else {
      const localData = SecureLocalStorageManager.get(localStorageReference);
      setAugmentedSubmission(_.merge({ ...localData }, contexts));
    }
  }, []);

  /*
   * The plugin below is required for when nested forms are present. These nested forms
   * require interpolation as they can also make reference to context
   */
  Formio.registerPlugin(
    {
      priority: 0,
      requestResponse(response) {
        return {
          ok: response.ok,
          json: () =>
            response.json().then((result) => {
              if (!Array.isArray(result) && _.has(result, 'display')) {
                interpolate(result, { ...reformattedContexts });
                return result;
              }
              return result;
            }),
          status: response.status,
          headers: response.headers,
        };
      },
    },
    'processSubFormInterpolation'
  );

  useEffect(() => {
    return () => {
      Formio.deregisterPlugin('processSubFormInterpolation');
    };
  }, []);

  useEffect(() => {
    if (form && form.name && time.end) {
      Logger.info({
        token: keycloak.token,
        path: `/form/${form.id}`,
        message: {
          log: time.submitted ? 'Form has been submitted' : 'Form has been cancelled',
          name: form.name,
          submitted: time.submitted,
          ...time,
          completionTimeInSeconds: moment
            .duration(moment(time.end).diff(moment(time.start)))
            .asSeconds(),
        },
      });
    }
  }, [time, keycloak.token, form]);

  const validate = (formInstance, data) => {
    if (!formInstance || !errorAlert) {
      return;
    }
    let instance;

    // eslint-disable-next-line no-underscore-dangle
    if (formInstance._form.display === 'wizard') {
      instance = formInstance.currentPage;
    } else {
      instance = formInstance;
    }

    if (instance && instance.isValid(data.value, true)) {
      setErrorAlert(null);
    } else {
      const errors = _.filter(
        errorAlert.errors,
        (error) => data.changed && error.component.key !== data.changed.component.key
      );

      if (errors.length === 0) {
        setErrorAlert(null);
      } else {
        setErrorAlert({
          type: 'form-error',
          errors,
          form: formRef.current,
        });
      }
    }
  };
  return (
    <Loader
      show={submitting}
      message={<ApplicationSpinner translationKey="submitting" colour={BLACK} />}
      foregroundStyle={{ color: BLACK }}
      backgroundStyle={{ backgroundColor: WHITE }}
    >
      {errorAlert && <FormErrorsAlert errors={errorAlert.errors} form={errorAlert.form} />}
      <Form
        form={form}
        ref={formRef}
        onFormLoad={() => {
          const start = new Date();
          MatomoManager.trackWizardPage(formRef, trackPageView);
          setTime({
            ...time,
            start,
          });
        }}
        onNextPage={() => {
          MatomoManager.trackWizardPage(formRef, trackPageView);
          window.scrollTo(0, 0);
        }}
        onPrevPage={() => {
          MatomoManager.trackWizardPage(formRef, trackPageView);
          window.scrollTo(0, 0);
          setErrorAlert(null);
        }}
        submission={augmentedSubmission}
        onSubmit={(submissionData) => {
          setTime({
            ...time,
            end: new Date(),
            submitted: true,
          });
          handleOnSubmit(submissionData, localStorageReference);
        }}
        onChange={(data) => {
          // If we remove this set state the context does not load correctly
          setHasFormChanged(!hasFormChanged);
          if (formRef.current) {
            validate(formRef.current.formio, data);
          }
          SecureLocalStorageManager.set(localStorageReference, {
            data: data.data,
            metadata: data.metadata,
          });
        }}
        {...(handleOnCustomEvent ? { onCustomEvent: handleOnCustomEvent } : null)}
        onError={(errors) => {
          window.scrollTo(0, 0);
          setErrorAlert({
            type: 'form-error',
            errors,
            form: formRef.current,
          });
        }}
        options={{
          breadcrumbSettings: {
            clickable: false,
          },
          noAlerts: true,
          fileService,
          hooks: {
            beforeCancel: () => {
              setTime({
                ...time,
                end: new Date(),
                submitted: false,
              });
              handleOnCancel();
            },
            buttonSettings: {
              showCancel: true,
            },
            customValidation: (submissionData, next) => {
              /* eslint-disable no-param-reassign, no-shadow */
              const { versionId, id, title, name } = form;
              submissionData.data.form = {
                formVersionId: versionId,
                formId: id,
                title,
                name,
                submissionDate: new Date(),
                submittedBy: keycloak.tokenParsed.email,
              };
              // processContext, taskContext, keycloakContext and staffDetailsDataContext not needed in request payload
              delete submissionData.data.processContext;
              delete submissionData.data.taskContext;
              delete submissionData.data.keycloakContext;
              delete submissionData.data.staffDetailsDataContext;
              /* eslint-enable no-param-reassign, no-shadow */
              next();
            },
          },
        }}
      />
    </Loader>
  );
};

DisplayForm.defaultProps = {
  handleOnCustomEvent: null,
  interpolateContext: null,
  submitting: false,
  existingSubmission: {},
};

DisplayForm.propTypes = {
  form: PropTypes.shape({
    name: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    versionId: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    components: PropTypes.arrayOf(PropTypes.object).isRequired,
  }).isRequired,
  handleOnCancel: PropTypes.func.isRequired,
  handleOnCustomEvent: PropTypes.func,
  handleOnSubmit: PropTypes.func.isRequired,
  interpolateContext: PropTypes.shape({ taskContext: PropTypes.shape() }),
  submitting: PropTypes.bool,
  localStorageReference: PropTypes.string.isRequired,
  existingSubmission: PropTypes.shape({ data: PropTypes.shape() }),
};

export default DisplayForm;
