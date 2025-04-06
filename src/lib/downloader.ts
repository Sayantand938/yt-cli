import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';

type DownloadType = 'audio' | 'video';

async function ensureDirExists(dirPath: string): Promise<void> {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error: any) {
        console.error(`Error creating directory ${dirPath}:`, error.message);
        throw error;
    }
}

export async function downloadMedia(url: string, type: DownloadType): Promise<void> {
    const homeDir = os.homedir();
    const downloadsDir = path.join(homeDir, 'Downloads');
    const outputParentDir = type === 'audio'
        ? path.join(downloadsDir, 'Music')
        : path.join(downloadsDir, 'Videos');

    await ensureDirExists(outputParentDir);

    console.log(`Starting ${type} download for: ${url}`);
    console.log(`Output directory: ${outputParentDir}`);

    const outputTemplate = path.join(outputParentDir, '%(title)s.%(ext)s');

    // Get the expected filename before downloading
    const getFilenameArgs = ['-o', outputTemplate, '--print', 'filename', url];
    const filename = await getOutputFromYtDlp(getFilenameArgs);
    
    console.log(`🎵 Downloading: ${filename.trim()}`);

    const args: string[] = [
        '-q', '--progress',
        '-o', outputTemplate,
        '--no-warnings',
        '--no-simulate',
        '--embed-metadata',
        '--restrict-filenames',
    ];

    if (type === 'audio') {
        args.push('-x', '--audio-format', 'opus', '-f', 'bestaudio/best');
    } else {
        args.push(
            '-f', 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4][height<=1080]/best[height<=1080]',
            '--merge-output-format', 'mp4'
        );
    }

    args.push(url);
    const ytDlpPath = 'yt-dlp';

    console.log(`Executing: ${ytDlpPath} ${args.join(' ')}`);

    return new Promise((resolve, reject) => {
        const process = spawn(ytDlpPath, args, { stdio: 'inherit' });

        process.on('close', (code) => {
            console.log('');
            if (code === 0) {
                console.log(`✅ Download successful! Check ${outputParentDir}`);
                console.log(`📁 Saved as: ${filename.trim()}`);
                resolve();
            } else {
                console.error(`❌ yt-dlp process exited with code ${code}.`);
                console.error(`❌ Failed to download ${type} for ${url}.`);
                reject(new Error(`yt-dlp failed with exit code ${code}`));
            }
        });

        process.on('error', (err) => {
            console.error(`❌ Failed to start yt-dlp process: ${err.message}`);
            if ((err as any).code === 'ENOENT') {
                console.error("   'yt-dlp' command not found. Please ensure it is installed and in your system's PATH.");
            }
            reject(err);
        });
    });
}

// Helper function to get the expected filename
async function getOutputFromYtDlp(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const ytDlpPath = 'yt-dlp';
        const process = spawn(ytDlpPath, args, { stdio: ['ignore', 'pipe', 'ignore'] });

        let output = '';
        process.stdout.on('data', (data) => {
            output += data.toString();
        });

        process.on('close', (code) => {
            if (code === 0) {
                resolve(output.trim());
            } else {
                reject(new Error(`Failed to get filename from yt-dlp`));
            }
        });

        process.on('error', (err) => reject(err));
    });
}
