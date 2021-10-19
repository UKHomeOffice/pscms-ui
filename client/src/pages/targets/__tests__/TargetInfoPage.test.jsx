import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import mockTargetInformationSheetData from '../__fixtures__/mockTargetInformationSheetData.json';
import TargetInfoPage from '../TargetInfoPage';

describe('TargetInfoPage', () => {
  const mockAxios = new MockAdapter(axios);
  const mockProps = { targetId: 123 };

  beforeEach(() => {
    mockAxios.reset();
  });

  const mockAxiosCalls = ({ taskData, targetData }) => {
    mockAxios
      .onGet('/camunda/engine-rest/task/123')
      .reply(200, taskData)
      .onGet('/camunda/engine-rest/variable-instance', {
        params: {
          variableName: 'targetInformationSheet',
          processInstanceIdIn: 'p123',
          deserializeValues: false,
        },
      })
      .reply(200, targetData);
  };

  // The below tests check that the RoRo data recieved is rendered with the correct text
  it('should render warning details', async () => {
    mockAxiosCalls({
      taskData: { assignee: 'test@email.com', processInstanceId: 'p123' },
      targetData: mockTargetInformationSheetData,
    });
    await waitFor(() => render(<TargetInfoPage {...mockProps} />));

    expect(screen.getByText('pages.target.banner-title')).toBeInTheDocument();
    expect(screen.getByText('pages.target.banner-heading')).toBeInTheDocument();
    expect(screen.getByText('pages.target.labels.warning-data B')).toBeInTheDocument();
  });

  it('should render left panel details', async () => {
    mockAxiosCalls({
      taskData: { assignee: 'test@email.com', processInstanceId: 'p123' },
      targetData: mockTargetInformationSheetData,
    });
    await waitFor(() => render(<TargetInfoPage {...mockProps} />));

    expect(screen.getByText('pages.target.left-panel.heading')).toBeInTheDocument();
    expect(screen.getByText('pages.target.labels.strategy')).toBeInTheDocument();
    expect(screen.getByText('Alcohol')).toBeInTheDocument();
    expect(screen.getByText('pages.target.labels.threat-indicators')).toBeInTheDocument();
    expect(screen.getByText('Paid by cash, Change of account (Diver)')).toBeInTheDocument();
    expect(screen.getByText('pages.target.labels.selection-reasoning')).toBeInTheDocument();
    expect(screen.getByText('Selection reason here')).toBeInTheDocument();
    expect(screen.getByText('pages.target.labels.operation')).toBeInTheDocument();
    expect(screen.getByText('Name goes here')).toBeInTheDocument();
  });

  it('should render nominal details', async () => {
    mockAxiosCalls({
      taskData: { assignee: 'test@email.com', processInstanceId: 'p123' },
      targetData: mockTargetInformationSheetData,
    });
    await waitFor(() => render(<TargetInfoPage {...mockProps} />));

    expect(screen.getByText('pages.target.left-panel.section-heading')).toBeInTheDocument();
    expect(screen.getByText('pages.target.left-panel.table-heading-col-one')).toBeInTheDocument();
    expect(screen.getByText('account')).toBeInTheDocument();
    expect(screen.getByText('pages.target.left-panel.table-heading-col-two')).toBeInTheDocument();
    expect(screen.getByText('Anti Fraud Information System')).toBeInTheDocument();
    expect(screen.getByText('pages.target.left-panel.table-heading-col-three')).toBeInTheDocument();
    expect(screen.getByText('Nominal type comments for testing')).toBeInTheDocument();
  });

  it('should render right panel details', async () => {
    mockAxiosCalls({
      taskData: { assignee: 'test@email.com', processInstanceId: 'p123' },
      targetData: mockTargetInformationSheetData,
    });
    await waitFor(() => render(<TargetInfoPage {...mockProps} />));

    const unknownInstances = screen.getAllByText('unknown');
    expect(unknownInstances.length).toBe(6);
    expect(screen.getByText('pages.target.labels.targeting-hub')).toBeInTheDocument();
    expect(screen.getByText('pages.target.labels.targeter')).toBeInTheDocument();
    expect(screen.getByText('pages.target.labels.phone')).toBeInTheDocument();
    expect(screen.getByText('pages.target.labels.interested-party')).toBeInTheDocument();
    expect(screen.getByText('pages.target.labels.target-type')).toBeInTheDocument();
    expect(screen.getByText('pages.target.labels.target-reference')).toBeInTheDocument();
  });

  it('should render accordion details', async () => {
    mockAxiosCalls({
      taskData: { assignee: 'test@email.com', processInstanceId: 'p123' },
      targetData: mockTargetInformationSheetData,
    });
    await waitFor(() => render(<TargetInfoPage {...mockProps} />));

    const nationalityInstances = screen.getAllByText('pages.target.labels.nationality.label');
    expect(nationalityInstances.length).toBe(3);
    const dateOfBirthInstances = screen.getAllByText('pages.target.labels.date-of-birth.label');
    expect(dateOfBirthInstances.length).toBe(3);
    const sexInstances = screen.getAllByText('pages.target.labels.sex.label');
    expect(sexInstances.length).toBe(3);
    const travelDocumentTypeInstances = screen.getAllByText('pages.target.labels.doc-type.label');
    expect(travelDocumentTypeInstances.length).toBe(3);
    const travelDocumentExpiryInstances = screen.getAllByText(
      'pages.target.labels.doc-expiry.label'
    );
    expect(travelDocumentExpiryInstances.length).toBe(3);

    expect(
      screen.getByText('pages.target.labels.driver.label: Fred Flintstone, 123456L')
    ).toBeInTheDocument();
    expect(screen.getByText('Australia')).toBeInTheDocument();
    expect(screen.getByText('13/10/1991')).toBeInTheDocument();
    expect(screen.getByText('Indeterminate')).toBeInTheDocument();
    expect(screen.getByText('ID Card')).toBeInTheDocument();
    expect(screen.getByText('29/10/2023')).toBeInTheDocument();

    expect(
      screen.getByText('pages.target.labels.passenger.label: Wilma Flintstone, 875786876')
    ).toBeInTheDocument();
    expect(screen.getByText('United Kingdom')).toBeInTheDocument();
    expect(screen.getByText('22/11/1991')).toBeInTheDocument();
    expect(screen.getByText('Female')).toBeInTheDocument();
    expect(screen.getByText('Passport')).toBeInTheDocument();
    expect(screen.getByText('22/03/2022')).toBeInTheDocument();

    expect(
      screen.getByText('pages.target.labels.passenger.label: Barney Rubble, 244746NL')
    ).toBeInTheDocument();
    expect(screen.getByText('Germany')).toBeInTheDocument();
    expect(screen.getByText('01/03/1989')).toBeInTheDocument();
    expect(screen.getByText('Male')).toBeInTheDocument();
    expect(screen.getByText('BRP Issued Card')).toBeInTheDocument();
    expect(screen.getByText('01/02/2021')).toBeInTheDocument();

    expect(screen.getByText('pages.target.labels.vehicle.label: EG-1234')).toBeInTheDocument();
    expect(screen.getByText('pages.target.labels.vehicle.make.label')).toBeInTheDocument();
    expect(screen.getByText('AUDI')).toBeInTheDocument();
    expect(screen.getByText('pages.target.labels.vehicle.model.label')).toBeInTheDocument();
    expect(screen.getByText('V9')).toBeInTheDocument();
    expect(screen.getByText('pages.target.labels.vehicle.colour.label')).toBeInTheDocument();
    expect(screen.getByText('WHITE')).toBeInTheDocument();
    expect(
      screen.getByText('pages.target.labels.vehicle.reg-nationality.label')
    ).toBeInTheDocument();
    expect(screen.getByText('Austria')).toBeInTheDocument();

    expect(screen.getByText('pages.target.labels.trailer.label: EG-1235')).toBeInTheDocument();
    expect(screen.getByText('pages.target.labels.trailer.type.label')).toBeInTheDocument();
    expect(screen.getByText('Bulk tipper')).toBeInTheDocument();
    expect(
      screen.getByText('pages.target.labels.trailer.reg-nationality.label')
    ).toBeInTheDocument();
    expect(screen.getByText('France')).toBeInTheDocument();

    expect(screen.getByText('pages.target.labels.consignment.consignor.label')).toBeInTheDocument();

    expect(screen.getByText('ABC Consignor')).toBeInTheDocument();
    expect(
      screen.getByText('pages.target.labels.consignment.consignor-address.label')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Consignor address 1 Consignor address 2 Consignor address city ABC 123 New Zealand'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('pages.target.labels.consignment.consignee.label')).toBeInTheDocument();
    expect(screen.getByText('consignee name')).toBeInTheDocument();
    expect(
      screen.getByText('pages.target.labels.consignment.consignee-address.label')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'consignee address 1 consignee address 2 consignee address city ABC 567 Japan'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('pages.target.labels.consignment.haulier.label')).toBeInTheDocument();
    expect(screen.getByText('Hauling Things')).toBeInTheDocument();
    expect(
      screen.getByText('pages.target.labels.consignment.haulier-address.label')
    ).toBeInTheDocument();
    expect(screen.getByText('123 Street London GB')).toBeInTheDocument();

    expect(
      screen.getByText('pages.target.labels.consignment.manifested-load.label')
    ).toBeInTheDocument();
    expect(screen.getByText('Wine')).toBeInTheDocument();
    expect(
      screen.getByText('pages.target.labels.consignment.manifested-weight.label')
    ).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });
});
