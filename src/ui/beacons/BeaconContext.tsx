import React from 'react';
import { action, observable } from 'mobx';
import { observer, Provider } from 'mobx-react';

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

    render() {
        return (
            <Provider beaconStore={this.beaconStore} beaconInit={this.initializeBeacon}>
                <>
                    {this.props.children}
                    {/* <BeaconItself /> */}
                </>
            </Provider>
        );
    }
}
