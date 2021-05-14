import React from 'react'
import PropTypes from 'prop-types'
import { NrqlQuery, BlockText, Spinner } from 'nr1'

const cardSection = ({ section }) => {
  const renderSection = (loading, label, value) => {
    return (
      <div
        className={'card__section' + `${section.multi ? 'multi' : ''}`}
        style={{ width: section.wide ? '10rem' : '6rem' }}
      >
        {loading ? (
          <div>
            <Spinner type={Spinner.TYPE.DOT} />
          </div>
        ) : (
          <div
            className={
              'card__section-data' +
              `${section.threshold ? ' ' + section.threshold() : ''}`
            }
          >
            {value}
          </div>
        )}
        <BlockText className="card__section-label">{label}</BlockText>
      </div>
    )
  }

  if (section.query) {
    return (
      <NrqlQuery accountId={section.accountId} query={section.query}>
        {({ loading, data }) => {
          if (loading) return renderSection(true)
          if (data) {
            let value = data && data[0] ? data[0].data[0].y : 0
            value = section.formatter ? section.formatter(value) : value

            return renderSection(false, section.label, value ? value : 0)
          }

          return <></>
        }}
      </NrqlQuery>
    )
  } else {
    return renderSection(false, section.label, section.value)
  }
}

cardSection.propTypes = {
  section: PropTypes.shape({
    query: PropTypes.string.isRequired,
    accountId: PropTypes.number,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    label: PropTypes.string,
    formatter: PropTypes.func,
    styles: PropTypes.object,
    wide: PropTypes.bool,
    threshold: PropTypes.func,
    multi: PropTypes.bool,
  }),
}

export default cardSection
