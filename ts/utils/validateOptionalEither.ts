import { Option } from "fp-ts/lib/Option";
import { Either } from "fp-ts/lib/Either";
import { Errors } from "io-ts";

export function validateOptionalEither<T>(
  optionOfEither: Option<Either<Errors, T>>
): true | false | undefined {
  return optionOfEither
    .map<true | false | undefined>(e =>
      e.fold(
        _ => false,
        _ => true
      )
    )
    .getOrElse(undefined);
}
