import React from 'react';
import PropTypes from 'prop-types';
import { Card,Statistic, Divider } from 'semantic-ui-react';
import {
  Grid,
  GridItem,
  Stack,
  StackItem,
  BlockText,
  Button,
  NrqlQuery,
  LineChart,BarChart,TableChart,PieChart,
  Spinner,
} from 'nr1';

export default class TopLevelKanbanDashboard extends React.Component {

  static propTypes = {
    // filterChange: PropTypes.func,
    accountId: PropTypes.number,
  }

  constructor(props){
    super(props);
  }

  renderDashboard(){
    const { accountId} = this.props;
    return (
      <>

            <Stack gapType={Stack.GAP_TYPE.EXTRA_LARGE} fullWidth>
                <Card.Group itemsPerRow={1}>
                  <Card>
                    <Card.Content textAlign="center">
                      <Card.Header>Total Projects</Card.Header>
                      <Card.Meta>Unique Project Keys</Card.Meta>
                      <Card.Description>
                          <NrqlQuery accountId={accountId} query="SELECT uniqueCount(projectName) as Projects FROM `JIRAEvent`  where projectName LIKE '%Kanban%' SINCE 3 months AGO">
                            {({ data }) => {
                                if (data) {
                                    return <Statistic size="tiny">
                                    <Statistic.Value>{data[0].data[0].y}</Statistic.Value>
                                    <Statistic.Label>Projects</Statistic.Label>
                                  </Statistic>;
                                }

                              return <></>;
                            }}
                        </NrqlQuery>
                      </Card.Description>
                    </Card.Content>
                  </Card>

                </Card.Group>
            </Stack>

            <Divider />

            <Grid spacingType={[Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE]}>

              <GridItem columnSpan={6}>
              <BlockText type={BlockText.SPACING_TYPE.PARAGRAPH}>Releases</BlockText>
              <NrqlQuery accountId={accountId} query= "select uniqueCount(issueKey) from JIRAEvent where projectName LIKE '%Kanban%' and fixVersionName IS NOT NULL since 3 months ago facet projectKey, fixVersionName, fixVersionReleaseDate">
                  {({ data }) => {
                      if (data) {
                          //data.forEach(({metadata}) => metadata.color = '#F00BA5');
                      }

                  return <BarChart fullWidth data={data} />;
                  }}
              </NrqlQuery>
              </GridItem>
              <GridItem columnSpan={5}>
              <BlockText type={BlockText.SPACING_TYPE.PARAGRAPH}>Open Critical Issues Count</BlockText>
              <NrqlQuery accountId={accountId} query= "select uniqueCount(issueKey) from (SELECT latest(projectName) as projectName, latest(issueDescription) as description, latest(issueStatus) as issueStatus, latest(issueStatusName) as issueStatusName , latest(created) as created, latest(issueType) as issueType, latest(issueSummary) as issueSummary , latest(priority) as priority FROM JIRAEvent limit MAX where projectName LIKE '%Kanban%' and (priority like 'P1%' or priority like 'P2%') facet issueKey) since 3 months ago where issueStatusName NOT IN ('Done', 'Complete') facet priority">
                  {({ data }) => {
                      if (data) {
                          //data.forEach(({metadata}) => metadata.color = '#F00BA5');
                      }

                  return <BarChart fullWidth data={data} />;
                  }}
              </NrqlQuery>
              </GridItem>
            </Grid>

            <Divider />

            <Grid spacingType={[Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE]}>

              <GridItem columnSpan={12}>
              <BlockText type={BlockText.SPACING_TYPE.PARAGRAPH}>Open Critical Issues Detail</BlockText>
              <NrqlQuery accountId={accountId} query= "select projectName, priority, issueKey, issueSummary, created, issueStatusName from (SELECT latest(projectName) as projectName, latest(issueDescription) as description, latest(issueStatus) as issueStatus, latest(issueStatusName) as issueStatusName , latest(created) as created, latest(issueType) as issueType, latest(issueSummary) as issueSummary , latest(priority) as priority FROM JIRAEvent limit MAX where projectName LIKE '%Kanban%' and (priority like 'P1%' or priority like 'P2%') facet issueKey) since 3 months ago where issueStatusName NOT IN ('Done', 'Complete') limit max">
                  {({ data }) => {
                      if (data) {
                          //data.forEach(({metadata}) => metadata.color = '#F00BA5');
                      }

                  return <TableChart fullWidth data={data} />;
                  }}
              </NrqlQuery>
              </GridItem>
            </Grid>

            <Divider />

            <Grid spacingType={[Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE]}>

              <GridItem columnSpan={6}>
              <BlockText type={BlockText.SPACING_TYPE.PARAGRAPH}>Open Critical Issues Detail</BlockText>
              <NrqlQuery accountId={accountId} query= "select uniqueCount(issueKey) from (select latest(issueKey) as issueKey, latest(issueStatusName) as issueStatusName, latest(issueStatus) as issueStatus, latest(projectName) as projectName from JIRAEvent where projectName LIKE '%Kanban%' facet projectName, issueKey limit max) since 3 months ago limit max facet issueStatus">
                  {({ data }) => {
                      if (data) {
                          //data.forEach(({metadata}) => metadata.color = '#F00BA5');
                      }

                  return <PieChart fullWidth data={data} />;
                  }}
              </NrqlQuery>
              </GridItem>

              <GridItem columnSpan={6}>
              <BlockText type={BlockText.SPACING_TYPE.PARAGRAPH}>Open Critical Issues Detail</BlockText>
              <NrqlQuery accountId={accountId} query= "SELECT average(`timeOpen`)/24 from JIRAEvent where projectName LIKE '%Kanban%' since 1 months ago TIMESERIES 1 day">
                  {({ data }) => {
                      if (data) {
                          //data.forEach(({metadata}) => metadata.color = '#F00BA5');
                      }

                  return <LineChart fullWidth data={data} />;
                  }}
              </NrqlQuery>
              </GridItem>

            </Grid>

          </>
    )
}

  render() {
    return (
      this.renderDashboard()
    )
  }

}