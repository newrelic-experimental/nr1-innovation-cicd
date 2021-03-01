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
  LineChart,BarChart,
  Spinner,
} from 'nr1';

export default class TopLevelDashboard extends React.Component {

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
                <Card.Group itemsPerRow={6}>
                  <Card>
                    <Card.Content textAlign="center">
                      <Card.Header>Total Projects</Card.Header>
                      <Card.Meta>Unique Project Keys</Card.Meta>
                      <Card.Description>
                          <NrqlQuery accountId={accountId} query="SELECT uniqueCount(projectName) as Issues FROM `JIRAEvent` SINCE 1 month AGO">
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

                  <Card>
                  <Card.Content textAlign="center">
                    <Card.Header>Contributors</Card.Header>
                    <Card.Meta>Names Captured</Card.Meta>
                    <Card.Description textAlign="center">
                      <NrqlQuery accountId={accountId} query= "SELECT uniqueCount(displayName) FROM JIRAEvent since 1 month ago">
                        {({ data }) => {
                            if (data) {
                              return <Statistic size="small">
                                    <Statistic.Value>{data[0].data[0].y}</Statistic.Value>
                                    <Statistic.Label>Users</Statistic.Label>
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
                      <NrqlQuery accountId={accountId} query= "select uniqueCount(issueId) as 'Bugs' from JIRAEvent since 1 month ago where issueType = 'Bug' limit MAX">
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
                    <Card.Header>Sprints Captured</Card.Header>
                    <Card.Meta>Sprints</Card.Meta>
                    <NrqlQuery accountId={accountId} query= "SELECT uniqueCount(sprintName) FROM JIRAEvent  since 1 month ago">
                            {({ data }) => {
                                if (data) {
                                    return <Statistic size="tiny">
                                    <Statistic.Value>{data[0].data[0].y}</Statistic.Value>
                                    <Statistic.Label>Sprints</Statistic.Label>
                                  </Statistic>;
                                }
                              return <></>;
                            }}
                      </NrqlQuery>
                    </Card.Content>
                  </Card>

                  <Card>
                    <Card.Content textAlign="center">
                    <Card.Header>Issue Completion</Card.Header>
                    <Card.Meta>Completion Statistics</Card.Meta>
                    <Card.Description>
                      <NrqlQuery accountId={accountId} query= "SELECT uniqueCount(issueKey) as 'Issues' from JIRAEvent since 1 month ago where issueStatus in ('Done','Complete') and issueType in ('Story','Task')">
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
                      <NrqlQuery accountId={accountId} query= "SELECT average(`timeOpen`) / 24 as 'Days' from JIRAEvent since 1 month ago where issueStatus in ('Done','Complete') and issueType in ('Story', 'Task')">
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
                    <Card.Meta>Repos</Card.Meta>
                    <Card.Description>
                      <NrqlQuery accountId={accountId} query= "SELECT uniqueCount(repository.name) FROM BitbucketEvent  since 90 days ago">
                            {({ data }) => {
                                if (data) {
                                    return <Statistic size="tiny">
                                    <Statistic.Value>{data[0].data[0].y ? (data[0].data[0].y) : 0}</Statistic.Value>
                                    <Statistic.Label>Repos</Statistic.Label>
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
                    <Card.Header>Code Checkins</Card.Header>
                    <Card.Meta>refs_changed</Card.Meta>
                    <Card.Description>
                      <NrqlQuery accountId={accountId} query= "SELECT COUNT(*) from BitbucketEvent since 90 days ago limit max where ( pullRequest.toRef.displayId = 'master' or pullrequest.destination.branch.name = 'master' and (pullRequest.state = 'MERGED' or pullrequest.state = 'MERGED'))">
                            {({ data }) => {
                                if (data) {
                                    return <Statistic size="tiny">
                                    <Statistic.Value>{data[0].data[0].y ? (data[0].data[0].y) : 0}</Statistic.Value>
                                    <Statistic.Label>CheckIns</Statistic.Label>
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
                    <Card.Header>Bug to Story Percent</Card.Header>
                    <Card.Meta>Bugs/Stories</Card.Meta>
                    <Card.Description>
                      <NrqlQuery accountId={accountId} query= "SELECT filter(uniqueCount(issueKey), where issueType in ('Bug'))/filter(uniqueCount(issueKey), where issueType in ('Story','Task')) * 100 from JIRAEvent since 1 month ago">
                            {({ data }) => {
                                if (data) {
                                    return <Statistic size="tiny">
                                    <Statistic.Value>{data[0].data[0].y ? (data[0].data[0].y).toFixed(2) : 0}</Statistic.Value>
                                    <Statistic.Label>Percent</Statistic.Label>
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

              <GridItem columnSpan={4}>
              <BlockText type={BlockText.SPACING_TYPE.PARAGRAPH}>Bugs over Time</BlockText>
              <NrqlQuery accountId={accountId} query= "select uniqueCount(issueId) as 'Bugs' from JIRAEvent since 1 month ago where issueType = 'Bug' limit MAX TIMESERIES">
                  {({ data }) => {
                      if (data) {
                          //data.forEach(({metadata}) => metadata.color = '#F00BA5');
                      }

                  return <LineChart data={data} />;
                  }}
              </NrqlQuery>
              </GridItem>
              <GridItem columnSpan={4}>
              <BlockText type={BlockText.SPACING_TYPE.PARAGRAPH}>Checkins over Time</BlockText>
              <NrqlQuery accountId={accountId} query= "SELECT sum(changes) from BitbucketEvent since 1 month ago TIMESERIES">
                  {({ data }) => {
                      if (data) {
                          //data.forEach(({metadata}) => metadata.color = '#F00BA5');
                      }

                  return <LineChart data={data} />;
                  }}
              </NrqlQuery>
              </GridItem>
              <GridItem columnSpan={4}>
              <BlockText type={BlockText.SPACING_TYPE.PARAGRAPH}>Bugs vs Stories</BlockText>
              <NrqlQuery accountId={accountId} query= "SELECT filter(uniqueCount(issueKey), where issueType in ('Bug'))/filter(uniqueCount(issueKey), where issueType in ('Story','Task')) * 100 from JIRAEvent since 1 month ago TIMESERIES">
                  {({ data }) => {
                      if (data) {
                          //data.forEach(({metadata}) => metadata.color = '#F00BA5');
                      }

                  return <LineChart data={data} />;
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