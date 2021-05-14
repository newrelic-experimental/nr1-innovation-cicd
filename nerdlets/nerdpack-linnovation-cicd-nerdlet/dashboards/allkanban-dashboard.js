import React from 'react';
import PropTypes from 'prop-types';
import { Grid, GridItem } from 'nr1';
import Card from './card';
import Chart from './chart';

export default class AllKanbanDashboard extends React.Component {
  static propTypes = {
    accountId: PropTypes.number.isRequired,
  };

  constructor(props) {
    super(props);
  }

  renderDashboard() {
    const { accountId } = this.props;
    return (
      <>
        <div className="card__group__container">
          <Card
            title="Projects"
            subtitle="Unique Project Keys"
            sections={[
              {
                accountId,
                label: 'Projects',
                query:
                  "SELECT uniqueCount(projectName) as Projects FROM `JIRAEvent`  where projectName LIKE '%Kanban%' SINCE 3 months AGO",
              },
            ]}
          />
        </div>

        <div className="chart__group__container">
          <Grid>
            <GridItem columnSpan={6}>
              <Chart
                title="Releases"
                accountId={accountId}
                query="select uniqueCount(issueKey) from JIRAEvent where projectName LIKE '%Kanban%' and fixVersionName IS NOT NULL since 3 months ago facet projectKey, fixVersionName, fixVersionReleaseDate"
                type="bar"
              />
            </GridItem>
            <GridItem columnSpan={6}>
              <Chart
                title="Open Critical Issues Count"
                accountId={accountId}
                query="select uniqueCount(issueKey) from (SELECT latest(projectName) as projectName, latest(issueDescription) as description, latest(issueStatus) as issueStatus, latest(issueStatusName) as issueStatusName , latest(created) as created, latest(issueType) as issueType, latest(issueSummary) as issueSummary , latest(priority) as priority FROM JIRAEvent limit MAX where projectName LIKE '%Kanban%' and (priority like 'P1%' or priority like 'P2%') facet issueKey) since 3 months ago where issueStatusName NOT IN ('Done', 'Complete') facet priority"
                type="bar"
              />
            </GridItem>

            <GridItem columnSpan={12}>
              <Chart
                title="Open Critical Issues Detail"
                accountId={accountId}
                query="select projectName, priority, issueKey, issueSummary, created, issueStatusName from (SELECT latest(projectName) as projectName, latest(issueDescription) as description, latest(issueStatus) as issueStatus, latest(issueStatusName) as issueStatusName , latest(created) as created, latest(issueType) as issueType, latest(issueSummary) as issueSummary , latest(priority) as priority FROM JIRAEvent limit MAX where projectName LIKE '%Kanban%' and (priority like 'P1%' or priority like 'P2%') facet issueKey) since 3 months ago where issueStatusName NOT IN ('Done', 'Complete') limit max"
                type="table"
              />
            </GridItem>

            <GridItem columnSpan={6}>
              <Chart
                title="Open Critical Issues Breakdown"
                accountId={accountId}
                query="select uniqueCount(issueKey) from (select latest(issueKey) as issueKey, latest(issueStatusName) as issueStatusName, latest(issueStatus) as issueStatus, latest(projectName) as projectName from JIRAEvent where projectName LIKE '%Kanban%' facet projectName, issueKey limit max) since 3 months ago limit max facet issueStatus"
                type="pie"
              />
            </GridItem>

            <GridItem columnSpan={6}>
              <Chart
                title="Open Critical Issues Trend"
                accountId={accountId}
                query="SELECT average(`timeOpen`)/24 from JIRAEvent where projectName LIKE '%Kanban%' since 1 months ago TIMESERIES 1 day"
              />
            </GridItem>
          </Grid>
        </div>
      </>
    );
  }

  render() {
    return this.renderDashboard();
  }
}
