import React from 'react';
import { observer, inject } from 'mobx-react';
import T from '~/ui/shared-components/T';

@inject('beaconActions')
@observer
export default class Welcome extends React.Component<{ beaconActions?: any }> {
    componentWillMount() {
        this.props.beaconActions.queueFirstBeacon('contact', 2000);
    }

    componentWillUnmount() {
        this.props.beaconActions.clearQueuedBeacons();
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
