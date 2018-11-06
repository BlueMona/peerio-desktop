import React from 'react';
import { action, observable } from 'mobx';
import { observer, Provider } from 'mobx-react';

export interface BeaconActionsProps {
    activeBeacon: string;
    activateBeacon: (option: string) => void;
}

@observer
export default class BeaconWrapper extends React.Component<{}> {
    @observable activeBeacon: string;

    @action.bound
    activateBeacon(option: string): void {
        this.activeBeacon = option;
    }

    beaconActions: BeaconActionsProps = {
        activeBeacon: this.activeBeacon,
        activateBeacon: this.activateBeacon
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
