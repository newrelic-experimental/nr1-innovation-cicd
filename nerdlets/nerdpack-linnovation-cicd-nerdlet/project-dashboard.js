import React from 'react';
import PropTypes from 'prop-types';
import { Card,Statistic, Divider,Label,Table,Popup } from 'semantic-ui-react';
import {
  Grid,
  GridItem,
  Stack,
  StackItem,
  BlockText,
  Button,
  NrqlQuery, NerdGraphQuery,
  LineChart,BarChart,TableChart,PieChart,
  Spinner,
} from 'nr1';
const gqlQuery = require('./query');

export default class ProjectDashboard extends React.Component {

  static propTypes = {
    // filterChange: PropTypes.func,
    projectName: PropTypes.string,
    accountId: PropTypes.number,
    issueTypeSelected: PropTypes.array,
    codeRepoSelected: PropTypes.array
  }

  constructor(props){
    super(props);
    this.state = {
      loading: false,
      refinedStoryPointList: [],
      refinedStoryCount: 0,
      sprintVelocity: 0,
      planKeys: []
    }
  }

  async componentDidMount(){
      this.setState({loading: true});
      await this.getTransientProjectData();
      this.setState({loading: false});
  }

  async getTransientProjectData() {

    const { projectName, accountId, issueTypeSelected, codeRepoSelected } = this.props;
    var refinedStoryCount = 0;
    var refinedStoryPointList = [];
    var codeProjectKeys = [];
    var codeRepoNames = [];

    for(let repo of codeRepoSelected) {
      var temp = repo.split(".");
      codeProjectKeys.push(temp[0]);
      codeRepoNames.push(temp[1]);
    }
    var buildMappingNRQL = "select count(commit_status.key) as Plan_key from BitbucketEvent where eventName = 'repo:commit_status_updated' and `commit_status.state` = 'SUCCESSFUL' since 1 months ago limit max facet commit_status.key where repository.project.key in ('" + (codeProjectKeys && (codeProjectKeys.length > 0) ? codeProjectKeys.join("','") : "") + "'" + ") and repository.name in ('" + (codeRepoNames && (codeRepoNames.length > 0) ? codeRepoNames.join("','") : "") + "'" + ")";

    let buildMappingResults = await NerdGraphQuery.query({query: gqlQuery.runQuery(accountId, buildMappingNRQL)});
    buildMappingResults = (((((buildMappingResults || {}).data || {}).actor || {}).account || {}).nrql || {}).results || {};

    var planKeys = [];
    for (let key of buildMappingResults) {
      planKeys.push(key.facet);
    }

    let currentSprintResults = await NerdGraphQuery.query({query: gqlQuery.runQuery(accountId, gqlQuery.currentSprint(projectName))});
    let currentSprint = (((((((currentSprintResults || {}).data || {}).actor || {}).account || {}).nrql || {}).results || {})[0] || {})["latest.sprintName"];

    let refinedStoryResults = await NerdGraphQuery.query({query: gqlQuery.runQuery(accountId, gqlQuery.refinedStories(projectName, issueTypeSelected))});
    refinedStoryResults = (((((refinedStoryResults || {}).data || {}).actor || {}).account || {}).nrql || {}).results || {};

    for(let result of refinedStoryResults) {
      if(result["latest.sprintName"] != currentSprint) {
        refinedStoryPointList.push({
          issueKey: result.issueKey, 
          storyPoints: result["latest.storyPoints"],
          issueType: result["latest.issueType"]
        });
        refinedStoryCount += result["latest.storyPoints"];
      }
    }

    let sprintVelocityResults = await NerdGraphQuery.query({query: gqlQuery.runQuery(accountId, gqlQuery.sprintVelocity(projectName, currentSprint, issueTypeSelected))});
    var sprintVelocity = (((((((sprintVelocityResults || {}).data || {}).actor || {}).account || {}).nrql || {}).results || {})[0] || {}).Velocity;

    this.setState({refinedStoryPointList, refinedStoryCount, sprintVelocity, planKeys});

  }

  renderDashboard(){
    const { projectName, accountId, issueTypeSelected,codeRepoSelected } = this.props;
    const {refinedStoryPointList, refinedStoryCount, sprintVelocity,loading, planKeys} = this.state;

    var timeSpan = 90;
    var codeProjectKeys = [];
    var codeRepoNames = [];

    for(let repo of codeRepoSelected) {
      var temp = repo.split(".");
      codeProjectKeys.push(temp[0]);
      codeRepoNames.push(temp[1]);
    }

    var backloghealthcolor = 'black';

     var backloghealth = refinedStoryCount/sprintVelocity;
     if (backloghealth) {
        if (backloghealth >= 2) {
          backloghealthcolor = 'green';
        } else if (backloghealth < 2 && backloghealth > 1) {
          backloghealthcolor = 'yellow';
        } else {
          backloghealthcolor ='red';
        }
      }
    return (
      <>
            {issueTypeSelected.map(value => {
              return <Label key={value}>{value}</Label> 
            })}
            <Label>{timeSpan} Days</Label>
            <Divider />
            <Stack gapType={Stack.GAP_TYPE.EXTRA_LARGE} fullWidth>
                <Card.Group itemsPerRow={7}>
                  <Card>
                    <Card.Content textAlign="center">
                      <Card.Header>Total Issues</Card.Header>
                      <Card.Meta>Unique Issue Keys</Card.Meta>
                      <Card.Description>
                          <NrqlQuery accountId={accountId} query= {gqlQuery.totalIssues(projectName,issueTypeSelected,timeSpan)}>
                            {({ data }) => {
                                if (data) {

                                    return <Statistic size="tiny">
                                    <Statistic.Value>{data[0].data[0].y}</Statistic.Value>
                                    <Statistic.Label>Issues</Statistic.Label>
                                    <Statistic.Value>{data[1].data[0].y}</Statistic.Value>
                                    <Statistic.Label>Deleted</Statistic.Label>
                                  </Statistic>;
                                }
                              return <></>;
                            }}
                        </NrqlQuery>
                      </Card.Description>
                    </Card.Content>
                  </Card>

                  <Card>
                  <Card.Content textAlign="center">
                    <Card.Header>Bugs</Card.Header>
                    <Card.Meta>Total Bugs</Card.Meta>
                      <NrqlQuery accountId={accountId} query= {projectName ? "select uniqueCount(issueId) as 'Bugs' from JIRAEvent since " + timeSpan.toString() + "  days ago limit MAX where issueType = 'Bug' and projectName = '" + projectName + "'" : "select uniqueCount(issueId) as 'Bugs' from JIRAEvent since 1 month ago where issueType = 'Bug' limit MAX"}>
                            {({ data }) => {
                                if (data) {
                                    return <Statistic size="tiny">
                                    <Statistic.Value>{data[0].data[0].y}</Statistic.Value>
                                    <Statistic.Label>Bugs</Statistic.Label>
                                  </Statistic>;
                                }

                              return <></>;
                            }}
                      </NrqlQuery>
                    </Card.Content>
                  </Card>

                  <Card>
                    <Card.Content textAlign="center">
                    <Card.Header>Sprint Velocity</Card.Header>
                    <Card.Meta>Storypoints / # of Sprints</Card.Meta>
                     {loading ? <Spinner /> : <Statistic size="tiny">
                        <Statistic.Value>{sprintVelocity ? sprintVelocity.toFixed(2) : 0}</Statistic.Value>
                        <Statistic.Label>Sprint Velocity</Statistic.Label>
                      </Statistic>}
                    </Card.Content>
                  </Card>

                  <Card>
                    <Card.Content textAlign="center">
                    <Card.Header>Issue Completion</Card.Header>
                    <Card.Meta>Completion Statistics</Card.Meta>
                    <Card.Description>
                      <NrqlQuery accountId={accountId} query= {"SELECT uniqueCount(issueKey) as 'Issues' from JIRAEvent since " + timeSpan.toString() + "  days ago where issueStatusName in ('Done','Complete') and timestamp > 1592870400000 and issueType in (" + "'" + issueTypeSelected.join("','") + "'" + ") and projectName = '" + projectName + "'"}>
                            {({ data }) => {
                                if (data) {
                                    return <Statistic size="tiny">
                                    <Statistic.Value>{data[0].data[0].y}</Statistic.Value>
                                    <Statistic.Label>Issues</Statistic.Label>
                                  </Statistic>;
                                }

                              return <></>;
                            }}
                      </NrqlQuery>
                      </Card.Description>
                      </Card.Content>
                  </Card>
                  <Card>
                    <Card.Content textAlign="center">
                    <Card.Header>Issue Completion</Card.Header>
                    <Card.Meta>Completed Time</Card.Meta>
                    <Card.Description>
                      <NrqlQuery accountId={accountId} query= {"SELECT average(`timeOpen`) / 24 as 'Days' from JIRAEvent since " + timeSpan.toString() + "  days ago where issueStatusName in ('Done','Complete') and issueType in (" + "'" + issueTypeSelected.join("','") + "'" + ") and projectName = '" + projectName + "' and timestamp > 1592870400000 and sprintEndDate <= timestamp"}>
                            {({ data }) => {
                                if (data) {
                                    return <Statistic size="tiny">
                                    <Statistic.Value>{data[0].data[0].y ? (data[0].data[0].y).toFixed(2) : 0}</Statistic.Value>
                                    <Statistic.Label>Days</Statistic.Label>
                                  </Statistic>;
                                }

                              return <></>;
                            }}
                      </NrqlQuery>
                      </Card.Description>
                      </Card.Content>
                  </Card>
                  <Card>
                    <Card.Content textAlign="center">
                    <Card.Header>Code Repositories</Card.Header>
                    <Card.Meta>Assigned</Card.Meta>
                      <Card.Description>
                      <Statistic size="tiny">
                        <Statistic.Value>{codeRepoSelected ? codeRepoSelected.length : 0}</Statistic.Value>
                        <Statistic.Label>Repos</Statistic.Label>
                      </Statistic>
                      </Card.Description>
                    </Card.Content>
                  </Card>

                  <Card>
                    <Card.Content textAlign="center">
                    <Card.Header>Code Checkins</Card.Header>
                    <Card.Meta>refs_changed</Card.Meta>
                    <Card.Description>
                    <NrqlQuery accountId={accountId} query= {"SELECT count(*) from BitbucketEvent since 90 days ago limit max where ( pullRequest.toRef.displayId = 'master' or pullrequest.destination.branch.name = 'master') and (pullRequest.state = 'MERGED' or pullrequest.state = 'MERGED') where repository.project.key in ('" + (codeProjectKeys && (codeProjectKeys.length > 0) ? codeProjectKeys.join("','") : "") + "'" + ") and repository.name in ('" + (codeRepoNames && (codeRepoNames.length > 0) ? codeRepoNames.join("','") : "") + "'" + ")"}>
                            {({ data }) => {
                                if (data) {
                                    return <Statistic size="tiny">
                                    <Statistic.Value>{data[0].data[0].y ? (data[0].data[0].y).toFixed(0) : 0}</Statistic.Value>
                                    <Statistic.Label>Checkins</Statistic.Label>
                                  </Statistic>;
                                }

                              return <Statistic size="tiny">
                                    <Statistic.Value>0</Statistic.Value>
                                    <Statistic.Label>Checkins</Statistic.Label>
                                  </Statistic>;
                            }}
                      </NrqlQuery>
                      </Card.Description>
                      </Card.Content>
                  </Card>

                </Card.Group>
            </Stack>

            <Divider />

            <Stack gapType={Stack.GAP_TYPE.EXTRA_LARGE} directionType={Stack.DIRECTION_TYPE.HORIZONTAL} fullWidth>
                <StackItem>
                <Card.Group itemsPerRow={2}>
                  <Card fluid>
                  <Card.Content textAlign="center">
                    <Card.Header>Backlog Health</Card.Header>
                    <Card.Meta>Health of Pipeline</Card.Meta>
                    <Card.Description textAlign="center">
                        {loading ? <Spinner /> : <Statistic color={backloghealthcolor} size="small">
                          <Statistic.Value>{backloghealth.toFixed(2)}</Statistic.Value>
                            <Statistic.Label>Health</Statistic.Label>
                          </Statistic>}
                      </Card.Description>
                    </Card.Content>
                  </Card>
                  <Popup trigger={
                  <Card fluid>
                  <Card.Content textAlign="center">
                    <Card.Header>Refined Story Points</Card.Header>
                    <Card.Meta>Ready for delivery</Card.Meta>
                    <Card.Description textAlign="center">
                        {loading ? <Spinner /> : <Statistic size="small">
                          <Statistic.Value>{refinedStoryCount.toFixed(1)}</Statistic.Value>
                            <Statistic.Label>Points</Statistic.Label>
                          </Statistic>}
                      </Card.Description>
                    </Card.Content>
                  </Card>}>
                  <Popup.Header>Refined Story List</Popup.Header>
                  <Popup.Content>
                    <Table>
                      <Table.Header>
                        <Table.Row>
                          <Table.HeaderCell>Key</Table.HeaderCell>
                          <Table.HeaderCell>StoryPoints</Table.HeaderCell>
                          <Table.HeaderCell>Type</Table.HeaderCell>
                          </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {refinedStoryPointList.map((issue, index) => (
                          <Table.Row key={index}>
                            <Table.Cell>{issue.issueKey}</Table.Cell>
                            <Table.Cell>{issue.storyPoints}</Table.Cell>
                            <Table.Cell>{issue.issueType}</Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  </Popup.Content>
                  </Popup>           
                </Card.Group>
                </StackItem>
            </Stack>

            <Divider />

            <Grid spacingType={[Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE]}>

              <GridItem columnSpan={2}>
              <BlockText type={BlockText.SPACING_TYPE.PARAGRAPH}>Deployment Status</BlockText>
              <NrqlQuery accountId={accountId} query= {"select count(*) from xxwfs_bamboo_deployments facet DEPLOYMENT_STATE since 1 month ago limit max where plan_key in (" + "'" + planKeys.join("','") + "'" + ")"}>
                  {({ data }) => {
                      if (data) {
                          //data.forEach(({metadata}) => metadata.color = '#F00BA5');
                      }

                  return <BarChart data={data} />;
                  }}
              </NrqlQuery>
              </GridItem>
              <GridItem columnSpan={6}>
              <BlockText type={BlockText.SPACING_TYPE.PARAGRAPH}>Deployments by Environment</BlockText>
              <NrqlQuery accountId={accountId} query= {"SELECT count(*) as 'No. of Deployments' from xxwfs_bamboo_deployments since 30 days ago facet env_name limit max where plan_key in (" + "'" + planKeys.join("','") + "'" + ")" }>
                  {({ data }) => {
                      if (data) {
                          //data.forEach(({metadata}) => metadata.color = '#F00BA5');
                      }

                  return <PieChart fullWidth data={data} />;
                  }}
              </NrqlQuery>
              </GridItem>
              <GridItem columnSpan={4}>
              <BlockText type={BlockText.SPACING_TYPE.PARAGRAPH}>Deployments over Time</BlockText>
              <NrqlQuery accountId={accountId} query= {"SELECT count(*) as 'No. of Deployments' from xxwfs_bamboo_deployments facet env_name since 30 days ago TIMESERIES auto where plan_key in (" + "'" + planKeys.join("','") + "'" + ")"}>
                  {({ data }) => {
                      if (data) {
                          //data.forEach(({metadata}) => metadata.color = '#F00BA5');
                      }

                  return <LineChart data={data} />;
                  }}
              </NrqlQuery>
              </GridItem>
            </Grid>

            <Divider />

            <Grid spacingType={[Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE]}>

              <GridItem columnSpan={4}>
              <BlockText type={BlockText.SPACING_TYPE.PARAGRAPH}>Average Time Open</BlockText>
              <NrqlQuery accountId={accountId} query= {"SELECT average(`timeOpen`)/24 from JIRAEvent since " + timeSpan.toString() + " days ago TIMESERIES AUTO EXTRAPOLATE where issueType in (" + "'" + issueTypeSelected.join("','") + "'" + ") and projectName = '" + projectName + "'"}>
                  {({ data }) => {
                      if (data) {
                          //data.forEach(({metadata}) => metadata.color = '#F00BA5');
                      }

                  return <LineChart data={data} />;
                  }}
              </NrqlQuery>
              </GridItem>
              <GridItem columnSpan={4}>
              <BlockText type={BlockText.SPACING_TYPE.PARAGRAPH}>Issues Closed over Time</BlockText>
              <NrqlQuery accountId={accountId} query= {"SELECT average(`timeOpen`) / 24 from JIRAEvent since " + timeSpan.toString() + "  days ago TIMESERIES where issueStatus in ('Done','Complete') and issueType in (" + "'" + issueTypeSelected.join("','") + "'" + ") and projectName = '" + projectName + "'"}>
                  {({ data }) => {
                      if (data) {
                          //data.forEach(({metadata}) => metadata.color = '#F00BA5');
                      }

                  return <LineChart data={data} />;
                  }}
              </NrqlQuery>
              </GridItem>
              <GridItem columnSpan={4}>
              <BlockText type={BlockText.SPACING_TYPE.PARAGRAPH}>Story Points Completed over Time</BlockText>
              <NrqlQuery accountId={accountId} query= {"SELECT filter(sum(storyPoints), where issueStatus in ('Done','Complete')) as 'Story Points Completed' FROM JIRAEvent SINCE " + timeSpan.toString() + "  days ago TIMESERIES where projectName = '" + projectName + "'"}>
                  {({ data }) => {
                      if (data) {
                          //data.forEach(({metadata}) => metadata.color = '#F00BA5');
                      }

                  return <LineChart data={data} />;
                  }}
              </NrqlQuery>
              </GridItem>
            </Grid>
            <Divider />

            <Grid spacingType={[Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE]}>
              <GridItem columnSpan={4}>
              <BlockText type={BlockText.SPACING_TYPE.PARAGRAPH}>Members and Number of Sprints Involved In</BlockText>
              <NrqlQuery accountId={accountId} query= {"SELECT uniqueCount(sprintName) FROM JIRAEvent since " + timeSpan.toString() + "  days ago facet displayName limit 100 where sprintName not like '%@%' and projectName = '" + projectName + "'" }>
                  {({ data }) => {
                      if (data) {
                          //data.forEach(({metadata}) => metadata.color = '#F00BA5');
                      }

                  return <BarChart data={data} />;
                  }}
              </NrqlQuery>
              </GridItem>
              <GridItem columnSpan={4}>
              <BlockText type={BlockText.SPACING_TYPE.PARAGRAPH}>Average Time (Days) to Close</BlockText>
              <NrqlQuery accountId={accountId} query= {"SELECT average(`timeOpen`) / 24 from JIRAEvent since " + timeSpan.toString() + "  days ago facet priority where issueStatus in ('Done','Complete') and sprintName is not null and issueType in (" + "'" + issueTypeSelected.join("','") + "'" + ") and projectName = '" + projectName + "'"}>
                  {({ data }) => {
                      if (data) {
                          //data.forEach(({metadata}) => metadata.color = '#F00BA5');
                      }

                  return <BarChart data={data} />;
                  }}
              </NrqlQuery>
              </GridItem>

              <GridItem columnSpan={4}>
              <BlockText type={BlockText.SPACING_TYPE.PARAGRAPH}>Average Time (Days) to Close by Priority</BlockText>
              <NrqlQuery accountId={accountId} query= {"SELECT average(`timeOpen`) / 24 from JIRAEvent since " + timeSpan.toString() + "  days ago facet priority where issueStatus in ('Done','Complete') and sprintName is not null and issueType in (" + "'" + issueTypeSelected.join("','") + "'" + ") and projectName = '" + projectName + "'"}>
                  {({ data }) => {
                      if (data) {
                          //data.forEach(({metadata}) => metadata.color = '#F00BA5');
                      }

                  return <BarChart data={data} />;
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