/*************************************************************************
* ADOBE CONFIDENTIAL
* ___________________
*
* Copyright 2019 Adobe
* All Rights Reserved.
*
* NOTICE: All information contained herein is, and remains
* the property of Adobe and its suppliers, if any. The intellectual
* and technical concepts contained herein are proprietary to Adobe
* and its suppliers and are protected by all applicable intellectual
* property laws, including trade secret and copyright laws.
* Dissemination of this information or reproduction of this material
* is strictly forbidden unless prior written permission is obtained
* from Adobe.
**************************************************************************/

import classNames from 'classnames';
import createId from '../../utils/createId';
import CSSTransition from 'react-transition-group/CSSTransition';
import React from 'react';
import ReactDOM from 'react-dom';
import Timer from '../../utils/timer';
import Toast from './Toast';
import {TOAST_CONTAINERS, TOAST_PLACEMENT} from './state';
import TransitionGroup from 'react-transition-group/TransitionGroup';
import '../style/index.styl';

const TOAST_TIMEOUT = 5000;
const TOAST_ANIMATION_TIME = 200;

/**
 * @type {Map<Toast, {Timer, int}>}
 * Maps allow us to use objects as keys
 * timer - a Timer object
 * id - a unique integer to identify the toast by, used
 *   to keep the key so React doesn't clobber our DOM and
 *   cause use to lose focus while other elements are
 *   being removed around it
 */
const TOAST_DATA = new Map;

export class ToastContainer extends React.Component {
  state = {
    placement: TOAST_PLACEMENT,
    toasts: []
  };

  timerAction(toast, action) {
    if (TOAST_DATA.has(toast)) {
      let timer = TOAST_DATA.get(toast).timer;
      if (timer) {
        timer[action]();
      }
    }
  }

  add(toast, timeout = TOAST_TIMEOUT) {
    if (timeout < 0) {
      timeout = TOAST_TIMEOUT;
    }
    TOAST_DATA.set(toast, {
      timer: timeout === 0 ? null : new Timer(this.remove.bind(this, toast), timeout),
      id: createId()
    });

    this.setState({
      toasts: [...this.state.toasts, toast]
    });
  }

  remove(toast, e) {
    const {toasts: currentToasts} = this.state;
    const toasts = currentToasts.filter(t => t !== toast);

    if (toasts.length !== currentToasts.length && toast.props.onClose) {
      toast.props.onClose(e);
    }

    this.setState({toasts});

    this.timerAction(toast, 'pause');
    TOAST_DATA.delete(toast);
  }

  onFocus(toast, e) {
    this.timerAction(toast, 'pause');
    if (toast.props.onFocus) {
      toast.props.onFocus();
    }
  }

  onBlur(toast, e) {
    this.timerAction(toast, 'resume');
    if (toast.props.onBlur) {
      toast.props.onBlur();
    }
  }

  render() {
    let [position, containerPlacement] = this.state.placement.split(' ');
    let className = classNames(
      'react-spectrum-ToastContainer',
      `react-spectrum-ToastContainer--${position}`,
      containerPlacement && `react-spectrum-ToastContainer--${containerPlacement}`,
    );

    return (
      <TransitionGroup className={className}>
        {this.state.toasts.map((toast) =>
          (<CSSTransition key={TOAST_DATA.get(toast).id} classNames={`react-spectrum-Toast-slide-${position}`} timeout={TOAST_ANIMATION_TIME}>
            {React.cloneElement(toast, {
              onClose: this.remove.bind(this, toast),
              onFocus: this.onFocus.bind(this, toast),
              onBlur: this.onBlur.bind(this, toast)
            })}
          </CSSTransition>)
        )}
      </TransitionGroup>
    );
  }
}

function createToastNode(container) {
  let parent = container || document.querySelector('.react-spectrum-provider') || document.body;
  let node = document.createElement('div');
  parent.appendChild(node);
  return node;
}

function ensureToastContainer(container, callback) {
  let toastContainer = TOAST_CONTAINERS.get(container);

  // Make sure that toastContainer is a real DOM node, not only a memory footprint of previously cached node.
  if (toastContainer && document.body.contains(ReactDOM.findDOMNode(toastContainer))) {
    callback(toastContainer);
  } else {
    let toastContainerRef;
    ReactDOM.render(<ToastContainer ref={ref => toastContainerRef = ref} />, createToastNode(container), () => {
      TOAST_CONTAINERS.set(container, toastContainerRef);
      callback(toastContainerRef);
    });
  }
}

export function addToast(toast, timeout, container) {
  ensureToastContainer(container, toastContainer => toastContainer.add(toast, timeout));
}

export function removeToast(toast, container) {
  ensureToastContainer(container, toastContainer => toastContainer.remove(toast));
}

export function success(message, options = {}) {
  addToast(<Toast closable variant="success" {...options}>{message}</Toast>, options.timeout, options.container);
}

export function warning(message, options = {}) {
  addToast(<Toast closable variant="warning" {...options}>{message}</Toast>, options.timeout, options.container);
}

export function error(message, options = {}) {
  addToast(<Toast closable variant="error" {...options}>{message}</Toast>, options.timeout, options.container);
}

export function info(message, options = {}) {
  addToast(<Toast closable variant="info" {...options}>{message}</Toast>, options.timeout, options.container);
}
