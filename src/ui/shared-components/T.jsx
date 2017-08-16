/**
 * Component
 *
 * Usage:
 *
 * in translations file:
 * "key":"some text <link>bla</> and a var {count}
 *
 * in React component:
 *
 * <T k="key">
 *      {{ count: 5, link: text=> <a>{text}</a>}}
 * </T>
 */
const React = require('react');
const { t } = require('peerio-translator');

function T(props) {
    return React.createElement(
        props.tag || 'span',
        { className: props.className, style: props.style },
        ...t(props.k, props.children)
    );
}

module.exports = T;
