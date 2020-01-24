const logger = require('@touno-io/debuger')('translate')
const { promises: fs, existsSync } = require('fs')
const path = require('path')
const err = require('./error')
const yargs = require('yargs')

// const { spawn } = require('child_process');
// const ls = spawn('ls', ['-lh', '/usr']);

// ls.stdout.on('data', (data) => {
//   console.log(`stdout: ${data}`);
// });

// ls.stderr.on('data', (data) => {
//   console.error(`stderr: ${data}`);
// });

// ls.on('close', (code) => {
//   console.log(`child process exited with code ${code}`);
// });

 

const dirMKVToolNix = 'C:/Program Files/MKVToolNix'
const mkvextract = 'mkvextract.exe'
const mkvinfo = 'mkvinfo.exe'
const mkvmerge = 'mkvmerge.exe'

const avgGetListMKV = async () => {
  let data = []
  for await (const file of yargs.argv._) {
    if (existsSync(file)) {
      const stat = await fs.stat(file)
      if (stat.isDirectory()) {
        for await (const list of await fs.readdir(file)) {
          if (path.extname(list) === '.mkv') data.push(path.join(file, list))
        }
      } else {
        data.push(file)
      }
    }
  }
  return data
}

const checkMKVTool = async () => {
  if (!existsSync(dirMKVToolNix)) throw new Error(err.NO_MKV_TOOL)
  if (!existsSync(path.join(dirMKVToolNix, mkvextract))) throw new Error(err.NO_MKV_TOOL)
  if (!existsSync(path.join(dirMKVToolNix, mkvinfo))) throw new Error(err.NO_MKV_TOOL)
  if (!existsSync(path.join(dirMKVToolNix, mkvmerge))) throw new Error(err.NO_MKV_TOOL)

  let anime = await avgGetListMKV()
  console.log(anime)
}

checkMKVTool().catch(logger.error)

// mkvinfo.exe C:/Users/GoogleDrive/Sync.Office-Central/test2_subtitle.mkv

// + EBML head
// |+ EBML version: 1
// |+ EBML read version: 1
// |+ Maximum EBML ID length: 4
// |+ Maximum EBML size length: 8
// |+ Document type: matroska
// |+ Document type version: 4
// |+ Document type read version: 2
// + Segment: size 126022734
// |+ Seek head (subentries will be skipped)
// |+ EBML void: size 4012
// |+ Segment information
// | + Timestamp scale: 1000000
// | + Multiplexing application: no_variable_data
// | + Writing application: no_variable_data
// | + Duration: 00:23:55.059000000
// | + Date: Thu Jan 01 00:00:00 1970 UTC
// | + Segment UID: 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00
// |+ Tracks
// | + Track
// |  + Track number: 1 (track ID for mkvmerge & mkvextract: 0)
// |  + Track UID: 1
// |  + Track type: video
// |  + Lacing flag: 0
// |  + Minimum cache: 1
// |  + Codec ID: V_MPEG4/ISO/AVC
// |  + Codec's private data: size 47 (H.264 profile: Main @L3.0)
// |  + Default duration: 00:00:00.041708333 (23.976 frames/fields per second for a video track)
// |  + Language: und
// |  + Video track
// |   + Pixel width: 720
// |   + Pixel height: 480
// |   + Display width: 853
// |   + Display height: 480
// | + Track
// |  + Track number: 2 (track ID for mkvmerge & mkvextract: 1)
// |  + Track UID: 2
// |  + Track type: audio
// |  + Codec ID: A_AAC
// |  + Codec's private data: size 2
// |  + Default duration: 00:00:00.021333333 (46.875 frames/fields per second for a video track)
// |  + Language: und
// |  + Audio track
// |   + Sampling frequency: 48000
// |   + Channels: 2
// | + Track
// |  + Track number: 3 (track ID for mkvmerge & mkvextract: 2)
// |  + Track UID: 3
// |  + Track type: subtitles
// |  + Forced track flag: 1
// |  + Lacing flag: 0
// |  + Codec ID: S_TEXT/ASS
// |  + Codec's private data: size 629
// |  + Name: English
// |+ EBML void: size 1129
// |+ Attachments
// | + Attached
// |  + File name: OpenSans-Semibold.ttf
// |  + MIME type: application/x-truetype-font
// |  + File data: size 221328
// |  + File UID: 1
// |+ Cluster
// mkvextract.exe tracks C:/Users/GoogleDrive/Sync.Office-Central/test2_subtitle.mkv 2:asdasd.srt
