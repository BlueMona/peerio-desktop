import React from 'react';
import ReactDOM from 'react-dom';
import { action, computed, observable, reaction, when, IReactionDisposer } from 'mobx';
import { inject, observer } from 'mobx-react';
import css from 'classnames';
import { t } from 'peerio-translator';
import beaconStore from '~/stores/beacon-store';
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
    @computed
    get active() {
        return beaconStore.activeBeacon === this.props.name;
    }

    // We make a lot of calculations based on child content size and position
    // `contentRef` stores the ref for the .beacon-container component which contains the child content
    @observable contentRef;
    @observable rendered = false;

    // Clone the child content, passing its ref to `contentRef`
    // This allows us to measure its dimensions without needing to wrap it in another div
    @observable childContent;
    @action.bound
    setChildContent() {
        const originalChild = React.Children.only(this.props.children) || null;
        if (!originalChild) return;

        this.childContent = React.cloneElement(originalChild, {
            key: `beacon-target-${this.props.name}`,
            className: css(originalChild.props.className, `__beacon-target-id-${this.props.name}`)
        });
    }

    render() {
        if (!this.active && !this.rendered) return this.props.children;
        return this.childContent;
    }
}
