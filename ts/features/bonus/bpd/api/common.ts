import { RequestHeaderProducer } from "italia-ts-commons/lib/requests";

export const bpdHeadersProducers = <
  P extends {
    readonly Authorization: string;
  }
>() =>
  ((p: P) => ({
    // since these headers are not correctly autogenerated we have to access them as an anonymous object
    Authorization: `Bearer ${(p as any).Bearer}`
  })) as RequestHeaderProducer<P, "Authorization">;
