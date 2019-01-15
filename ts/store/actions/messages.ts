/**
 * Action types and action creator related to the Messages.
 */

import {
  ActionType,
  createAction,
  createAsyncAction,
  createStandardAction
} from "typesafe-actions";

import { MessageWithContentPO } from "../../types/MessageWithContentPO";

export const loadMessageSuccess = createStandardAction("MESSAGE_LOAD_SUCCESS")<
  MessageWithContentPO
>();

export const loadMessageFailure = createStandardAction("MESSAGE_LOAD_FAILURE")<
  Error
>();

export const loadMessageWithRelationsAction = createStandardAction(
  "MESSAGE_WITH_RELATIONS_LOAD_REQUEST"
)<string>();

export const loadMessageWithRelationsSuccessAction = createStandardAction(
  "MESSAGE_WITH_RELATIONS_LOAD_SUCCESS"
)();

export const loadMessageWithRelationsFailureAction = createAction(
  "MESSAGE_WITH_RELATIONS_LOAD_FAILURE",
  resolve => (error: Error) => resolve(error, { error: true })
);

export const loadMessages = createAsyncAction(
  "MESSAGES_LOAD_REQUEST",
  "MESSAGES_LOAD_SUCCESS",
  "MESSAGES_LOAD_FAILURE"
)<void, ReadonlyArray<string>, string>();

export const loadMessagesCancel = createStandardAction(
  "MESSAGES_LOAD_CANCEL"
)();

export const setMessageReadState = createAction(
  "MESSAGES_SET_READ",
  resolve => (id: string, read: boolean) => resolve({ id, read }, { id, read })
);

export type MessagesActions =
  | ActionType<typeof loadMessageSuccess>
  | ActionType<typeof loadMessageFailure>
  | ActionType<typeof loadMessageWithRelationsAction>
  | ActionType<typeof loadMessageWithRelationsSuccessAction>
  | ActionType<typeof loadMessageWithRelationsFailureAction>
  | ActionType<typeof loadMessages>
  | ActionType<typeof loadMessagesCancel>
  | ActionType<typeof setMessageReadState>;
