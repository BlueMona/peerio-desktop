import React from 'react';
import { computed } from 'mobx';
import { inject, observer } from 'mobx-react';
import css from 'classnames';

import { SpotBeaconProps, AreaBeaconProps } from './types';

@inject('beaconActions')
@observer
export default class Beacon extends React.Component<SpotBeaconProps | AreaBeaconProps> {
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
