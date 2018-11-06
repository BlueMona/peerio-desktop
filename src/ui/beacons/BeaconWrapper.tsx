import React from 'react';
import { action, observable } from 'mobx';
import { observer, Provider } from 'mobx-react';

import { BeaconActionsProps, BeaconCombinedProps } from './types';

@observer
export default class BeaconWrapper extends React.Component<{}> {
    @observable activeBeacon: string;

    @action.bound
    activateBeacon(option: string): void {
        this.activeBeacon = option;
    }

    @action.bound
    initializeBeacon(name: string, properties: BeaconCombinedProps) {}

    beaconActions: BeaconActionsProps = {
        activeBeacon: this.activeBeacon,
        activateBeacon: this.activateBeacon,
        initializeBeacon: this.initializeBeacon
    };

    render() {
        return (
            <Provider beaconActions={this.beaconActions}>
                <>
                    {this.props.children}
                    {/* <BeaconItself /> */}
                </>
            </Provider>
        );
    }
}
