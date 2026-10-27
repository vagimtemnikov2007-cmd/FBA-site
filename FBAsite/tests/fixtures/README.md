# Test fixture sources

`catalog/`: the eleven original public animation JSONs referenced by the
FBA catalog at `https://fba-server.onrender.com/animations`, downloaded for
compatibility checks before the Cloudflare migration. They are test data,
not replacement animations selected by card title.

`mod/`: grow_up, cartoon, keyframe_pop and keyframe_fade_in from the user's
provided `FBA-1.4-RC3-Hotfix1-MC26.3.jar`, under
`assets/fresh-blocks-animation/animations/`.

The Vite production bundle does not include these fixtures. The local
integration API reads them explicitly and does not connect to real services.
