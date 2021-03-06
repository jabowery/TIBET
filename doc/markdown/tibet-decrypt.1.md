{{topic}}({{section}}) -- decrypt a string using the TDS.decrypt approach
=============================================

## SYNOPSIS

tibet decrypt <string>

## DESCRIPTION

Decrypts a string using the same approach used by the TDS. This command is
provided as a convenience allowing you to read a TDS_CRYPTO_KEY environment
value and then decrypt passwords or API keys to verify them.

Note that you can also set TDS_CRYPTO_SALT to alter the salt value used for the
encryption and decryption processes.

## EXAMPLES

    $ export TDS_CRYPTO_KEY='TOPsecretKEY'
    $ tibet encrypt 'myrestserviceapikey'
    d82d954e44ec4843aeae9846895ad4979b9ff4
    $ tibet decrypt d82d954e44ec4843aeae9846895ad4979b9ff4
    myrestserviceapikey

## SEE ALSO

  * tibet-encrypt(1)
