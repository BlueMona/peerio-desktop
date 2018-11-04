/*
    These are the events for components that are shared between multiple views.
    Since they appear in more than one place, they need to know the current route for the `Sublocation` prop.
    Thus, they need to react to the routerStore.currentRoute value.
*/

import { setup } from '~/telemetry/main';
import routerStore from '~/stores/router-store';
import { DurationEvent, TextInputEvent, ValidatedInputObject } from '~/telemetry/types';
import { telemetry } from 'peerio-icebear';
const { duration, S, errorMessage } = telemetry;

function context() {
    const { ROUTES, currentRoute } = routerStore;
    const routeNames = {
        [ROUTES.login]: 'Sign In',
        [ROUTES.signup]: 'Onboarding',
        [ROUTES.about]: 'About'
    };
    return routeNames[currentRoute] || 'Unknown route';
}

const shared = setup({
    // ValidatedInput
    validatedInputOnFocus: (obj: ValidatedInputObject): TextInputEvent => {
        if (!obj) return null;

        return [
            S.TEXT_INPUT,
            {
                item: S[obj.item],
                location: S[obj.location],
                sublocation: S[obj.sublocation],
                state: S.IN_FOCUS
            }
        ];
    },

    validatedInputOnBlur: (obj: ValidatedInputObject, errorMsg: string): TextInputEvent => {
        if (!obj) return null;

        // We're only sending onBlur events if the input is errored
        if (!errorMsg) return null;

        // Sign Up page "Username Not Available" is reported onError; do not send onBlur.
        const c = context();
        if (c === 'Onboarding' && errorMsg === 'error_usernameNotAvailable') return null;

        // On Login do not show "wrong AK" text input error; that should be handled by login event itself
        if (c === S.SIGN_IN && errorMsg === 'error_wrongAK') return null;

        return [
            S.TEXT_INPUT,
            {
                item: S[obj.item],
                location: S[obj.location],
                sublocation: S[obj.sublocation],
                state: S.ERROR,
                errorType: errorMessage(errorMsg)
            }
        ];
    },

    validatedInputOnClear: (obj: ValidatedInputObject) => {
        if (!obj) return null;

        return [
            S.CLEAR_TEXT,
            {
                item: S[obj.item],
                location: S[obj.location],
                sublocation: S[obj.sublocation]
            }
        ];
    },

    // Account Key download
    downloadAk: obj => {
        return [
            S.DOWNLOAD,
            {
                item: S.ACCOUNT_KEY,
                location: S[obj.location],
                sublocation: S[obj.sublocation]
            }
        ];
    },

    confirmDownloadAk: obj => {
        return [
            S.DOWNLOAD_CONFIRM,
            {
                item: S.ACCOUNT_KEY,
                location: S[obj.location],
                sublocation: S[obj.sublocation]
            }
        ];
    },

    cancelDownloadAk: obj => {
        return [
            S.DOWNLOAD_CANCEL,
            {
                item: S.ACCOUNT_KEY,
                location: S[obj.location],
                sublocation: S[obj.sublocation]
            }
        ];
    },

    // LegalDialog
    openTermsDialog: () => {
        return [
            S.READ_MORE,
            {
                item: S.TERMS_OF_USE,
                location: context()
            }
        ];
    },

    openPrivacyDialog: () => {
        return [
            S.READ_MORE,
            {
                item: S.PRIVACY_POLICY,
                location: context()
            }
        ];
    },

    durationTermsDialog: (startTime: number): DurationEvent => {
        return [
            S.DURATION,
            {
                location: context(),
                item: S.TERMS_OF_USE,
                totalTime: duration(startTime)
            }
        ];
    },

    durationPrivacyDialog: (startTime: number): DurationEvent => {
        return [
            S.DURATION,
            {
                location: context(),
                item: S.PRIVACY_POLICY,
                totalTime: duration(startTime)
            }
        ];
    },

    lawEnforcementLink: [
        S.VIEW_LINK,
        {
            item: S.LAW_ENFORCEMENT_GUIDE,
            location: context()
        }
    ]
});

export default shared;
