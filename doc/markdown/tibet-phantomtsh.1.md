{{topic}}({{section}}) -- runs a TIBET Shell (TSH) expression in PhantomJS
=============================================

## SYNOPSIS

phantomjs phantomtsh.js [--script <script>] [--url <url>] [--profile <profile>] [--timeout <timeout>] [--help] [<flags>]

## DESCRIPTION

Runs phantomjs to load TIBET and execute a TIBET Shell (TSH) script.

Leveraged by other TIBET command-line utilities such as 'tibet tsh' or
'tibet test' to access TIBET Shell functionality from the command line.

Use --script to define the TSH script to run, quoting as needed for your
particular shell. For example, --script ':echo "Hi"'

You can use --profile to alter the profile used regardless of the boot URL.
Using a different boot profile is the best way to alter what code TIBET will
load prior to running your script. The profile value should match the form
used on a TIBET launch URL: namely a config.xml@id pattern pointing to the
manifest file and config tag you want to use as your boot profile.

You should not normally need to alter the url used to boot TIBET however
use --url to point to a different boot URL if you find that necessary.
The URL must point to a valid TIBET-enabled boot file to work properly.
A good test is trying to load your intended boot URL directly from an HTML5
browser. If TIBET can boot it into a supported browser from the file system
it should function properly inside of PhantomJS.

--params allows you to provide a URL-encoded string suitable for use as
a set of parameters for the URL to be used. Examples might be adding a
logging level by using --params 'boot.level=debug' as a param string.

--timeout allows you to change the default idle timeout from 5 seconds to
some other value specified in milliseconds (5000 is 5 seconds). Note that
the timeout is an idle timeout meaning it is reset any time output is sent
to PhantomJS. There is no maximum amount of time an operation can run but
output must be sent to PhantomJS within the timeout period.

Additional <flags> for this command include:
    [--color]   - Colorizes the output in the terminal. [true]
    [--errimg]  - Capture PhantomError_{ts}.png onError. [false]
    [--errexit] - Exit the PhantomJS execution onError. [false]
    [--ok]      - When outputting TAP form, include 'ok'. [true]
    [--tap]     - Specifies test anything protocol format. [false]
    [--debug]   - Activates additional debugging output. [false]
    [--quiet]   - Silences startup/finish message display. [false]
    [--system]  - Activates system-level message display. [false]
    [--level]   - Sets the TIBET logging level filter. [ERROR]
    [--help]    - Outputs this content along with the usage string.
    [--usage]   - Outputs the usage string.

## SEE ALSO

  * tibet-tsh(1)
