import {
  NonEmptyString,
  OrganizationFiscalCode
} from "italia-ts-commons/lib/strings";
import { some } from "fp-ts/lib/Option";
import { validateOptionalEither } from "../validateOptionalEither";

const optionOfEither = (value: string) =>
  some(value)
    .filter(NonEmptyString.is)
    .map(_ => OrganizationFiscalCode.decode(_));

describe("validateOptionalEither", () => {
  it("should return undefined if optionOfEither is an empty string", () => {
    expect(validateOptionalEither(optionOfEither(""))).toBe(undefined);
  });
  it("should return false if optionOfEither does not pass the validation", () => {
    expect(validateOptionalEither(optionOfEither("1"))).toBe(false);
  });
  it("should return true if optionOfEither pass the validation", () => {
    expect(validateOptionalEither(optionOfEither("12345678901"))).toBe(true);
  });
});
