/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { useNavigation } from 'react-navi';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import _ from 'lodash';
import { useKeycloak } from '@react-keycloak/web';
import { Accordion } from 'govuk-frontend';
import { formatAddress, formatCategory, formatPerson } from './utils';
import { useAxios } from '../../utils/hooks';
import ApplicationSpinner from '../../components/ApplicationSpinner';
import './__styles__/TargetInfoPage.scss';

/*
 * Given the data being passed in is changable in it's
 * structure, we are disabling prop-types checking
 * for this file only
 */
const TargetInfoPage = ({ targetId }) => {
  const axiosInstance = useAxios();
  const { keycloak } = useKeycloak();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const source = axios.CancelToken.source();
  const currentUser = keycloak.tokenParsed.email;
  const [accordionData, setAccordionData] = useState();
  const [combinedTargetData, setCombinedTargetData] = useState();
  const [formName, setFormName] = useState();

  const getTargetData = async () => {
    try {
      const taskData = await axiosInstance({
        method: 'GET',
        url: `/camunda/engine-rest/task/${targetId}`,
        cancelToken: source.token,
      });

      const targetData = await axiosInstance({
        method: 'GET',
        url: '/camunda/engine-rest/variable-instance',
        cancelToken: source.token,
        params: {
          variableName: 'targetInformationSheet',
          processInstanceIdIn: taskData.data.processInstanceId,
          deserializeValues: false,
        },
      });

      const parsedTargetData = targetData.data.map((target) => {
        return {
          processInstanceId: target.processInstanceId,
          ...JSON.parse(target.value),
        };
      });

      setCombinedTargetData({
        assignee: taskData.data.assignee,
        processInstanceId: taskData.data.processInstanceId,
        taskId: targetId,
        ...parsedTargetData[0],
      });
    } catch (e) {
      setCombinedTargetData(null);
    }
  };

  const clearAccordionStorage = () => {
    _.forIn(window.sessionStorage, (value, key) => {
      if (_.startsWith(key, 'accordion-') === true) {
        window.sessionStorage.removeItem(key);
      }
    });
  };

  const formatDataFromArray = (dataSet, key) => {
    if (!dataSet || !key) {
      return null;
    }
    const valueList = dataSet.map((item) => item[key]);
    const stringList = valueList.join(', ');
    return stringList;
  };

  /*
   * The page is currently designed for RoRo TargetTask
   * as that is the only requirement we have for static content
   * once we have another example/requirement for a different
   * form, then we can refactor to extract the data formatting
   * out to a functional component,trigger the format from the
   * TaskPage and pass into this component just the pre-formatted
   * data
   */
  const roroData = combinedTargetData?.roro.details ? combinedTargetData.roro.details : 'notRoro';
  const nominalsData = roroData.checks?.map((check, i) => {
    const result = {
      item: `check${i}`,
      nominal: check.nominalType,
      comment: check.comments,
      system: formatDataFromArray(check?.checks, 'name'),
    };
    return result;
  });
  const warningData = combinedTargetData?.category
    ? `${t('pages.target.labels.warning-data')} ${formatCategory(combinedTargetData.category)}`
    : null;
  const leftPanelData = [
    {
      label: t('pages.target.labels.strategy'),
      value: roroData.strategy?.strategy,
    },
    {
      label: t('pages.target.labels.threat-indicators'),
      value: formatDataFromArray(combinedTargetData?.threatIndicators, 'userfacingtext'),
    },
    {
      label: t('pages.target.labels.selection-reasoning'),
      value: roroData.selectionReasoning,
    },
    {
      label: t('pages.target.labels.operation'),
      value: combinedTargetData?.operation,
    },
  ];
  const rightPanelData = [
    {
      label: t('pages.target.labels.targeting-hub'),
      value: 'unknown', // data not in dataset yet
    },
    {
      label: t('pages.target.labels.targeter'),
      value: 'unknown', // data not in dataset yet
    },
    {
      label: t('pages.target.labels.phone'),
      value: 'unknown', // data not in dataset yet
    },
    {
      label: t('pages.target.labels.interested-party'),
      value: 'unknown', // data not in dataset yet
    },
    {
      label: t('pages.target.labels.target-type'),
      value: 'unknown', // data not in dataset yet
    },
    {
      label: t('pages.target.labels.target-reference'),
      value: 'unknown', // data not in dataset yet
    },
  ];

  const formatAccordionData = () => {
    const formatPassengers = !roroData.passengers
      ? []
      : roroData.passengers.map((passenger, i) => {
          const result = {
            item: `${t('pages.target.labels.passenger.item')}${i}`,
            label: `${t('pages.target.labels.passenger.label')}: ${formatPerson(
              passenger.firstName,
              passenger.middleName,
              passenger.lastName,
              passenger.docNumber
            )}`,
            values: [
              {
                item: `${t('pages.target.labels.passenger.item')}${i}${t(
                  'pages.target.labels.nationality.item'
                )}`,
                label: t('pages.target.labels.nationality.label'),
                value: passenger?.nationality?.nationality,
              },
              {
                item: `${t('pages.target.labels.passenger.item')}${i}${t(
                  'pages.target.labels.date-of-birth.item'
                )}`,
                label: t('pages.target.labels.date-of-birth.label'),
                value: passenger?.dob,
              },
              {
                item: `${t('pages.target.labels.passenger.item')}${i}${t(
                  'pages.target.labels.sex.item'
                )}`,
                label: t('pages.target.labels.sex.label'),
                value: passenger?.sex?.name,
              },
              {
                item: `${t('pages.target.labels.passenger.item')}${i}${t(
                  'pages.target.labels.doc-type.item'
                )}`,
                label: t('pages.target.labels.doc-type.label'),
                value: passenger?.docType?.shortdescription,
              },
              {
                item: `${t('pages.target.labels.passenger.item')}${i}${t(
                  'pages.target.labels.doc-expiry.item'
                )}`,
                label: t('pages.target.labels.doc-expiry.label'),
                value: passenger?.docExpiry,
              },
            ],
          };
          return result;
        });
    const formatDriver = {
      item: t('pages.target.labels.driver.item'),
      label: `${t('pages.target.labels.driver.label')}: ${formatPerson(
        roroData.driver?.firstName,
        roroData.driver?.middleName,
        roroData.driver?.lastName,
        roroData.driver?.docNumber
      )}`,
      values: [
        {
          item: `${t('pages.target.labels.driver.item')}${t(
            'pages.target.labels.nationality.item'
          )}`,
          label: t('pages.target.labels.nationality.label'),
          value: roroData.driver?.nationality?.nationality,
        },
        {
          item: `${t('pages.target.labels.driver.item')}${t(
            'pages.target.labels.date-of-birth.item'
          )}`,
          label: t('pages.target.labels.date-of-birth.label'),
          value: roroData.driver?.dob,
        },
        {
          item: `${t('pages.target.labels.driver.item')}${t('pages.target.labels.sex.item')}`,
          label: t('pages.target.labels.sex.label'),
          value: roroData.driver?.sex?.name,
        },
        {
          item: `${t('pages.target.labels.driver.item')}${t('pages.target.labels.doc-type.item')}`,
          label: t('pages.target.labels.doc-type.label'),
          value: roroData.driver?.docType?.shortdescription,
        },
        {
          item: `${t('pages.target.labels.driver.item')}${t(
            'pages.target.labels.doc-expiry.item'
          )}`,
          label: t('pages.target.labels.doc-expiry.label'),
          value: roroData.driver?.docExpiry,
        },
      ],
    };
    const formatVehicle = {
      item: t('pages.target.labels.vehicle.item'),
      label: `${t('pages.target.labels.vehicle.label')}: ${roroData.vehicle?.registrationNumber}`,
      values: [
        {
          item: t('pages.target.labels.vehicle.make.item'),
          label: t('pages.target.labels.vehicle.make.label'),
          value: roroData.vehicle?.make,
        },
        {
          item: t('pages.target.labels.vehicle.model.item'),
          label: t('pages.target.labels.vehicle.model.label'),
          value: roroData.vehicle?.model,
        },
        {
          item: t('pages.target.labels.vehicle.colour.item'),
          label: t('pages.target.labels.vehicle.colour.label'),
          value: roroData.vehicle?.colour,
        },
        {
          item: t('pages.target.labels.vehicle.reg-nationality.item'),
          label: t('pages.target.labels.vehicle.reg-nationality.label'),
          value: roroData.vehicle?.registrationNationality?.nationality,
        },
      ],
    };
    const formatTrailer = {
      item: t('pages.target.labels.trailer.item'),
      label: `${t('pages.target.labels.trailer.label')}: ${roroData.vehicle?.trailer?.regNumber}`,
      values: [
        {
          item: t('pages.target.labels.trailer.type.item'),
          label: t('pages.target.labels.trailer.type.label'),
          value: roroData.vehicle?.trailer?.type?.name,
        },
        {
          item: t('pages.target.labels.trailer.reg-nationality.item'),
          label: t('pages.target.labels.trailer.reg-nationality.label'),
          value: roroData.vehicle?.trailer?.registrationNationality?.nationality,
        },
      ],
    };
    const formatConsignment = {
      item: t('pages.target.labels.consignment.item'),
      label: t('pages.target.labels.consignment.label'),
      values: [
        {
          item: t('pages.target.labels.consignment.manifested-load.item'),
          label: t('pages.target.labels.consignment.manifested-load.label'),
          value: roroData.load?.manifestedLoad,
        },
        {
          item: t('pages.target.labels.consignment.manifested-weight.item'),
          label: t('pages.target.labels.consignment.manifested-weight.label'),
          value: roroData.load?.manifestWeight,
        },
        {
          item: t('pages.target.labels.consignment.consignor.item'),
          label: t('pages.target.labels.consignment.consignor.label'),
          value: roroData.consignor?.name,
        },
        {
          item: t('pages.target.labels.consignment.consignor-address.item'),
          label: t('pages.target.labels.consignment.consignor-address.label'),
          value: formatAddress(roroData.consignor?.address),
        },
        {
          item: t('pages.target.labels.consignment.consignee.item'),
          label: t('pages.target.labels.consignment.consignee.label'),
          value: roroData.consignee?.name,
        },
        {
          item: t('pages.target.labels.consignment.consignee-address.item'),
          label: t('pages.target.labels.consignment.consignee-address.label'),
          value: formatAddress(roroData.consignee?.address),
        },
        {
          item: t('pages.target.labels.consignment.haulier.item'),
          label: t('pages.target.labels.consignment.haulier.label'),
          value: roroData.haulier?.name,
        },
        {
          item: t('pages.target.labels.consignment.haulier-address.item'),
          label: t('pages.target.labels.consignment.haulier-address.label'),
          value: formatAddress(roroData.haulier?.address),
        },
      ],
    };

    setAccordionData([
      formatDriver,
      ...formatPassengers,
      formatVehicle,
      formatTrailer,
      formatConsignment,
    ]);
  };

  useEffect(() => {
    if (accordionData && roroData !== 'notRoro') {
      clearAccordionStorage();
      setFormName('Target details');
      new Accordion(document.getElementById('accordion-default')).init();
    }
  }, [accordionData]);

  useEffect(() => {
    if (combinedTargetData) {
      formatAccordionData();
    }
  }, [combinedTargetData]);

  useEffect(() => {
    getTargetData();
  }, [targetId, axiosInstance]);

  const claimTaskAndViewForm = async () => {
    await axiosInstance({
      method: 'POST',
      url: `/camunda/engine-rest/task/${targetId}/assignee`,
      cancelToken: source.token,
      data: {
        userId: currentUser,
      },
    }).then(() => navigation.navigate(`/tasks/${targetId}?fromContentPage=y`));
  };

  if (
    roroData !== 'notRoro' &&
    (!leftPanelData || !nominalsData || !warningData || !rightPanelData || !accordionData)
  ) {
    return <ApplicationSpinner />;
  }

  return (
    <>
      <h2 className="govuk-heading-xl">{formName}</h2>
      <div
        className="govuk-notification-banner"
        role="region"
        aria-labelledby="govuk-notification-banner-title"
        data-module="govuk-notification-banner"
      >
        <div className="govuk-notification-banner__header">
          <h3 className="govuk-notification-banner__title" id="govuk-notification-banner-title">
            {t('pages.target.banner-title')}
          </h3>
        </div>
        <div className="govuk-notification-banner__content">
          <p className="govuk-notification-banner__heading">{t('pages.target.banner-heading')}</p>
          <p className="govuk-body">{warningData}</p>
        </div>
      </div>
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-two-thirds">
          <h2 className="govuk-heading-m">{t('pages.target.left-panel.heading')}</h2>
          <dl className="govuk-summary-list govuk-!-margin-bottom-9">
            {leftPanelData.map((item) => {
              return (
                <div className="govuk-summary-list__row" key={item.label}>
                  <dt className="govuk-summary-list__key">{item.label}</dt>
                  <dd className="govuk-summary-list__value">{item.value}</dd>
                </div>
              );
            })}
          </dl>

          <table className="govuk-table">
            <caption className="govuk-table__caption govuk-!-font-weight-bold govuk-!-font-size-24">
              {t('pages.target.left-panel.section-heading')}
            </caption>
            <thead className="govuk-table__head">
              <tr className="govuk-table__row">
                <th scope="col" className="govuk-table__header govuk-!-font-weight-bold">
                  {t('pages.target.left-panel.table-heading-col-one')}
                </th>
                <th scope="col" className="govuk-table__header govuk-!-font-weight-bold">
                  {t('pages.target.left-panel.table-heading-col-two')}
                </th>
                <th scope="col" className="govuk-table__header govuk-!-font-weight-bold">
                  {t('pages.target.left-panel.table-heading-col-three')}
                </th>
              </tr>
            </thead>
            <tbody className="govuk-table__body">
              {nominalsData?.map((nominal) => {
                return (
                  <tr className="govuk-table__row" key={nominal.item}>
                    <td className="govuk-table__cell">{nominal.nominal}</td>
                    <td className="govuk-table__cell">{nominal.system}</td>
                    <td className="govuk-table__cell">{nominal.comment}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {roroData === 'notRoro' ? (
            ''
          ) : (
            <div id="accordion-default" className="govuk-accordion" data-module="govuk-accordion">
              {accordionData &&
                accordionData.map((section) => {
                  return (
                    <div className="govuk-accordion__section" key={section.item}>
                      <div className="govuk-accordion__section-header">
                        <h2 className="govuk-accordion__section-heading">
                          <span
                            className="govuk-accordion__section-button"
                            id={`accordion-default-heading-${section.item}`}
                          >
                            {section.label}
                          </span>
                        </h2>
                      </div>
                      <div
                        id={`accordion-default-content-${section.item}`}
                        className="govuk-accordion__section-content"
                        aria-labelledby={`accordion-default-heading-${section.item}`}
                      >
                        <dl className="govuk-summary-list govuk-!-margin-bottom-9">
                          {section.values.map((item) => {
                            return (
                              <div className="govuk-summary-list__row" key={item.item}>
                                <dt className="govuk-summary-list__key">{item.label}</dt>
                                <dd className="govuk-summary-list__value accordion_item">
                                  {item.value}
                                </dd>
                              </div>
                            );
                          })}
                        </dl>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <div className="govuk-grid-column-one-third">
          {rightPanelData.map((item) => {
            return (
              <React.Fragment key={item.label}>
                <h2 className="govuk-heading-s govuk-!-margin-bottom-0">{item.label}</h2>
                <p className="govuk-body">{item.value}</p>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <p>
        {t('pages.target.claimed-statement')}: {combinedTargetData?.assignee || 'no one'}
      </p>
      <div className="govuk-button-group">
        <button type="button" className="govuk-button" onClick={claimTaskAndViewForm}>
          {t('pages.target.button-next')}
        </button>
        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
        <a
          href="#"
          onClick={async (e) => {
            e.preventDefault();
            await navigation.navigate('/');
          }}
          className="govuk-link"
        >
          {t('pages.target.button-cancel')}
        </a>
      </div>
    </>
  );
};

export default TargetInfoPage;
