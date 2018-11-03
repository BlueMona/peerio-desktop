const React = require('react');
const PlusIcon = require('~/ui/shared-components/PlusIcon');
const Beacon = require('~/ui/shared-components/Beacon').default;
const { observer } = require('mobx-react');

@observer
class PlusIconBeaconed extends React.Component {
    render() {
        return (
            <Beacon
                name={this.props.beaconName}
                type="spot"
                size={48}
                offsetX={100}
                className="chatlist-plusicon-beacon"
                onContentClick={this.props.onClick}
            >
                <PlusIcon {...this.props} />
            </Beacon>
        );
    }
}

module.exports = PlusIconBeaconed;
