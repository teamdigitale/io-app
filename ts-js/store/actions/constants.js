/**
 * All the actions related costants.
 */
// Application
export const APPLICATION_INITIALIZED = 'APPLICATION_INITIALIZED';
export const APP_STATE_CHANGE_ACTION = 'APP_STATE_CHANGE_ACTION';
// Session
export const IDP_SELECTED = 'IDP_SELECTED';
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGIN_FAILURE = 'LOGIN_FAILURE';
export const SESSION_INITIALIZE_SUCCESS = 'SESSION_INITIALIZE_SUCCESS';
// Onboarding
export const ONBOARDING_CHECK_TOS = 'ONBOARDING_CHECK_TOS';
export const ONBOARDING_CHECK_PIN = 'ONBOARDING_CHECK_PIN';
export const TOS_ACCEPT_REQUEST = 'TOS_ACCEPT_REQUEST';
export const TOS_ACCEPT_SUCCESS = 'TOS_ACCEPT_SUCCESS';
export const PIN_CREATE_REQUEST = 'PIN_CREATE_REQUEST';
// Profile
export const PROFILE_LOAD_REQUEST = 'PROFILE_LOAD_REQUEST';
export const PROFILE_LOAD_SUCCESS = 'PROFILE_LOAD_SUCCESS';
export const PROFILE_LOAD_FAILURE = 'PROFILE_LOAD_FAILURE';
export const PROFILE_UPDATE_REQUEST = 'PROFILE_UPDATE_REQUEST';
export const PROFILE_UPDATE_SUCCESS = 'PROFILE_UPDATE_SUCCESS';
export const PROFILE_UPDATE_FAILURE = 'PROFILE_UPDATE_FAILURE';
// Costants for actions that need UI state reducers
export const FetchRequestActions = {
    PROFILE_LOAD: 'PROFILE_LOAD',
    PROFILE_UPDATE: 'PROFILE_UPDATE'
};
//# sourceMappingURL=constants.js.map