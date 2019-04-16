import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { Lockup } from '../lockup/Lockup'
import LogoSvg from './logo.svg'
import styles from './Logo.styl'

const sizes = ['small', 'medium']
const baseClassName = 'logo'
const iconClassName = `${baseClassName}-icon`
const lockupClassName = `${baseClassName}-lockup`

class Logo extends PureComponent {
  render() {
    const { kicker, heading, size, className } = this.props

    return (
      <h1 className={classNames(styles[baseClassName], className)}>
        <LogoIcon size={size} />
        <LogoLockup kicker={kicker} heading={heading} size={size} />
      </h1>
    )
  }
}

Logo.propTypes = {
  kicker: PropTypes.string,
  heading: PropTypes.string,
  className: PropTypes.string,
  size: PropTypes.oneOf(sizes)
}

class LogoIcon extends PureComponent {
  render() {
    const { size, className } = this.props

    return (
      <LogoSvg
        className={classNames(
          styles[iconClassName],
          size && styles[`${iconClassName}--${size}`],
          className
        )}
      />
    )
  }
}

LogoIcon.propTypes = {
  className: PropTypes.string,
  size: PropTypes.oneOf(sizes)
}

class LogoLockup extends PureComponent {
  render() {
    const { kicker, heading, size, className } = this.props

    return (
      <Lockup
        className={classNames(
          styles[lockupClassName],
          size && styles[`${lockupClassName}--${size}`],
          className
        )}
        heading={heading}
        kicker={kicker}
        element="span"
      />
    )
  }
}

LogoLockup.defaultProps = {
  kicker: 'Destiny',
  heading: 'Clan Warfare'
}

LogoLockup.propTypes = {
  kicker: PropTypes.string,
  heading: PropTypes.string,
  className: PropTypes.string,
  size: PropTypes.oneOf(sizes)
}

export { Logo, LogoIcon, LogoLockup }
