/*
    For the sake of being user-friendly, this component is called "Beacon" because this is what
    will actually be used when you want to add a beacon somewhere in the app.

    However, this is just a wrapper around the child content which
        1. returns the child content with an added className for the actual beacon to target
        2. passes its own properties up to the Provider controlled by BeaconContext

    The functionality/render/etc. of the beacon itself is handled by component BeaconItself.
    The naming is weird but no one should ever have to directly call BeaconItself.
*/

import React from 'react';
import { computed } from 'mobx';
import { inject, observer } from 'mobx-react';
import css from 'classnames';

import { BeaconCombinedProps } from './types';

// Subset of beacon properties that are relevant to render (to pass to Provider)
const beaconRenderPropNames = [
    'type',
    'title',
    'description',
    'offsetX',
    'offsetY',
    'position',
    'size',
    'arrowPosition',
    'arrowDistance',
    'onBeaconClick',
    'onContentClick'
];

@inject('beaconStore', 'beaconInit')
@observer
export default class Beacon extends React.Component<BeaconCombinedProps> {
    // Immediately pass this Beacon's properties to the beacon store in Provider
    constructor(props) {
        super(props);

        const renderProps = {};
        beaconRenderPropNames.forEach(p => {
            if (props[p]) {
                renderProps[p] = props[p];
            }
        });

        props.beaconInit(props.name, renderProps);
    }

    /*
        We clone the child content, giving it a `__beacon-target-id` class.
        This allows us to get its dimensions without needing a wrapper <div>

        `React.Children.only` fails if children is >1 node (i.e. React.Fragment w/ many children)
        This makes sense because we need to be able to measure the size of a *single* element
        So this whole component will error if it wraps multiple children.
    */
    @computed
    get clonedChildContent() {
        const originalChild = React.Children.only(this.props.children);
        return React.cloneElement(originalChild, {
            className: css(originalChild.props.className, `__beacon-target-id-${this.props.name}`)
        });
    }

    render() {
        return this.clonedChildContent;
    }
}
