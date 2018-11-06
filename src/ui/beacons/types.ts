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
