import React from 'react';
import { inject, observer } from 'mobx-react';
import css from 'classnames';
import { BeaconActionsProps } from '~/ui/beacons/BeaconWrapper';

interface BeaconBaseProps {
    name: string;
    title?: string; // if no title, will check t('title_${name}_beacon')
    description?: string; // if no description, will use t('description_${name}_beacon')
    className?: string; // applied to the beacon itself. needed for styling, since beacon is portaled to appRoot.
    offsetX?: number;
    offsetY?: number;
    onBeaconClick?: () => void;

    /** Required for Provider. Intended to be used with @inject only. */
    beaconActions?: BeaconActionsProps;
}

export interface SpotBeaconProps extends BeaconBaseProps {
    type: 'spot';
    position?: 'right' | 'left'; // position of the bubble
    size?: number; // force a certain bubble size
    onContentClick?: () => void;
}

export interface AreaBeaconProps extends BeaconBaseProps {
    type: 'area';
    arrowPosition?: 'top' | 'right' | 'bottom' | 'left'; // position of the arrow on the rectangle
    arrowDistance?: number; // how far along the side of the rectangle to place the arrow, as a percentage
}

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
    originalChild = React.Children.only(this.props.children);

    clonedChildContent = React.cloneElement(this.originalChild, {
        ...this.props,
        className: css(this.originalChild.props.className, `__beacon-target-id-${this.props.name}`)
    });

    render() {
        return this.clonedChildContent;
    }
}
