{{topic}}({{section}}) -- displays the current project and TIBET version
=============================================

## SYNOPSIS

tibet version [--check]

## SYNOPSIS

Displays the current version of TIBET. Also available as the
--version flag on the 'tibet' command (tibet --version).

Use --check to request this command to check whether a newer
version of TIBET has been published.

## OPTIONS

  * `--check` :
    Tell TIBET to check the current project TIBET version against the latest
released version. This operation relies on `npm info tibet --json` to return
data about publicly available TIBET releases.

## EXAMPLES

### Display the current application and TIBET version data

    $ tibet version

    hello 0.1.0 running on TIBET v5.0.0-dev.7

### Check on whether there's a newer release of TIBET available

    $ tibet version --check

    Your current version v5.0.0-dev.7 is the latest.

If a new version is available you'll see something similar to:

    Version v5.0.0-dev.11 is available. You have v5.0.0-dev.7


### View the current mapping for the TIBET latest-release file

    $ tibet config path.lib_version_latest

    http://www.technicalpursuit.com/tibet/latest.js

## SEE ALSO

  * tibet-config(1)
