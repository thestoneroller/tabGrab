# Tab Grab

Copy URLs from multiple tabs at once

Tired of your tabs being a whole mess? Tab Grab is here to help you effortlessly view, search, select, and copy URLs from all your open browser tabs! No cap, it's gonna makes things a lot faster, fr fr.

## Fire features: 🔥

- **List & Search**: Get a clean list of all your open tabs. Need a specific one? Just search it up! It's that easy.

- **Select & Copy**: Select individual tabs, all of them, or just the ones you want. Copy those URLs (and titles!) as Plain Text(.txt), Markdown(.md), JSON or CSV. Perfect for sharing with your bruzz, saving for later, or doing some mysterious and important work.

- **Stay Organized**: Group your tabs by website domain to see all the related pages together. Filter to see only your pinned tabs for quick access.

- **Jump To Tab**: Need to get back to a specific tab? Just click on it in the Tab Grab list to switch instantly.

- **Looksmaxxing UI**: Tab Grab adapts to your browser's light or dark theme for a seamless look.

## Installation

#### Chrome Web Store

[![Tab Grab - Chrome](https://img.shields.io/chrome-web-store/v/jcblcjolcojmfopefcighfmkkefbaofg?label=Tab%20Grab%20-%20Chrome&style=for-the-badge)](https://chromewebstore.google.com/detail/tab-grab/jcblcjolcojmfopefcighfmkkefbaofg)

#### Firefox Add-ons

[![Tab Grab - Firefox](https://img.shields.io/amo/v/tab-grab?label=Tab%20Grab%20-%20Firefox&style=for-the-badge)](https://addons.mozilla.org/en-US/firefox/addon/tab-grab/)

### Build from source

To use this extension by building it from the source code, follow these steps:

1.  Clone the repository:
    ```bash
    git clone https://github.com/thestoneroller/tabGrab.git
    cd tabGrab
    ```

2.  Install the dependencies. This project uses `pnpm` as the package manager.
    ```bash
    pnpm install
    ```

3.  Build the extension:
    ```bash
    # For Chrome and other Chromium-based browsers
    pnpm run build

    # For Firefox
    pnpm run build:firefox
    ```

4.  The packaged extension will be available in the `.output` directory. You can then load it as an unpacked extension in your browser's extension management page.

## Development

To set up the development environment:

1.  Follow steps 1 and 2 from the "Build from source" section.

2.  Run the development server:
    ```bash
    # For Chrome and other Chromium-based browsers
    pnpm run dev

    # For Firefox
    pnpm run dev:firefox
    ```

3.  This will create an `unpacked` directory inside the `.output` directory. Load this directory into your browser to install the development version of the extension.

## Contributing

Contributions are welcome! If you have any ideas, suggestions, or bug reports, please open an issue or submit a pull request.

## License

This project is licensed under the AGPLv3 License. See the [LICENSE](LICENSE) file for details.