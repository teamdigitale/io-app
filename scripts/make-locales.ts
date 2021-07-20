/* eslint-disable no-console */
/**
 * This script converts the translations from the "locales"
 * directory into a typescript file that can be bundled with
 * the app and fed to react-native-i18n.
 *
 * During the conversion, the script selects one locale as the
 * "master" locale (defaults to "en").
 * For the non-master locales the script throws an error if there
 * are missing or extra keys compared to the master locale.
 *
 * The script accepts the following env vars:
 *
 * I18N_IGNORE_LOCALE_ERRORS=1    Ignore locale validation errors.
 * I18N_MASTER_LOCALE=it          Sets a different master locale.
 */

import * as path from "path";
import chalk from "chalk";
import * as fs from "fs-extra";
import * as yaml from "js-yaml";
import * as flat from "flat";

interface LocaleDoc {
  locale: string;
  doc: any;
}

interface LocaleDocWithKeys extends LocaleDoc {
  keys: ReadonlyArray<string>;
}

/**
 * Custom YAML type for including files
 */
const IncludeYamlType = (includeRoot: string) =>
  new yaml.Type("!include", {
    kind: "scalar",

    resolve: (data: any) =>
      data !== null &&
      typeof data === "string" &&
      path // included file must be under includeRoot
        .normalize(path.join(includeRoot, data))
        .startsWith(path.normalize(includeRoot)) &&
      fs.statSync(path.join(includeRoot, data)).isFile(),

    construct: data => fs.readFileSync(path.join(includeRoot, data)).toString(),

    instanceOf: String,

    represent: (data: any) => String(data)
  });

/**
 * Reads a locale document.
 *
 * TODO: support including files (e.g. markdown docs)
 */
export async function readLocaleDoc(
  rootPath: string,
  locale: string
): Promise<LocaleDoc> {
  const localePath = path.join(rootPath, locale);
  const filename = path.join(localePath, "index.yml");
  const content = await fs.readFile(filename);
  const doc = yaml.safeLoad(content.toString(), {
    filename,
    json: false,
    schema: yaml.Schema.create(IncludeYamlType(localePath))
  });
  return {
    locale,
    doc
  };
}

/**
 * Extracts all the translation keys from a parsed yaml
 */
export function extractKeys(
  subDoc: any,
  base: string = ""
): ReadonlyArray<string> {
  const baseWithDelimiter = base.length > 0 ? `${base}.` : "";
  const keys = Object.keys(subDoc);
  const terminalKeys = keys
    .filter(k => typeof subDoc[k] === "string")
    .map(k => baseWithDelimiter + k);
  const nonTerminalKeys = keys.filter(k => typeof subDoc[k] === "object");
  const subKeys = nonTerminalKeys.map(k =>
    extractKeys(subDoc[k], baseWithDelimiter + k)
  );
  const flatSubKeys = subKeys.reduce((acc, ks) => acc.concat(ks), []);
  return terminalKeys.concat(flatSubKeys).sort();
}

/**
 * Returns all elements in a that are not in b
 */
function keyDiff(a: ReadonlyArray<string>, b: ReadonlyArray<string>) {
  return a.filter(k => b.indexOf(k) < 0);
}

/**
 * Compares the keys of a locale with the master keys.
 *
 * Returns the keys in the master that are missing in the locale
 * and the extra keys in the locale that are not present in master.
 */
function compareLocaleKeys(
  masterKeys: ReadonlyArray<string>,
  localeKeys: ReadonlyArray<string>
) {
  const missing = keyDiff(masterKeys, localeKeys);
  const extra = keyDiff(localeKeys, masterKeys);
  return {
    missing,
    extra
  };
}

// eslint-disable-next-line sonarjs/cognitive-complexity
async function run(): Promise<void> {
  try {
    const root = path.join(__dirname, "../locales");
    const leader = "leader";
    const follower = "follower";

    const localeDocs = await Promise.all(
      [leader, follower].map(async l => await readLocaleDoc(root, l))
    );
    const localeKeys: ReadonlyArray<LocaleDocWithKeys> = localeDocs.map(d => ({
      ...d,
      keys: extractKeys(d.doc)
    }));

    // the master locale is the first one
    const leaderKeys = localeKeys[0];
    const followerKeys = localeKeys[1];
    const checkedLocaleKeys = compareLocaleKeys(
      leaderKeys.keys,
      followerKeys.keys
    );
    if (checkedLocaleKeys.missing.length > 0) {
      console.log(
        `- the ${chalk.red(
          "follower"
        )} locales is missing the keys:\n${checkedLocaleKeys.missing.join(
          "\n"
        )}`
      );
    }
    console.log("-".repeat(10));
    if (checkedLocaleKeys.extra.length > 0) {
      console.log(
        `- the ${chalk.red(
          "follower"
        )} locales has keys that are not present in ${chalk.blueBright(
          "leader"
        )}:\n${checkedLocaleKeys.extra.join("\n")}`
      );
    }
    console.log("-".repeat(10));
    const leaderKeysAndValues: any = flat(localeDocs[0]);
    const followerKeysAndValues: any = flat(localeDocs[1]);
    console.log("the following keys have different values:\n");
    Object.keys(leaderKeysAndValues).forEach(k => {
      if (
        followerKeysAndValues[k] !== undefined &&
        leaderKeysAndValues[k] !== followerKeysAndValues[k]
      ) {
        console.log(`- ${chalk.red(k)}`);
        console.log(`\t leader: *${leaderKeysAndValues[k]}*`);
        console.log(`\t follower: *${followerKeysAndValues[k]}*`);
        console.log("-".repeat(5));
      }
    });
  } catch (e) {
    console.log(chalk.red(e.message));
  }
}

run().then(
  () => console.log("done"),
  () => process.exit(1)
);
