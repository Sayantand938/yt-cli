import { program } from 'commander';
import { downloadMedia } from './lib/downloader';
// Removed ansi-colors import if uninstalled

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../package.json');

async function main() {
    program
        .version(version)
        .name("yt-cli")
        .description('A simple CLI tool to download YouTube audio or video using yt-dlp.')
        .argument('<url>', 'The URL of the YouTube video or playlist')
        .option('-a, --audio', 'Download best quality audio (MP3 format)')
        .option('-v, --video', 'Download best quality video up to 1080p (MP4 format)')
        .action(async (url: string, options: { audio?: boolean; video?: boolean }) => {
            const { audio, video } = options;

            // Input validation remains the same
            if ((!audio && !video) || (audio && video)) {
                console.error('Error: Please specify exactly one option: -a (audio) or -v (video).');
                console.log('\nRun "yt-cli --help" for more information.');
                process.exit(1);
            }
            if (!url) {
                 console.error('Error: Please provide a YouTube URL.');
                 console.log('\nRun "yt-cli --help" for more information.');
                 process.exit(1);
            }
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                 console.warn(`Warning: URL "${url}" doesn't look standard. Attempting download anyway.`);
            }

            const type = audio ? 'audio' : 'video';

            try {
                // Removed preparatory message - downloadMedia logs its own start message
                await downloadMedia(url, type);
                // Success message is now inside downloadMedia's 'close' handler
            } catch (error: any) {
                 // Error messages (exit code, failure) are now inside downloadMedia
                 console.error(`\n❌ Download process failed.`); // Keep a simple final error indicator
                process.exit(1);
            }
        });

    // Error handling for invalid commands remains the same
    program.on('command:*', () => {
        console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
        process.exit(1);
    });

    await program.parseAsync(process.argv);

    // Help display logic remains the same
    if (process.argv.slice(2).length === 0) {
        program.outputHelp();
    }
}

main().catch(error => {
    // Catch unexpected errors during setup etc.
    console.error("❌ An unexpected fatal error occurred:", error.message);
    process.exit(1);
});