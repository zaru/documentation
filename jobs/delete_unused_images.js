const DOCUMENTATION_DIRECTORY = __dirname + '/../';
const IMAGES_DIRECTORY_PATH = DOCUMENTATION_DIRECTORY + 'static/images';
const IMAGE_FILE_REGEX = /.*\.(mp4|jpg|jpeg|png|gif|MP4|JPG|JPEG|PNG|GIF)$/;
const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

console.log('running');
console.log('documentation directory', DOCUMENTATION_DIRECTORY);
console.log('images directory', IMAGES_DIRECTORY_PATH);

/*
function grepWithShell(file, done) {
  const spawn = require("child_process").spawn;
  let res = "";

  const child = spawn("grep", ["-e", process.argv[2], file]);
  child.stdout.on("data", function (buffer) {
    res += buffer.toString();
  });
  child.stdout.on("end", function () {
    done(null, res);
  });
}*/

function countImageReferences(directory, relativeImagePath, done) {
    const spawn = require('child_process').spawn;
    let res = null;

    const child = spawn('sh', ['-c', `ag "${relativeImagePath}" ${directory} --count | wc -l`]);
    child.stdout.on('data', function (buffer) {
        console.log('buffer is', buffer);
        if (buffer !== null) {
            res += buffer.toString();
        }
    });
    child.stdout.on('end', function () {
        done(null, res);
    });
}

async function newCountImageReferences(directory, relativeImagePath, done) {
    let result;
    let error = null;
    try {
        const { stdout, stderr } = await exec(`ag "${relativeImagePath}" ${directory} --count | wc -l`);
        result = stdout;
    } catch (err) {
        console.error(err);
        error = err;
    }
    done(error, result);
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

let checks = 0;

const promises = [];
const filesToDelete = [];

allImageFiles.forEach((absPath) => {
    checks++;
    if (checks > 100) return;
    const match = absPath.match(relativeImageUrlRegex);
    const relativePath = match[1];
    console.log('checking', relativePath);
    promises.push(
        newCountImageReferences(DOCUMENTATION_DIRECTORY, relativePath, (err, result) => {
            console.log('Result for image path', relativePath);
            console.log(result);
            if (parseInt(result) === 0) {
                filesToDelete.push(absPath);
            }
        })
    );
});

Promise.all(promises).then(() => {
    console.log('unused image count:', filesToDelete.length);
});
