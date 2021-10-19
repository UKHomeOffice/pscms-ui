import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { Formio, Form } from 'react-formio';
import gds from '@ukhomeoffice/formio-gds-template';
import { useKeycloak } from '@react-keycloak/web';
import { augmentRequest, interpolate } from '../../../utils/formioSupport';
import { useAxios, useIsMounted } from '../../../utils/hooks';
import { TeamContext } from '../../../utils/TeamContext';
import { StaffIdContext } from '../../../utils/StaffIdContext';
import FileService from '../../../utils/FileService';
import { CurrentGroupContext } from '../../../utils/CurrentGroupContext';
import { caseActionFormPrepopulateKey } from '../../../utils/constants';
import latestFormDataPath from '../utils/LatestFormDataPath';

Formio.use(gds);

const CaseAction = ({
  selectedAction,
  businessKey,
  selectedActionId,
  selectedActionCompletionMessage,
  getCaseDetails,
  selectedActionProcessId,
}) => {
  const axiosInstance = useAxios();
  const isMounted = useIsMounted();
  const [submitting, setSubmitting] = useState(false);
  const [submissionConfirmation, showSubmissionConfirmation] = useState(false);
  const [form, setForm] = useState({
    isLoading: false,
    data: null,
  });
  const [latestFormData, setLatestFormData] = useState(null);
  const { keycloak } = useKeycloak();
  const host = `${window.location.protocol}//${window.location.hostname}${
    window.location.port ? `:${window.location.port}` : ''
  }`;

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

  const { team } = useContext(TeamContext);
  const { staffId: staffid } = useContext(StaffIdContext);
  const { currentGroup } = useContext(CurrentGroupContext);

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
        // Coorce location id to a string in line with v1
        locationid: String(defaultlocationid),
        phone,
        roles,
        team: currentGroup,
        teamid,
        groups,
        currentGroup,
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
      caseDetails: {
        businessKey,
      },
      businessKey,
    },
  };

  const handleOnSubmit = async (dataToSubmit, formToSubmit) => {
    setForm({
      isLoading: false,
      data: null,
    });
    const variables = {
      [formToSubmit.name]: {
        value: JSON.stringify(dataToSubmit.data),
        type: 'json',
      },
      initiatedBy: {
        value: dataToSubmit.data.form.submittedBy,
        type: 'string',
      },
    };
    try {
      await axiosInstance.post(
        `/camunda/engine-rest/process-definition/key/${selectedActionId}/submit-form`,
        {
          variables,
          businessKey,
        }
      );
      setSubmitting(false);
      showSubmissionConfirmation(true);
      setTimeout(() => {
        getCaseDetails(businessKey);
      }, 5000);
    } catch (e) {
      setSubmitting(false);
    }
  };

  const fetchForm = async (formKey) => {
    try {
      setForm({
        isLoading: true,
      });
      const { data } = await axiosInstance.get(`/form/name/${formKey}`);
      if (isMounted.current) {
        setForm({
          isLoading: false,
          data,
        });
      }
    } catch (e) {
      if (isMounted.current) {
        setForm({
          isLoading: false,
          data: null,
        });
      }
    }
  };

  const fetchLatestFormData = async (formKey) => {
    try {
      const {
        data: { processInstances },
      } = await axiosInstance.get(`/camunda/cases/${businessKey}`);
      if (isMounted.current) {
        const dataPath = latestFormDataPath(processInstances, formKey);
        if (dataPath) {
          const { data } = await axiosInstance.get(
            `/camunda/cases/${businessKey}/submission?key=${dataPath}`
          );
          setLatestFormData(data);
        }
      }
    } catch (e) {
      if (isMounted.current) {
        setLatestFormData(null);
      }
    }
  };

  useEffect(() => {
    fetchForm(selectedAction);
    fetchLatestFormData(selectedAction);
  }, [axiosInstance, selectedAction]);

  useEffect(() => {
    if (form.data) {
      interpolate(form.data, {
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
      });
    }
  }, [form]);

  if (!form.isLoading && form.data) {
    const isPrepopulated = form.data.components.find((c) => c.key === caseActionFormPrepopulateKey);
    if (isPrepopulated) {
      contexts.data = {
        ...contexts.data,
        ...latestFormData,
      };
    }
  }

  return (
    <>
      {submitting && <div className="govuk-body">Submitting action...</div>}
      {submissionConfirmation && (
        <div className="govuk-panel govuk-panel--confirmation">
          <div
            id="completion-message"
            className="govuk-panel__body govuk-!-font-size-24 govuk-!-font-weight-bold"
          >
            {selectedActionCompletionMessage}
          </div>
        </div>
      )}
      {form.isLoading && <div className="govuk-body">Loading</div>}
      {!form.isLoading && form.data && (
        <Form
          form={form.data}
          submitting={submitting}
          onSubmit={(submissionData) => {
            setSubmitting(true);
            handleOnSubmit(submissionData, form.data);
          }}
          submission={{ ...contexts }}
          options={{
            noAlerts: true,
            breadcrumbSettings: {
              clickable: false,
            },
            fileService,
            hooks: {
              beforeSubmit: (submissionData, next) => {
                /* eslint-disable no-param-reassign, no-shadow */
                const { versionId, id, title, name } = form.data;
                submissionData.data.form = {
                  formVersionId: versionId,
                  formId: id,
                  title,
                  name,
                  submissionDate: new Date(),
                  submittedBy: keycloak.tokenParsed.email,
                  process: {
                    definitionId: selectedActionProcessId,
                  },
                };
                delete submissionData.data.processContext;
                delete submissionData.data.taskContext;
                delete submissionData.data.keycloakContext;
                delete submissionData.data.staffDetailsDataContext;
                delete submissionData.data.caseDetails;
                submissionData.data.caseBusinessKey = contexts.data.businessKey;
                submissionData.data.processKey = selectedActionId;
                submissionData.data.variableName = form.data.name;
                /* eslint-enable no-param-reassign, no-shadow */
                next();
              },
              beforeCancel: () => fetchLatestFormData(selectedAction),
            },
          }}
        />
      )}
    </>
  );
};

CaseAction.propTypes = {
  selectedAction: PropTypes.string.isRequired,
  selectedActionId: PropTypes.string.isRequired,
  selectedActionCompletionMessage: PropTypes.string.isRequired,
  businessKey: PropTypes.string.isRequired,
  selectedActionProcessId: PropTypes.string.isRequired,
  getCaseDetails: PropTypes.func.isRequired,
};

export default CaseAction;
