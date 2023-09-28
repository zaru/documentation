const DOCUMENTATION_DIRECTORY = __dirname + '/../';
const IMAGES_DIRECTORY_PATH = DOCUMENTATION_DIRECTORY + 'static/images';
const IMAGE_FILE_REGEX = /.*\.(mp4|jpg|jpeg|png|gif|MP4|JPG|JPEG|PNG|GIF)$/;
const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const os = require('os');

const cpuCount = os.cpus().length;
console.log('running');
console.log('documentation directory', DOCUMENTATION_DIRECTORY);
console.log('images directory', IMAGES_DIRECTORY_PATH);

async function newCountImageReferences(directory, relativeImagePaths) {
    const resultsByImagePath = {};
    const promises = [];
    let promiseLimit = cpuCount;
    for (let i = 0; i < relativeImagePaths.length; i++) {
        if (promises.length > promiseLimit) {
            await Promise.all(promises);
            promiseLimit += cpuCount;
        }
        const imagePath = relativeImagePaths[i];
        promises.push(
            exec(`ag "${imagePath}" ${directory} --count | wc -l`)
                .then(({ stdout, stderr }) => {
                    resultsByImagePath[imagePath] = { error: stderr, result: stdout };
                    if (i % 25 === 0) {
                        console.log(`${i} of ${relativeImagePaths.length} checked`);
                    }
                })
                .catch((e) => {
                    console.error(e);
                })
        );

        /*
        let result;
        let error = null;
        try {
            const { stdout, stderr } = await exec(`ag "${imagePath}" ${directory} --count | wc -l`);
            result = stdout;
            error = stderr;
        } catch (err) {
            console.error(err);
            error = err;
        }
        resultsByImagePath[imagePath] = { error, result };
        if (i % 25 === 0) {
            console.log(`${i} of ${relativeImagePaths.length} checked`);
        }
        */
    }
    return resultsByImagePath;
}

function buildFileList(directory) {
    let files = [];
    fs.readdirSync(directory).forEach((file) => {
        const absolute = path.join(directory, file);
        if (fs.statSync(absolute).isDirectory()) {
            files = [...files, ...buildFileList(absolute)];
        } else {
            if (IMAGE_FILE_REGEX.test(absolute)) {
                files.push(absolute);
            }
        }
    });
    return files;
}

const relativeImageUrlRegex = /.*\/static\/images\/(.*)/;

const allImageFiles = buildFileList(IMAGES_DIRECTORY_PATH);
console.log('image files found: ', allImageFiles.length);

const promises = [];
const filesToDelete = [];

const relativeImagePaths = allImageFiles.map((absPath) => {
    const match = absPath.match(relativeImageUrlRegex);
    const relativePath = match[1];
    return relativePath;
});

newCountImageReferences(DOCUMENTATION_DIRECTORY, relativeImagePaths).then((resultsByImagePath) => {
    const filesToDelete = [];
    Object.keys(resultsByImagePath).forEach((imagePath) => {
        if (parseInt(resultsByImagePath[imagePath].result) === 0) {
            filesToDelete.push(imagePath);
        }
    });
    console.log('Number of unused images found: ', filesToDelete.length);
});
