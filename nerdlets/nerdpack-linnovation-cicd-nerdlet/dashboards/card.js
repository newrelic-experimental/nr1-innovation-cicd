import React from 'react'
import PropTypes from 'prop-types'
import { Card } from 'nr1'
import Section from './card-section'

const card = ({ title, subtitle, sections, wide }) => {
  const width = sections.length > 1 ? sections.length * (wide ? 10 : 6) : 12
  return (
    <Card
      className={
        'card__container' +
        `${sections.length > 1 ? ' multi-stack' : ' single-stack'}`
      }
      style={{ width: `${width}` + 'rem' }}
    >
      <div className="card__container-title-bar">
        <div className="card__container-title">{title}</div>
      </div>
      <div className="card__container-subtitle">{subtitle}</div>
      <div className="card__section-group">
        {sections.map((section, idx) => {
          return <Section section={section} multi={idx > 0 && true} />
        })}
      </div>
    </Card>
  )
}

card.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  sections: PropTypes.array.isRequired,
}

export default card
