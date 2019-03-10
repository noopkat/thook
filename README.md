# tiny github webhooks cli
does not do anything but let you attach a predefined hook to a repo

it's not designed to juggle more than one specific webhook - use a proper cli tool for that, or write against the github api yourself.

this probably won't be actively maintained - no warranty and no guarantees :)

`npm i -g thook`

## commands

**setup** - set your github credentials for attaching webhooks to your repos

`thook setup`

you'll need a personal github token, a sha1 secret for signing the webhook bodies with, and the url of the webhook itself.

**list** - lists the repos you currently have used this tool to attach the webhook to

`thook list`

**add** - add the webhook to a repo

`thook add <repo name>`

**disable** - disable the webhook from running on a repo

`thook disable <repo name>`

**enable** - enable the webhook to run on a repo

`thook enable <repo name>`

**remove** - remove the webhook from a repo

`thook remove <repo name>`

## to uninstall

(will erase all local credentials and the running list, but will not remove the actual webhooks from your repos)

`npm uninstall -g thook`

