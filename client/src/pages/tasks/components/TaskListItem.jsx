import React, { useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import PropTypes from 'prop-types';
import { useKeycloak } from '@react-keycloak/web';
import { Link, useNavigation } from 'react-navi';
import { isOverDue } from './utils';
import { useAxios } from '../../../utils/hooks';
import './__styles__/TaskListItem.scss';

dayjs.extend(relativeTime);

const TaskListItem = ({ id, due, name, assignee, businessKey, taskType, pageType }) => {
  const axiosInstance = useAxios();
  const { keycloak } = useKeycloak();
  const navigation = useNavigation();
  const currentUser = keycloak.tokenParsed.email;
  const [unclaimActionMade, setUnclaimActionMade] = useState(false);

  const isAssigned = () => {
    if (!assignee || unclaimActionMade) {
      return 'Unassigned';
    }
    if (assignee === currentUser) {
      return 'Assigned to you';
    }
    return assignee;
  };
  const handleClaim = async () => {
    const source = axios.CancelToken.source();
    await axiosInstance({
      method: 'POST',
      url: `/camunda/engine-rest/task/${id}/assignee`,
      cancelToken: source.token,
      data: {
        userId: currentUser,
      },
    }).then(() => navigation.navigate(`/tasks/${id}`));
  };
  const handleUnclaim = async (e) => {
    const source = axios.CancelToken.source();
    e.persist();
    await axiosInstance({
      method: 'POST',
      url: `/camunda/engine-rest/task/${id}/unclaim`,
      cancelToken: source.token,
    }).then(() => {
      setUnclaimActionMade(true);
      e.target.blur();
    });
  };
  const canClaimTask = () => {
    if (assignee === null || assignee !== currentUser || unclaimActionMade) {
      return (
        <button type="submit" className="govuk-button" onClick={handleClaim}>
          Claim
        </button>
      );
    }
    return (
      <button type="submit" className="govuk-button" onClick={handleUnclaim}>
        Unclaim
      </button>
    );
  };

  return (
    <div className="govuk-grid-row govuk-!-margin-bottom-3">
      <div className="govuk-grid-column-one-half govuk-!-margin-bottom-3">
        <span className="govuk-caption-m">{businessKey}</span>
        <span className="govuk-!-font-size-19 govuk-!-font-weight-bold">
          <Link
            className="govuk-link govuk-!-font-size-19"
            href={pageType === 'infoTask' ? `/targets/${id}` : `/tasks/${id}`}
            aria-describedby={name}
          >
            {name}
          </Link>
        </span>
      </div>
      <div className="govuk-grid-column-one-half">
        <div className="govuk-grid-row">
          {taskType === 'groups' && (
            <>
              <div className="govuk-grid-column-one-third govuk-!-margin-bottom-3">
                {isOverDue(due)}
              </div>
              <div className="govuk-grid-column-one-third govuk-!-margin-bottom-3">
                <span className="govuk-!-font-size-19 govuk-!-font-weight-bold">
                  {isAssigned()}
                </span>
              </div>
              <div className="govuk-grid-column-one-third claim-task">{canClaimTask()}</div>
            </>
          )}
          {taskType === 'yours' && (
            <>
              <div className="govuk-grid-column-two-thirds govuk-!-margin-bottom-3">
                {isOverDue(due)}
              </div>
              <div className="govuk-grid-column-one-third claim-task">
                <button
                  type="submit"
                  id="actionButton"
                  className="govuk-button"
                  onClick={handleClaim}
                >
                  Action
                </button>
              </div>
            </>
          )}
          {taskType === 'targets' && (
            <>
              <div className="govuk-grid-column-one-third govuk-!-margin-bottom-3">
                {isOverDue(due)}
              </div>
              <div className="govuk-grid-column-one-third govuk-!-margin-bottom-3">
                <span className="govuk-!-font-size-19 govuk-!-font-weight-bold">
                  {isAssigned()}
                </span>
              </div>
              <div className="govuk-grid-column-one-third claim-task">{canClaimTask()}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

TaskListItem.defaultProps = {
  assignee: null,
};

TaskListItem.propTypes = {
  id: PropTypes.string.isRequired,
  due: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  assignee: PropTypes.string,
  businessKey: PropTypes.string.isRequired,
  taskType: PropTypes.string.isRequired,
  pageType: PropTypes.string.isRequired,
};

export default TaskListItem;
