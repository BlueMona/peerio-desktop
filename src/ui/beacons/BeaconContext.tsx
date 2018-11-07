import React from 'react';
import { action, observable, reaction, IReactionDisposer } from 'mobx';
import { observer, Provider } from 'mobx-react';
import { User } from 'peerio-icebear';
import routerStore from '~/stores/router-store';
import {
    addActivityListener,
    removeActivityListener,
    addActivityListenerWithoutMouseMovement
} from '~/helpers/activity-listeners';
import BeaconItself from './BeaconItself';

@observer
export default class BeaconWrapper extends React.Component<{}> {
    // Reset beacons whenever route changes (no beacons persist between views)
    resetBeaconsReaction: IReactionDisposer;
    componentWillMount() {
        this.resetBeaconsReaction = reaction(
            () => routerStore.currentRoute,
            () => {
                this.resetBeacons();
            }
        );
    }
    componentWillUnmount() {
        this.resetBeaconsReaction();
    }
    resetBeacons = (): void => {
        this.clearBeacons();
        this.clearQueuedBeacons();
        this.clearIncrementQueue();
    };

    // All beacons and their properties are stored here (passed from <Beacon> components)
    @observable beaconStore = {};

    @action.bound
    initializeBeacon(name: string, properties: { [key: string]: any }) {
        if (!this.beaconStore[name]) {
            this.beaconStore[name] = properties;
        }
    }

    // Beacons in queue to be shown to user. 0th item = currently visible.
    @observable activeBeacons: string[] = [];

    // Beacons queued to be pushed to activeBeacons after a timeout.
    @observable beaconsInQueue: string[] = [];

    // This advances the beacon flow (by removing the 0th entry)
    // Optionally, pass the name of the beacon that needs to be activeBeacon in order to trigger the increment
    @action.bound
    increment(beacon?: string) {
        if (!this.activeBeacons.length) return;

        const activeBeacon = this.activeBeacons[0];
        if (!!beacon && activeBeacon !== beacon) return;

        // Mark activeBeacon as seen in User beacons
        this.markAsRead(activeBeacon);

        // Remove activeBeacon from activeBeacons array
        this.activeBeacons.shift();
    }

    // Increment but with a delay passed from component.
    // Optionally, also pass the name of the beacon that needs to be activeBeacon in order to trigger the increment.
    // Delay is reset on user activity (key press, mouse click, mouse movement)
    @observable incrementTimer: NodeJS.Timer;
    @observable incrementDelay: number;
    @observable incrementOnActiveBeacon: string;

    @action.bound
    queueIncrement(delay: number, beacon?: string) {
        this.incrementDelay = delay;
        this.incrementOnActiveBeacon = beacon;
        this.setIncrementTimer();
        addActivityListener(this.setIncrementTimer);
    }

    @action.bound
    setIncrementTimer() {
        if (this.incrementTimer) clearTimeout(this.incrementTimer);
        this.incrementTimer = setTimeout(() => {
            this.increment(this.incrementOnActiveBeacon);
            this.clearIncrementQueue();
        }, this.incrementDelay);
    }

    @action.bound
    clearIncrementQueue() {
        if (this.incrementTimer) {
            clearTimeout(this.incrementTimer);
            this.incrementTimer = null;
        }
        this.incrementTimer = null;
        this.incrementDelay = null;
        this.incrementOnActiveBeacon = null;
        removeActivityListener(this.setIncrementTimer);
    }

    // Mark beacons as read in the user's profile so user is not shown beacons they have dismissed before
    async markAsRead(b: string | string[]): Promise<void> {
        if (typeof b === 'string') {
            User.current.beacons.set(b, true);
        } else {
            b.forEach(beacon => {
                User.current.beacons.set(beacon, true);
            });
        }
        await User.current.saveBeacons();
    }

    // Add beacons to the activeBeacons array. Argument can be string (single beacon) or array.
    @action.bound
    addBeacons(b: string | string[]): void {
        if (typeof b === 'string') {
            this.pushBeacon(b);
        } else {
            b.forEach(beacon => {
                this.pushBeacon(beacon);
            });
        }
    }

    // Push to activeBeacons but check beacon read status in User profile first.
    // Not intended to be called directly; component should use addBeacons or queueBeacons.
    @action.bound
    private async pushBeacon(b: string): Promise<void> {
        const beaconStatus = await User.current.beacons.get(b);
        if (!beaconStatus) {
            this.activeBeacons.push(b);
        }
    }

    // Clear activeBeacons, e.g. if switching to a different beacon flow
    @action.bound
    clearBeacons(): void {
        this.activeBeacons.length = 0;
    }

    // Store the delay for the beacon queue so it can be easily accessed in several functions
    @observable queueDelay: number;

    @action.bound
    queueBeacons(b: string | string[], delay: number) {
        this.clearQueuedBeacons;
        if (typeof b === 'string') {
            this.beaconsInQueue.push(b);
        } else {
            this.beaconsInQueue.concat(b);
        }
        this.queueDelay = delay;
        this.setBeaconTimer();
        addActivityListener(this.setBeaconTimer);
    }

    @action.bound
    clearQueuedBeacons() {
        if (this.beaconTimer) {
            clearTimeout(this.beaconTimer);
            this.beaconTimer = null;
        }
        this.beaconsInQueue.length = 0;
        this.queueDelay = 0;
        removeActivityListener(this.setBeaconTimer);
    }

    // Add beacons from beaconsInQueue to activeBeacons after the delay
    @observable beaconTimer: NodeJS.Timer;
    @action.bound
    setBeaconTimer() {
        if (this.beaconTimer) clearTimeout(this.beaconTimer);
        this.beaconTimer = setTimeout(() => {
            this.addBeacons(this.beaconsInQueue);
            this.clearQueuedBeacons();
        }, this.queueDelay);
    }

    // The Welcome screen beacon has different rules from the other queued beacons.
    // It's identical, except user activity listeners do *not* include mouse movement, only KB.
    @action.bound
    queueFirstBeacon(b: string | string[], delay: number) {
        this.clearQueuedBeacons;
        if (typeof b === 'string') {
            this.beaconsInQueue.push(b);
        } else {
            this.beaconsInQueue.concat(b);
        }
        this.queueDelay = delay;
        this.setBeaconTimer();
        addActivityListenerWithoutMouseMovement(this.setBeaconTimer);
    }

    @observable
    beaconActions = {
        addBeacons: this.addBeacons,
        queueFirstBeacon: this.queueFirstBeacon,
        queueBeacons: this.queueBeacons,
        queueIncrement: this.queueIncrement,
        clearBeacons: this.clearBeacons,
        clearQueuedBeacons: this.clearQueuedBeacons,
        clearIncrementQueue: this.clearIncrementQueue,
        markAsRead: this.markAsRead
    };

    render() {
        return (
            <Provider
                beaconInit={this.initializeBeacon}
                beaconStore={this.beaconStore}
                beaconsActive={this.activeBeacons}
                beaconActions={this.beaconActions}
            >
                <>
                    {this.props.children}
                    <BeaconItself
                        store={this.beaconStore}
                        beaconsActive={this.activeBeacons}
                        onIncrement={this.increment}
                    />
                </>
            </Provider>
        );
    }
}
