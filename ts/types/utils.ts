// tslint:disable:readonly-array

import { Pot } from "italia-ts-commons/lib/pot";
import { Effect } from "redux-saga/effects";
import { PayloadAC, PayloadMetaAC } from "typesafe-actions/dist/type-helpers";

export type SagaCallReturnType<
  T extends (...args: any[]) => any,
  R = ReturnType<T>
> = R extends Generator<infer _, infer B0, infer _>
  ? B0
  : R extends Iterator<infer B | Effect>
    ? B
    : R extends IterableIterator<infer B1 | Effect>
      ? B1
      : R extends Promise<infer B2> ? B2 : never;

/**
 * Extracts the type of the payload of a typesafe action
 */
export type PayloadForAction<A> = A extends PayloadAC<any, infer P>
  ? P
  : A extends PayloadMetaAC<any, infer P1, any> ? P1 : A;

/**
 * Converts the types of a success and failure actions to a Pot type
 */
export type PotFromActions<S, F> = Pot<
  PayloadForAction<S>,
  PayloadForAction<F>
>;

/**
 * Ensure that all the keys of type T are required, transforming all optional field of kind T | undefined to T
 */
export type RequiredAll<T> = { [K in keyof T]-?: T[K] };
