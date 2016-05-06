import _, { messages } from 'messages'
import Icon from 'icon'
import React, { Component } from 'react'
import { autobind } from 'utils'
import { fetchVmStats } from 'xo'
import { injectIntl } from 'react-intl'
import { Row, Col } from 'grid'
import {
  CpuLineChart,
  MemoryLineChart,
  VifLineChart,
  XvdLineChart
} from 'xo-line-chart'

export default injectIntl(
  class VmStats extends Component {
    constructor (props) {
      super(props)
      this.state = {}
    }

    @autobind
    loop (vm = this.props.vm) {
      if (this.cancel) {
        this.cancel()
      }

      if (vm.power_state !== 'Running') {
        return
      }

      let cancelled = false
      this.cancel = () => { cancelled = true }

      fetchVmStats(vm, this.state.granularity).then(stats => {
        if (cancelled) {
          return
        }
        this.cancel = null

        clearTimeout(this.timeout)
        this.setState({
          stats,
          selectStatsLoading: false
        }, () => {
          this.timeout = setTimeout(this.loop, stats.interval * 1000)
        })
      })
    }

    componentWillMount () {
      this.loop()
    }

    componentWillUnmount () {
      clearTimeout(this.timeout)
    }

    componentWillReceiveProps (props) {
      const vmCur = this.props.vm
      const vmNext = props.vm

      if (vmCur.power_state !== 'Running' && vmNext.power_state === 'Running') {
        this.loop(vmNext)
      } else if (vmCur.power_state === 'Running' && vmNext.power_state !== 'Running') {
        this.setState({
          stats: undefined
        })
      }
    }

    @autobind
    handleSelectStats (event) {
      const granularity = event.target.value
      clearTimeout(this.timeout)

      this.setState({
        granularity,
        selectStatsLoading: true
      }, this.loop)
    }

    render () {
      const {
        intl
      } = this.props
      const {
        granularity,
        selectStatsLoading,
        stats
      } = this.state

      return !stats
        ? <p>No stats.</p>
        : <div>
          <Row>
            <Col smallSize={6} className='text-xs-right'>
              {selectStatsLoading && <Icon icon='loading' size={2} />}
            </Col>
            <Col smallSize={6}>
              <div className='btn-tab'>
                <select className='form-control' onChange={this.handleSelectStats} defaultValue={granularity} >
                  <option value='seconds'>{intl.formatMessage(messages.statLastTenMinutes)}</option>
                  <option value='minutes'>{intl.formatMessage(messages.statLastTwoHours)}</option>
                  <option value='hours'>{intl.formatMessage(messages.statLastWeek)}</option>
                  <option value='days'>{intl.formatMessage(messages.statLastYear)}</option>
                </select>
              </div>
            </Col>
          </Row>
          <Row>
            <Col smallSize={6}>
              <h5 className='text-xs-center'><Icon icon='cpu' size={1} /> {_('statsCpu')}</h5>
              <CpuLineChart data={stats} />
            </Col>
            <Col smallSize={6}>
              <h5 className='text-xs-center'><Icon icon='memory' size={1} /> {_('statsMemory')}</h5>
              <MemoryLineChart data={stats} />
            </Col>
          </Row>
          <br />
          <hr />
          <Row>
            <Col smallSize={6}>
              <h5 className='text-xs-center'><Icon icon='network' size={1} /> {_('statsNetwork')}</h5>
              <VifLineChart data={stats} />
            </Col>
            <Col smallSize={6}>
              <h5 className='text-xs-center'><Icon icon='disk' size={1} /> {_('statDisk')}</h5>
              <XvdLineChart data={stats} />
            </Col>
          </Row>
        </div>
    }
  }
)
