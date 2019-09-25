import _ from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import { addSubscriptions, adminOnly } from 'utils'
import { Container, Col, Row } from 'grid'
import { injectState, provideState } from 'reaclette'
import { isEmpty, map, orderBy } from 'lodash'
import { subscribeResourceCatalog } from 'xo'

import Page from '../page'
import Resource from './resource'

// ==================================================================

const HEADER = (
  <h2>
    <Icon icon='menu-hub' /> {_('hubPage')}
  </h2>
)

export default decorate([
  adminOnly,
  addSubscriptions({
    catalog: subscribeResourceCatalog({ filters: { hub: true } }),
  }),
  provideState({
    computed: {
      resources: (_, { catalog }) => {
        if (catalog !== undefined) {
          const _catalog = { ...catalog }
          delete _catalog._namespaces
          return orderBy(
            map(_catalog, (entry, namespace) => ({
              namespace,
              ...entry.xva,
            })),
            'name',
            'asc'
          )
        }
      },
    },
  }),
  injectState,
  ({ state: { resources } }) => (
    <Page header={HEADER} title='hubPage' formatTitle>
      <Container>
        <Row>
          {isEmpty(resources) ? (
            <Col>
              <h2 className='text-muted'>
                &nbsp; {_('vmNoAvailable')}
                <Icon icon='alarm' color='yellow' />
              </h2>
            </Col>
          ) : (
            resources.map(data => (
              <Col key={data.namespace} mediumSize={3}>
                <Resource {...data} />
              </Col>
            ))
          )}
        </Row>
      </Container>
    </Page>
  ),
])