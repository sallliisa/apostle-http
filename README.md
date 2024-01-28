(pretty readme in progress)
Apostle is an HTTP client that is based off of the Fetch API that is supported on modern browsers and node.js.
Apostle is written with performance in mind. Less processing overhead, and less memory footprint.

Apostle's design revolves around the lifecycle of a request, with quality-of-life features such as:
  - Automatically infer request Content-Type header based off of data that is being passed
  - Automatically infer data type from received data based off of response Content-Type header
  - Merging of multiple RequestInit objects that makes sense
  - ...other things you expect an HTTP client would do, among other things such as:
    - Intercept requests
    - Custom handler for fulfilled and failed requests
    - Automatically parse query parameters

Since Apostle is based off of the Fetch API, it uses the browser-standard RequestInit object to configure the behaviour of each request. Gone are the days for the need to look up the docs for each library to learn what each option does, since you probably already have it of the top of your head.
