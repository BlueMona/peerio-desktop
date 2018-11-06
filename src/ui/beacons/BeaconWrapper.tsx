import React from 'react';
import { action, observable } from 'mobx';
import { observer, Provider } from 'mobx-react';

import { BeaconActionsProps, BeaconCombinedProps } from './types';

@observer
export default class BeaconWrapper extends React.Component<{}> {
    // Store all possible beacons in here (passed from <Beacon> components)
    @observable beaconStore = {};

    @action.bound
    initializeBeacon(name: string, properties: { [key: string]: any }) {
        if (!this.beaconStore[name]) {
            this.beaconStore[name] = properties;
        }
    }

    // Currently active beacon(s)
    @observable activeBeacon: string;

    @action.bound
    activateBeacon(option: string): void {
        this.activeBeacon = option;
    }

    beaconActions: BeaconActionsProps = {
        activeBeacon: this.activeBeacon,
        activateBeacon: this.activateBeacon,
        initializeBeacon: this.initializeBeacon
    };

    render() {
        return (
            <Provider
                beaconActions={this.beaconActions}
                beaconStore={this.beaconStore}
                beaconInit={this.initializeBeacon}
            >
                <>
                    {this.props.children}
                    {/* <BeaconItself /> */}
                </>
            </Provider>
        );
    }
}
