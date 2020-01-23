const { promises: fs, existsSync } = require('fs')
const path = require('path')
const err = require('./error')

const { spawn } = require('child_process');
const ls = spawn('ls', ['-lh', '/usr']);

ls.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

ls.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

ls.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});

const dirMKVToolNix = 'C:/Program Files/MKVToolNix'
const mkvextract = 'mkvextract.exe'
const mkvinfo = 'mkvinfo.exe'
const mkvmerge = 'mkvmerge.exe'

const checkMKVTool = async () => {
  if (!existsSync(dirMKVToolNix)) throw new Error(err.NO_MKV_TOOL)
  if (!existsSync(path.join(dirMKVToolNix, mkvextract))) throw new Error(err.NO_MKV_TOOL)
  if (!existsSync(path.join(dirMKVToolNix, mkvinfo))) throw new Error(err.NO_MKV_TOOL)
  if (!existsSync(path.join(dirMKVToolNix, mkvmerge))) throw new Error(err.NO_MKV_TOOL)

}

checkMKVTool()
