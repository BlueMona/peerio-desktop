import React from 'react';
import { observer } from 'mobx-react';

@observer
export default class BeaconWrapper extends React.Component<{}> {
    render() {
        return this.props.children;
    }
}
