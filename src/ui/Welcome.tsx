import React from 'react';
import { observer } from 'mobx-react';
import T from '~/ui/shared-components/T';
import beaconStore from '~/stores/beacon-store';

@observer
export default class Welcome extends React.Component {
    componentWillMount() {
        beaconStore.queueFirstBeacon('contact', 2000);
    }

    componentWillUnmount() {
        beaconStore.clearQueuedBeacons();
    }

    render() {
        return (
            <div className="welcome">
                <div className="text-container">
                    <T k="title_zeroFirstLoginTitleDesktop" className="heading" />
                    <T k="title_zeroFirstLoginMessage" className="subtitle" />
                    <T k="title_learnFollowWalkthrough" className="small-print" />
                </div>
                <div className="image-container">
                    <div className="illustration" />
                </div>
            </div>
        );
    }
}
