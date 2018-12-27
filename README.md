# InventBox WebGL Video Tutorial Course

This repository contains the code used in the WebGL tutorial series, organized by video.

__Watch the [video playlist](https://www.youtube.com/playlist?list=PL2935W76vRNHFpPUuqmLoGCzwx_8eq5yK) on Youtube.__

These tutorials require using a basic HTTP web server since they load resources
via Fetch API (AJAX).
There are *many* options. The first ten tutorials each have a NodeJS Express 
server in the project folder, but any server may be used.

My recommendation:

```
python -m http.server 8000
```

No installation needed, provided Python 3.x is already installed

Or, for Python 2: `python2 -m SimpleHTTPServer 8000`
