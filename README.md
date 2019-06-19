# particles-demo

Demonstration of Maxwell-Boltzmann speed distribution for particles in a box

## Table of Contents

*   [Usage](#usage)
*   [Options](#options)
*   [Note](#note)
*   [Issues with Chrome](#issues-with-chrome)

## Usage

1.  Open `index.html` with a modern web browser.

    *   **WARNING**: Internet Explorer is not supported, and using it may lead
        to unexpected behaviors.
    *   Note: Chrome cannot run this program properly when the program is
        executed as a local file. More information can be found on
        [Issues with Chrome](#issues-with-chrome) section of this file.

1.  Open debug console. Typically it is bound to `F12` on keyboard.

1.  Execute

    ```javascript
    simulate()
    ```

    or

    ```javascript
    simulate({
      tMax: 10000,
      dt: 50,
      n: 100,
      ...
    })
    ```

    More options can be found on [Options](#options) section of this file.

1.  The simulator terminates after `tMax` (default: 10,000) milliseconds. If
    you want to stop the simulation earlier, you can use the return value of
    `simulate()` function, like the code below.

    ```javascript
    let instance
    instance = simulate()

    // Stopping the simulation
    instance.terminate()
    ```

## Options

| Name        | Default     | Description                                    |
|:-----------:|:-----------:|------------------------------------------------|
| `width`     | `320`       | Box width (px)                                 |
| `height`    | `240`       | Box height (px)                                |
| `r`         | `2`         | Particle radius (px)                           |
| `tMax`      | `10000`     | Max simulation time (ms)                       |
| `dt`        | `50`        | Time interval between screen refreshes (ms)    |
| `timestamp` | `10`        | Number of screen refreshes between timestamps  |
| `n`         | `100`       | Number of particles                            |
| `vMean`     | `0.08`      | Target mean speed of particles (px/ms) \*      |
| `dist`      | `'uniform'` | Speed distribution of particles (uniform / delta) |
| `bins`      | `Math.ceil(Math.log2(n)) + 1` | Number of screen refreshes between timestamps |
| `xMax`      | `3 * vMean` | Max value of x in histogram plot               |
| `yMax`      | `1.5 * pdf(vMean)` \*\* | Max value of y in histogram plot   |

\* `vMean` may not be equal to actual mean speed of the particles.\
\*\* `pdf()` is the Maxwell-Boltzmann distribution function.

## Note

`simulate()` function returns the web worker object responsible for
calculating positions and velocities of the particles.

## Issues with Chrome

*   Note: If you are running the code in a web server, this section does not
    apply to you. The program will work as expected without any modifications.

Chrome does not allow web worker script from local files to be executed. A
workaround is present, and implemented in files in the `chrome` branch.

How to Download Files in `chrome` Branch:

1.  Visit the [git repository](https://github.com/clarkindy/particles-demo).
1.  Above the list of files, find the button named "Branch: **master**"
1.  Among the dropdown list of branches, find "chrome".
1.  On the right side of the button showing branches, click "Clone or
    download".
1.  Click "Download ZIP".
