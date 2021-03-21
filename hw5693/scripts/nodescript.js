const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const zlib = require('zlib');
const gzip = zlib.createGzip();

let scanDirectoryAbsolutePath = process.argv[2];

console.log(scanDirectoryAbsolutePath);


let autocompress = async (absolutePath, deepLevel) => {
  if(deepLevel === 1) {
    console.log(`Autocompress started`);
  }

  let directoryFiles = [];

  //find directory content
  try {
    console.log(`Scanning directory started: ${absolutePath}`);
    directoryFiles = await fsPromises.readdir(absolutePath);//files is an array of the names of the files in the directory excluding '.' and '..'.
    console.log(`Scanning directory ended: ${absolutePath}, found files/directories:`);
    console.log(directoryFiles);
  }
  catch (error) {
    if(error.code === 'ENOENT') {
      console.log(`Directory ${absolutePath} doesn't exist, please, try again`);
    }
    else {
      console.log(`Error occured, please, try again`, error);
    }
  }

  //check directory items
  for (let i = 0; i < directoryFiles.length; i++) {
    let item = directoryFiles[i];
    let itemAbsolutePath = path.resolve(absolutePath, item);
    //miss files ending with .gz
    if( !(/^.+\.gz$/).test(item) ) {

      try {
        let itemStat = await fsPromises.stat(itemAbsolutePath);

        if(itemStat.isDirectory()) {
          await autocompress(itemAbsolutePath, deepLevel + 1);
        }
        else if(itemStat.isFile()) {
          //The mtime property is updated when you write data to the file.
          //However, the value of ctime is only changed when you update the file's metadata, like the file name or access rights.
          let itemMDate = itemStat.mtimeMs;

          let isGzippedCopyExists = directoryFiles.indexOf(`${item}.gz`) > -1;
          let itemGzippedAbsolutePath = path.resolve(absolutePath, `${item}.gz`);
          let needGzip = true;

          if(isGzippedCopyExists) {
            try {
              let itemGzippedStat = await fsPromises.stat(itemGzippedAbsolutePath);
              let itemGzippedBitrhDate = itemGzippedStat.birthtimeMs;

              if(itemGzippedBitrhDate >  itemMDate)
                needGzip = false;
            }
            catch (error) {
              console.log(error)
              console.log(`Can't get info about ${itemGzippedAbsolutePath}`);
            }
          };


          if( !isGzippedCopyExists || needGzip) {
            if(isGzippedCopyExists ) {
              console.log(`Gzipped file needs updating`);
              console.log(`Start deleting old version ${itemGzippedAbsolutePath}`);
              await fsPromises.unlink(itemGzippedAbsolutePath)
              console.log(`End deleting old version ${itemGzippedAbsolutePath}`);
            }
            else {
              console.log(`Gzipped file doesn't exist, need creating: ${itemGzippedAbsolutePath}`);
            };

            const input = fs.createReadStream(itemAbsolutePath);
            const output = fs.createWriteStream(itemGzippedAbsolutePath);
            console.log(`Start gzipping ${itemAbsolutePath} into ${itemGzippedAbsolutePath}`);
            input.pipe(gzip).pipe(output);
            console.log(`End gzipping ${itemAbsolutePath} into ${itemGzippedAbsolutePath}`);
            //закрыть поток записи, если в чтении ошибка
            input.on('error', () => {
              output.end();
              console.log(`Error occured gzipping ${itemAbsolutePath} into ${itemGzippedAbsolutePath}`);
            });
          }
          else {
            console.log(`Gzipped file exists and doesn't need to be updated: ${itemAbsolutePath}`);
          }

        }
      }
      catch (error) {
        console.log(error)
        console.log(`Can't get info about ${itemAbsolutePath}`);
      }
    }
    else {
      console.log(`Is gzipped file/directory, skip: ${itemAbsolutePath}`);
    }

  };

  if(deepLevel === 1) {
    console.log(`Autocompress ended`);
  };
};

autocompress(scanDirectoryAbsolutePath, 1);